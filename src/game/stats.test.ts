import { describe, expect, it } from 'vitest'
import { createStats, getCurrentStreak, updateStats, type GameResult, type Stats } from './stats'

const daily = (date: string, won: boolean, attempts = 4): GameResult => ({
  type: 'daily',
  date,
  won,
  attempts,
})

const extra = (date: string, won: boolean, attempts = 4): GameResult => ({
  type: 'extra',
  date,
  won,
  attempts,
})

const play = (results: GameResult[], start: Stats = createStats()): Stats =>
  results.reduce(updateStats, start)

describe('createStats', () => {
  it('começa zerada, com seis faixas de tentativas', () => {
    expect(createStats()).toEqual({
      played: 0,
      won: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastDailyWinDate: null,
      distribution: [0, 0, 0, 0, 0, 0],
    })
  })
})

describe('jogos, vitórias e distribuição', () => {
  it('registra vitória na faixa de tentativas certa', () => {
    const stats = play([daily('2026-11-03', true, 3)])
    expect(stats.played).toBe(1)
    expect(stats.won).toBe(1)
    expect(stats.distribution).toEqual([0, 0, 1, 0, 0, 0])
  })

  it('aceita vitória na primeira e na última tentativa', () => {
    const stats = play([daily('2026-11-03', true, 1), daily('2026-11-04', true, 6)])
    expect(stats.distribution).toEqual([1, 0, 0, 0, 0, 1])
  })

  it('derrota conta como jogo, mas não entra na distribuição', () => {
    const stats = play([daily('2026-11-03', false, 6)])
    expect(stats.played).toBe(1)
    expect(stats.won).toBe(0)
    expect(stats.distribution).toEqual([0, 0, 0, 0, 0, 0])
  })

  it('palavra extra terminada conta em jogos, vitórias e distribuição', () => {
    const stats = play([extra('2026-11-03', true, 2), extra('2026-11-03', false, 6)])
    expect(stats.played).toBe(2)
    expect(stats.won).toBe(1)
    expect(stats.distribution).toEqual([0, 1, 0, 0, 0, 0])
  })

  it('não altera as estatísticas recebidas', () => {
    const stats = createStats()
    updateStats(stats, daily('2026-11-03', true))
    expect(stats).toEqual(createStats())
  })
})

describe('sequência de dias', () => {
  it('soma com vitórias em dias seguidos, inclusive na virada do mês', () => {
    const stats = play([
      daily('2026-11-29', true),
      daily('2026-11-30', true),
      daily('2026-12-01', true),
    ])
    expect(stats.currentStreak).toBe(3)
    expect(stats.bestStreak).toBe(3)
    expect(stats.lastDailyWinDate).toBe('2026-12-01')
  })

  it('zera ao perder a palavra do dia e guarda a melhor sequência', () => {
    const stats = play([
      daily('2026-11-03', true),
      daily('2026-11-04', true),
      daily('2026-11-05', false),
    ])
    expect(stats.currentStreak).toBe(0)
    expect(stats.bestStreak).toBe(2)
    expect(getCurrentStreak(stats, '2026-11-05')).toBe(0)
  })

  it('recomeça em 1 depois de uma derrota', () => {
    const stats = play([
      daily('2026-11-03', true),
      daily('2026-11-04', false),
      daily('2026-11-05', true),
    ])
    expect(stats.currentStreak).toBe(1)
  })

  it('recomeça em 1 ao vencer depois de um dia sem jogar', () => {
    const stats = play([
      daily('2026-11-03', true),
      daily('2026-11-04', true),
      daily('2026-11-06', true),
    ])
    expect(stats.currentStreak).toBe(1)
    expect(stats.bestStreak).toBe(2)
  })

  describe('palavras extras nunca alteram a sequência', () => {
    const streak = play([daily('2026-11-03', true), daily('2026-11-04', true)])

    it('vitória em extra não soma', () => {
      const stats = play([extra('2026-11-04', true)], streak)
      expect(stats.currentStreak).toBe(2)
      expect(stats.bestStreak).toBe(2)
      expect(stats.lastDailyWinDate).toBe('2026-11-04')
    })

    it('derrota em extra não zera', () => {
      expect(play([extra('2026-11-04', false)], streak).currentStreak).toBe(2)
    })

    it('vitória em extra não salva o dia em que a palavra do dia ficou sem vencer', () => {
      const stats = play([extra('2026-11-05', true)], streak)
      expect(getCurrentStreak(stats, '2026-11-06')).toBe(0)
    })

    it('vitória em extra não inicia sequência', () => {
      expect(play([extra('2026-11-03', true)]).currentStreak).toBe(0)
    })
  })
})

describe('getCurrentStreak', () => {
  const stats = play([daily('2026-11-03', true), daily('2026-11-04', true)])

  it('mantém no mesmo dia da vitória', () => {
    expect(getCurrentStreak(stats, '2026-11-04')).toBe(2)
  })

  it('mantém no dia seguinte, enquanto a palavra do dia ainda pode ser vencida', () => {
    expect(getCurrentStreak(stats, '2026-11-05')).toBe(2)
  })

  it('zera se um dia inteiro passou sem vitória na palavra do dia', () => {
    expect(getCurrentStreak(stats, '2026-11-06')).toBe(0)
  })

  it('é zero sem nenhuma vitória', () => {
    expect(getCurrentStreak(createStats(), '2026-11-04')).toBe(0)
  })
})
