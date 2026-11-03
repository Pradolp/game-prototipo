import { ANSWER_WORDS } from '../data/answers'
import { dayNumber } from './dates'

/** Primeiro dia da sequência. Mudar a época ou a seed muda todas as palavras do dia. */
export const DAILY_EPOCH = '2026-11-01'
const SHUFFLE_SEED = 0x50414c41

/** PRNG mulberry32: pequeno e com a mesma saída em qualquer navegador. */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled(words: readonly string[]): string[] {
  const random = seededRandom(SHUFFLE_SEED)
  const order = [...words]
  for (let last = order.length - 1; last > 0; last -= 1) {
    const other = Math.floor(random() * (last + 1))
    ;[order[last], order[other]] = [order[other] as string, order[last] as string]
  }
  return order
}

/** Palavra de um dia: a posição na ordem embaralhada avança um passo por dia. */
export function getDailyWord(dateKey: string, words: readonly string[] = ANSWER_WORDS): string {
  const days = dayNumber(dateKey) - dayNumber(DAILY_EPOCH)
  const index = ((days % words.length) + words.length) % words.length
  return shuffled(words)[index] as string
}
