import { dayNumber } from './dates'
import type { GameType } from './game'
import { MAX_ATTEMPTS } from './rules'

export interface Stats {
  played: number
  won: number
  /** Valor na última vitória: para exibir, use `getCurrentStreak`, que considera dias perdidos. */
  currentStreak: number
  bestStreak: number
  lastDailyWinDate: string | null
  /** Vitórias por número de tentativas: a posição 0 guarda as vitórias na 1ª tentativa. */
  distribution: number[]
}

export interface GameResult {
  type: GameType
  date: string
  won: boolean
  attempts: number
}

export const createStats = (): Stats => ({
  played: 0,
  won: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastDailyWinDate: null,
  distribution: Array<number>(MAX_ATTEMPTS).fill(0),
})

const daysSinceLastWin = (stats: Stats, date: string): number =>
  stats.lastDailyWinDate === null
    ? Number.POSITIVE_INFINITY
    : dayNumber(date) - dayNumber(stats.lastDailyWinDate)

/** Recebe partidas terminadas. Só a palavra do dia mexe na sequência. */
export function updateStats(stats: Stats, result: GameResult): Stats {
  const counted: Stats = {
    ...stats,
    played: stats.played + 1,
    won: stats.won + (result.won ? 1 : 0),
    distribution: stats.distribution.map((count, index) =>
      result.won && index === result.attempts - 1 ? count + 1 : count,
    ),
  }
  if (result.type === 'extra') return counted
  if (!result.won) return { ...counted, currentStreak: 0 }

  const currentStreak = daysSinceLastWin(stats, result.date) === 1 ? stats.currentStreak + 1 : 1
  return {
    ...counted,
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    lastDailyWinDate: result.date,
  }
}

/** Sequência válida hoje: zera se um dia inteiro passou sem vitória na palavra do dia. */
export const getCurrentStreak = (stats: Stats, today: string): number =>
  daysSinceLastWin(stats, today) <= 1 ? stats.currentStreak : 0
