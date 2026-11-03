import { describe, expect, it } from 'vitest'
import { getDailyWord } from '../game/daily'
import { createGame } from '../game/game'
import { createResetState } from '../game/resets'
import { createSession, type Session } from '../game/session'
import { createStats, type Stats } from '../game/stats'
import { loadSession, loadStats, saveSession, saveStats } from './progress'

const TODAY = '2026-11-03'
const TOMORROW = '2026-11-04'
const SESSION_KEY = 'chute:v1:session'
const RESETS_KEY = 'chute:v1:resets'
const STATS_KEY = 'chute:v1:stats'

const inProgress = (): Session => {
  const session = createSession(TODAY)
  return {
    ...session,
    daily: {
      ...session.daily,
      guesses: ['pedra'],
      slots: ['', '', '', '', 'a'],
      cursor: 2,
      feedback: 'tooShort',
    },
    extra: {
      ...createGame({ date: TODAY, type: 'extra', answer: 'lápis' }),
      slots: ['b', '', '', '', ''],
      cursor: 1,
    },
    active: 'extra',
    resets: { date: TODAY, used: 1, played: ['praia', 'lápis'] },
  }
}

const savedSession = () =>
  JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as Record<string, unknown>

describe('sessão salva', () => {
  it('volta igual, com slots e cursor das duas abas', () => {
    const session = inProgress()
    saveSession(session)
    const loaded = loadSession(TODAY)
    expect(loaded.daily).toEqual({ ...session.daily, feedback: null })
    expect(loaded.extra).toEqual(session.extra)
    expect(loaded.resets).toEqual(session.resets)
  })

  it('não salva a aba aberta e sempre abre em Palavra do dia', () => {
    saveSession(inProgress())
    expect(savedSession()).not.toHaveProperty('active')
    expect(loadSession(TODAY).active).toBe('daily')
  })

  it('guarda só os campos de cada partida', () => {
    saveSession(inProgress())
    expect(Object.keys(savedSession().daily as object).sort()).toEqual([
      'answer',
      'cursor',
      'guesses',
      'slots',
      'status',
      'type',
    ])
  })

  it('preserva uma sessão sem palavra de CHUTE', () => {
    saveSession(createSession(TODAY))
    expect(loadSession(TODAY).extra).toBeNull()
  })

  it('sem nada salvo, começa uma sessão nova', () => {
    expect(loadSession(TODAY)).toEqual(createSession(TODAY))
  })

  it('descarta a sessão e os resets de outro dia', () => {
    saveSession(inProgress())
    expect(loadSession(TOMORROW)).toEqual(createSession(TOMORROW))
  })

  it.each([
    ['JSON quebrado', '{quebrado'],
    ['tipo errado', '[]'],
    ['sem a partida do dia', JSON.stringify({ date: TODAY, extra: null })],
  ])('ignora sessão inválida: %s', (_name, raw) => {
    localStorage.setItem(SESSION_KEY, raw)
    expect(loadSession(TODAY).daily.answer).toBe(getDailyWord(TODAY))
  })

  it.each([
    ['tipo trocado', { type: 'extra' }],
    ['resposta curta', { answer: 'pé' }],
    ['chutes demais', { guesses: Array<string>(7).fill('pedra') }],
    ['chute que não é texto', { guesses: [1] }],
    ['chute com acento', { guesses: ['maçãs'] }],
    ['status desconhecido', { status: 'paused' }],
    ['casas de menos', { slots: ['a'] }],
    ['casa com duas letras', { slots: ['ab', '', '', '', ''] }],
    ['cursor fora da linha', { cursor: 5 }],
    ['cursor negativo', { cursor: -1 }],
  ])('ignora partida inválida: %s', (_name, change) => {
    saveSession(inProgress())
    const saved = savedSession()
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...saved, daily: { ...(saved.daily as object), ...change } }),
    )
    expect(loadSession(TODAY).daily.guesses).toEqual([])
  })

  it('perder a sessão não devolve os resets gastos', () => {
    saveSession(inProgress())
    localStorage.removeItem(SESSION_KEY)
    const loaded = loadSession(TODAY)
    expect(loaded.extra).toBeNull()
    expect(loaded.resets.used).toBe(1)
  })

  it.each([
    ['usados demais', { date: TODAY, used: 4, played: [] }],
    ['usados negativos', { date: TODAY, used: -1, played: [] }],
    ['played inválido', { date: TODAY, used: 0, played: 'pedra' }],
  ])('ignora resets inválidos: %s', (_name, resets) => {
    localStorage.setItem(RESETS_KEY, JSON.stringify(resets))
    expect(loadSession(TODAY).resets).toEqual(createResetState(TODAY))
  })

  it('sem resets salvos, a palavra de CHUTE em jogo continua fora do sorteio', () => {
    saveSession(inProgress())
    localStorage.removeItem(RESETS_KEY)
    expect(loadSession(TODAY).resets).toEqual({ date: TODAY, used: 0, played: ['lápis'] })
  })
})

describe('estatísticas salvas', () => {
  const stats: Stats = {
    played: 5,
    won: 4,
    currentStreak: 2,
    bestStreak: 3,
    lastDailyWinDate: TODAY,
    distribution: [0, 1, 1, 2, 0, 0],
  }

  it('voltam iguais', () => {
    saveStats(stats)
    expect(loadStats()).toEqual(stats)
  })

  it('começam zeradas quando não há nada salvo', () => {
    expect(loadStats()).toEqual(createStats())
  })

  it.each([
    ['não é objeto', 3],
    ['contagem negativa', { ...stats, played: -1 }],
    ['data impossível', { ...stats, lastDailyWinDate: '2026-02-30' }],
    ['data que não é texto', { ...stats, lastDailyWinDate: 20261103 }],
    ['distribuição curta', { ...stats, distribution: [1] }],
    ['distribuição com texto', { ...stats, distribution: ['1', 0, 0, 0, 0, 0] }],
  ])('ignora estatísticas inválidas: %s', (_name, value) => {
    localStorage.setItem(STATS_KEY, JSON.stringify(value))
    expect(loadStats()).toEqual(createStats())
  })
})
