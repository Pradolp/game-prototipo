/**
 * Gera src/data/valid.ts e src/data/answers.ts. Veja docs/WORDLIST.md.
 *
 *   npm run build:wordlist                        # usa o snapshot de frequência versionado
 *   npm run build:wordlist -- --refresh-frequency # recontar a partir do Tatoeba atual
 *
 * Tudo que é baixado é tratado como dado não confiável: fica em .wordlist-cache/,
 * nunca é executado, e só passam para o repositório palavras que casam com WORD_PATTERN.
 */
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import {
  ANSWER_ONLY_EXCLUSIONS,
  CONJUGATED_ENDING_KEEP,
  CONJUGATED_ENDINGS,
  EVERYWHERE_EXCLUSIONS,
  normalizeWord,
  PREFERRED_DISPLAY_FORMS,
} from './wordlist-exclusions.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE_DIR = join(ROOT, '.wordlist-cache')
const FREQUENCY_FILE = join(ROOT, 'scripts/data/tatoeba-por-freq.tsv')
const DATA_DIR = join(ROOT, 'src/data')

const VERO_COMMIT = '4f1df64b2e8e14751aa7c2205d170ca016071315'
const VERO_BASE = `https://raw.githubusercontent.com/LibreOffice/dictionaries/${VERO_COMMIT}/pt_BR`
const VERO_FILES = {
  'pt_BR.dic': 'a38bfb26b68ece2834e79fe83e48d5792652970ace12db89d1b9674bf9933183',
  'pt_BR.aff': '21d8ad2a769a60e17e2b5ea4ef11d4d593a58b9e2a82d642ef82d6a4c5523865',
} as const
const TATOEBA_URL = 'https://downloads.tatoeba.org/exports/per_language/por/por_sentences.tsv.bz2'

const MAX_DOWNLOAD_BYTES = 64 * 1024 * 1024
const FORBIDDEN_FLAG = 'ý'
const NO_SUGGEST_FLAG = 'Ý'
const MAX_SUFFIX_DEPTH = 2
/** Mínimo de ocorrências no corpus para uma palavra virar resposta. */
const MIN_ANSWER_COUNT = 5
const WORD_PATTERN = /^\p{Ll}+$/u
const PLAIN_FIVE_LETTERS = /^[a-z]{5}$/

interface AffixRule {
  strip: string
  add: string
  flags: string[]
  condition: RegExp
}

interface AffixGroup {
  kind: 'PFX' | 'SFX'
  cross: boolean
  rules: AffixRule[]
}

type AffixTable = Map<string, AffixGroup>

const flagsOf = (text: string | undefined): string[] => [...(text ?? '')]

export function parseAff(text: string): AffixTable {
  const table: AffixTable = new Map()
  for (const line of text.split('\n')) {
    const fields = line.replace(/#.*$/, '').trim().split(/\s+/)
    const [kind, flag] = fields
    if ((kind !== 'PFX' && kind !== 'SFX') || !flag) continue
    const group = table.get(flag)
    if (!group) {
      table.set(flag, { kind, cross: fields[2] === 'Y', rules: [] })
      continue
    }
    const [add = '', addFlags] = (fields[3] ?? '').split('/')
    const condition = fields[4] ?? '.'
    group.rules.push({
      strip: fields[2] === '0' ? '' : (fields[2] ?? ''),
      add: add === '0' ? '' : add,
      flags: flagsOf(addFlags),
      condition: new RegExp(kind === 'SFX' ? `${condition}$` : `^${condition}`, 'u'),
    })
  }
  return table
}

function applyRule(word: string, kind: AffixGroup['kind'], rule: AffixRule): string | null {
  if (!rule.condition.test(word)) return null
  if (kind === 'SFX') {
    if (!word.endsWith(rule.strip)) return null
    return word.slice(0, word.length - rule.strip.length) + rule.add
  }
  if (!word.startsWith(rule.strip)) return null
  return rule.add + word.slice(rule.strip.length)
}

interface Form {
  word: string
  flags: string[]
  /** Pode receber prefixo: todos os sufixos aplicados permitem combinação. */
  cross: boolean
}

function expandSuffixes(table: AffixTable, start: Form, depth: number, out: Form[]): void {
  out.push(start)
  if (depth === 0) return
  for (const flag of start.flags) {
    const group = table.get(flag)
    if (group?.kind !== 'SFX') continue
    for (const rule of group.rules) {
      const word = applyRule(start.word, 'SFX', rule)
      if (word === null) continue
      const next = { word, flags: rule.flags, cross: start.cross && group.cross }
      expandSuffixes(table, next, depth - 1, out)
    }
  }
}

/** Gera todas as formas de uma entrada do .dic, como o `unmunch` do Hunspell. */
export function expandEntry(table: AffixTable, stem: string, flags: string[]): Form[] {
  const suffixed: Form[] = []
  expandSuffixes(table, { word: stem, flags, cross: true }, MAX_SUFFIX_DEPTH, suffixed)
  const forms = [...suffixed]
  for (const flag of flags) {
    const group = table.get(flag)
    if (group?.kind !== 'PFX') continue
    for (const rule of group.rules) {
      const bases = group.cross ? suffixed.filter((form) => form.cross) : suffixed.slice(0, 1)
      for (const base of bases) {
        const word = applyRule(base.word, 'PFX', rule)
        if (word !== null) forms.push({ ...base, word })
      }
    }
  }
  return forms
}

interface Lexicon {
  /** Formas minúsculas de 5 letras, depois da normalização. */
  words: Set<string>
  /** Marcadas como NOSUGGEST no VERO: nunca viram resposta. */
  noSuggest: Set<string>
  /** Formas geradas só a partir de verbos, sem contar infinitivo e particípio. */
  verbOnly: Set<string>
  rejectedProperNouns: number
}

const isVerbStem = (stem: string, forms: Form[]): boolean => {
  const gerund = `${stem.slice(0, -1)}ndo`
  return (
    /(?:[aeio]r|ôr)$/.test(stem) && forms.some(({ word }) => word === gerund || word === 'pondo')
  )
}

/** `afogá`, `trazê`, `compô`: só existem antes de clítico (`afogá-lo`), nunca sozinhos. */
const isCliticStem = (stem: string, form: string): boolean => {
  if (/(?:ver|ler)$/.test(stem) || form.length !== stem.length - 1) return false
  return /[áêô]$/.test(form) && normalizeWord(stem).startsWith(normalizeWord(form))
}

export function buildLexicon(dicText: string, table: AffixTable): Lexicon {
  const words = new Set<string>()
  const noSuggest = new Set<string>()
  const forbidden = new Set<string>()
  const verbForms = new Set<string>()
  const otherForms = new Set<string>()
  let rejectedProperNouns = 0
  for (const line of dicText
    .replace(/^\uFEFF/, '')
    .split('\n')
    .slice(1)) {
    const entry = line.split(/\s/)[0]?.normalize('NFC')
    if (!entry) continue
    const [stem = '', flagText] = entry.split('/')
    // Inicial maiúscula = nome próprio; tudo maiúsculo = sigla.
    if (stem !== stem.toLowerCase()) {
      rejectedProperNouns += 1
      continue
    }
    const flags = flagsOf(flagText)
    const expanded = expandEntry(table, stem, flags)
    const isVerb = isVerbStem(stem, expanded)
    for (const { word } of expanded) {
      const form = word.normalize('NFC')
      if (!WORD_PATTERN.test(form) || !PLAIN_FIVE_LETTERS.test(normalizeWord(form))) continue
      if (isVerb && isCliticStem(stem, form)) continue
      const isBaseForm = form === stem || /[ai]d[oa]s?$/.test(form)
      ;(isVerb && !isBaseForm ? verbForms : otherForms).add(form)
      if (flags.includes(FORBIDDEN_FLAG)) forbidden.add(form)
      else if (flags.includes(NO_SUGGEST_FLAG)) noSuggest.add(form)
      words.add(form)
    }
  }
  for (const form of forbidden) words.delete(form)
  const verbOnly = new Set([...verbForms].filter((form) => !otherForms.has(form)))
  return { words, noSuggest, verbOnly, rejectedProperNouns }
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${response.status}`)
  const body = Buffer.from(await response.arrayBuffer())
  if (body.length > MAX_DOWNLOAD_BYTES) throw new Error(`Arquivo grande demais: ${url}`)
  return body
}

const sha256 = (data: Buffer): string => createHash('sha256').update(data).digest('hex')

async function fetchVero(name: keyof typeof VERO_FILES): Promise<string> {
  const path = join(CACHE_DIR, name)
  const cached = await readFile(path).catch(() => null)
  const body = cached ?? (await download(`${VERO_BASE}/${name}`))
  if (sha256(body) !== VERO_FILES[name]) {
    throw new Error(`SHA-256 inesperado em ${name}: a fonte mudou. Revise antes de atualizar.`)
  }
  if (!cached) await writeFile(path, body)
  return body.toString('utf8')
}

async function refreshFrequency(words: Set<string>): Promise<void> {
  const archive = await download(TATOEBA_URL)
  const archivePath = join(CACHE_DIR, 'por_sentences.tsv.bz2')
  await writeFile(archivePath, archive)
  const { stdout } = await promisify(execFile)('bzip2', ['-dc', archivePath], {
    maxBuffer: 512 * 1024 * 1024,
    encoding: 'utf8',
  })
  const counts = new Map<string, number>()
  for (const line of stdout.split('\n')) {
    const text = line.split('\t')[2]?.normalize('NFC')
    // Só tokens em minúsculas: "Maria" e "Paulo" não contam como palavras comuns.
    // O hífen faz parte do token: `afogá-lo` não pode contar como `afogá`.
    for (const token of text?.match(/\p{L}+(?:-\p{L}+)*/gu) ?? []) {
      if (words.has(token)) counts.set(token, (counts.get(token) ?? 0) + 1)
    }
  }
  const rows = [...counts]
    .sort(([a, x], [b, y]) => y - x || a.localeCompare(b, 'pt-BR'))
    .map(([word, count]) => `${word}\t${count}`)
  const header = [
    '# Contagem de palavras nas frases em português do Tatoeba (https://tatoeba.org).',
    '# Licença dos dados: CC BY 2.0 FR. Veja public/THIRD_PARTY_NOTICES.txt.',
    `# Export: ${TATOEBA_URL}`,
    `# SHA-256 do export: ${sha256(archive)}`,
    `# Baixado em: ${new Date().toISOString().slice(0, 10)}`,
  ]
  await writeFile(FREQUENCY_FILE, `${[...header, ...rows].join('\n')}\n`)
}

async function readFrequency(words: Set<string>): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  for (const line of (await readFile(FREQUENCY_FILE, 'utf8')).split('\n')) {
    if (!line || line.startsWith('#')) continue
    const [word = '', count = '0'] = line.split('\t')
    if (words.has(word)) counts.set(word, Number(count))
  }
  return counts
}

const accentCount = (word: string): number =>
  word.normalize('NFD').length - normalizeWord(word).length

/**
 * Regra de colisão: vale a forma mais frequente no corpus; no empate, a de menos
 * acentos; persistindo o empate, a primeira em ordem alfabética. Formas em
 * PREFERRED_DISPLAY_FORMS vencem sempre.
 */
export function pickDisplayForms(
  words: Iterable<string>,
  counts: ReadonlyMap<string, number>,
): { display: Map<string, string>; collisions: string[][] } {
  const groups = new Map<string, string[]>()
  for (const word of words) {
    const key = normalizeWord(word)
    groups.set(key, [...(groups.get(key) ?? []), word])
  }
  const preferred = new Set(PREFERRED_DISPLAY_FORMS)
  const display = new Map<string, string>()
  const collisions: string[][] = []
  for (const [key, group] of groups) {
    group.sort(
      (a, b) =>
        Number(preferred.has(b)) - Number(preferred.has(a)) ||
        (counts.get(b) ?? 0) - (counts.get(a) ?? 0) ||
        accentCount(a) - accentCount(b) ||
        a.localeCompare(b, 'pt-BR'),
    )
    display.set(key, group[0] ?? key)
    if (group.length > 1) collisions.push(group)
  }
  return { display, collisions }
}

const NOTICE = `/*
 * ARQUIVO GERADO por scripts/build-wordlist.ts. Não edite à mão.
 *
 * Derivado do VERO (dicionário pt_BR do LibreOffice), Copyright (C) 2006-2013
 * Raimundo Santos Moura e colaboradores, sob LGPLv3 e Mozilla Public License.
 * Este arquivo segue sob essas licenças. Textos e créditos em public/licenses/,
 * public/THIRD_PARTY_NOTICES.txt e docs/WORDLIST.md.
 */
`

async function writeList(file: string, name: string, doc: string, list: string[]): Promise<void> {
  const body = list.map((word) => `  ${JSON.stringify(word)},`).join('\n')
  const source = `${NOTICE}\n/** ${doc} */\nexport const ${name}: readonly string[] = [\n${body}\n];\n`
  await writeFile(join(DATA_DIR, file), source)
}

async function main(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true })
  const [dic, aff] = [await fetchVero('pt_BR.dic'), await fetchVero('pt_BR.aff')]
  const lexicon = buildLexicon(dic, parseAff(aff))
  if (process.argv.includes('--refresh-frequency')) await refreshFrequency(lexicon.words)

  const everywhere = new Set(EVERYWHERE_EXCLUSIONS.map(normalizeWord))
  const answerOnly = new Set(ANSWER_ONLY_EXCLUSIONS.map(normalizeWord))
  const endingKeep = new Set(CONJUGATED_ENDING_KEEP)
  const isPlainConjugation = (word: string): boolean =>
    lexicon.verbOnly.has(word) && CONJUGATED_ENDINGS.test(word) && !endingKeep.has(word)
  const allowed = [...lexicon.words].filter((word) => !everywhere.has(normalizeWord(word)))
  const counts = await readFrequency(lexicon.words)

  const { display, collisions } = pickDisplayForms(allowed, counts)
  const byKey = (a: string, b: string): number =>
    normalizeWord(a).localeCompare(normalizeWord(b), 'pt-BR')
  const valid = [...display.values()].sort(byKey)
  const answers = valid.filter(
    (word) =>
      (counts.get(word) ?? 0) >= MIN_ANSWER_COUNT &&
      !lexicon.noSuggest.has(word) &&
      !answerOnly.has(normalizeWord(word)) &&
      !isPlainConjugation(word),
  )
  const answerKeys = new Set(answers.map(normalizeWord))

  await writeList('valid.ts', 'VALID_WORDS', 'Todas as palavras aceitas como chute.', valid)
  await writeList('answers.ts', 'ANSWER_WORDS', 'Palavras comuns usadas como resposta.', answers)

  const inAnswers = collisions.filter(([first = '']) => answerKeys.has(normalizeWord(first)))
  console.log(`Nomes próprios e siglas removidos do .dic: ${lexicon.rejectedProperNouns}`)
  console.log(`valid: ${valid.length} | answers: ${answers.length}`)
  console.log(`Colisões: ${collisions.length} em valid, ${inAnswers.length} em answers`)
  console.log(`NOSUGGEST: ${lexicon.noSuggest.size} | contagens: ${counts.size}`)
  await writeFile(
    join(CACHE_DIR, 'collisions-answers.txt'),
    inAnswers.map((group) => group.join(' ')).join('\n'),
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
