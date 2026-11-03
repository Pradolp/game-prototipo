import { describe, expect, it } from 'vitest'
import { getDailyWord } from './daily'
import {
  applyReset,
  canReset,
  createResetState,
  drawFirstExtra,
  MAX_RESETS,
  remainingResets,
  type ResetState,
} from './resets'

const TODAY = '2026-11-03'
const TOMORROW = '2026-11-04'
const WORDS = ['ameno', 'bacia', 'calor', 'dente', 'folha', 'gente']
const firstItem = () => 0
const lastItem = () => 0.999

const used = (count: number, played: string[] = []): ResetState => ({
  date: TODAY,
  used: count,
  played,
})

describe('canReset', () => {
  it('permite até o terceiro reset do dia com a palavra terminada', () => {
    expect(MAX_RESETS).toBe(3)
    expect(canReset(used(0), TODAY, 'won')).toBe(true)
    expect(canReset(used(2), TODAY, 'lost')).toBe(true)
  })

  it('recusa com a palavra em andamento, mesmo com resets sobrando', () => {
    expect(canReset(used(0), TODAY, 'playing')).toBe(false)
  })

  it('bloqueia com os três resets usados', () => {
    expect(canReset(used(3), TODAY, 'won')).toBe(false)
  })

  it('renova quando muda o dia', () => {
    expect(canReset(used(3), TOMORROW, 'won')).toBe(true)
  })
})

describe('remainingResets', () => {
  it('conta quantos restam hoje', () => {
    expect(remainingResets(createResetState(TODAY), TODAY)).toBe(3)
    expect(remainingResets(used(2), TODAY)).toBe(1)
    expect(remainingResets(used(3), TODAY)).toBe(0)
  })

  it('volta a 3 no dia seguinte', () => {
    expect(remainingResets(used(3), TOMORROW)).toBe(3)
  })
})

describe('drawFirstExtra', () => {
  it('sorteia e registra em played sem gastar reset', () => {
    const daily = getDailyWord(TODAY, WORDS)
    const pool = WORDS.filter((word) => word !== daily)
    expect(drawFirstExtra(createResetState(TODAY), TODAY, firstItem, WORDS)).toEqual({
      word: pool[0],
      state: { date: TODAY, used: 0, played: [pool[0]] },
    })
  })

  it('funciona com a lista real de respostas e nunca devolve a palavra do dia', () => {
    const result = drawFirstExtra(createResetState(TODAY), TODAY, () => 0.5)
    expect(result?.word).toBeTruthy()
    expect(result?.word).not.toBe(getDailyWord(TODAY))
  })

  it('devolve null se não sobrar palavra para sortear', () => {
    const only = [getDailyWord(TODAY, WORDS)]
    expect(drawFirstExtra(createResetState(TODAY), TODAY, firstItem, only)).toBeNull()
  })

  it('começa do zero em outro dia', () => {
    const result = drawFirstExtra(used(3, ['ameno']), TOMORROW, firstItem, WORDS)
    expect(result?.state).toMatchObject({ date: TOMORROW, used: 0 })
    expect(result?.state.played).toHaveLength(1)
  })
})

describe('applyReset', () => {
  it('sorteia com o RNG injetado e registra o uso', () => {
    const daily = getDailyWord(TODAY, WORDS)
    const pool = WORDS.filter((word) => word !== daily)
    const result = applyReset(createResetState(TODAY), TODAY, 'won', firstItem, WORDS)
    expect(result).toEqual({
      word: pool[0],
      state: { date: TODAY, used: 1, played: [pool[0]] },
    })
  })

  it('usa o fim do intervalo do RNG sem sair da lista', () => {
    const daily = getDailyWord(TODAY, WORDS)
    const pool = WORDS.filter((word) => word !== daily)
    expect(applyReset(createResetState(TODAY), TODAY, 'won', lastItem, WORDS)?.word).toBe(
      pool.at(-1),
    )
  })

  it('nunca sorteia a palavra do dia', () => {
    const daily = getDailyWord(TODAY, WORDS)
    for (let step = 0; step < 100; step += 1) {
      const result = applyReset(createResetState(TODAY), TODAY, 'won', () => step / 100, WORDS)
      expect(result?.word).not.toBe(daily)
    }
  })

  it('nunca repete palavra já jogada hoje', () => {
    const first = applyReset(createResetState(TODAY), TODAY, 'won', firstItem, WORDS)
    const second = first && applyReset(first.state, TODAY, 'won', firstItem, WORDS)
    const third = second && applyReset(second.state, TODAY, 'won', firstItem, WORDS)
    const words = [first?.word, second?.word, third?.word]
    expect(new Set(words).size).toBe(3)
    expect(third?.state.played).toEqual(words)
  })

  it('devolve null com a palavra em andamento, sem gastar o reset', () => {
    expect(applyReset(used(1), TODAY, 'playing', firstItem, WORDS)).toBeNull()
  })

  it('devolve null depois do terceiro reset', () => {
    expect(applyReset(used(3), TODAY, 'won', firstItem, WORDS)).toBeNull()
  })

  it('renova o contador e a lista de jogadas no dia seguinte', () => {
    const daily = getDailyWord(TOMORROW, WORDS)
    const yesterday = WORDS.find((word) => word !== daily) ?? ''
    const result = applyReset(used(3, [yesterday]), TOMORROW, 'won', firstItem, WORDS)
    expect(result?.word).toBe(yesterday)
    expect(result?.state).toEqual({ date: TOMORROW, used: 1, played: [yesterday] })
  })

  it('devolve null se não sobrar palavra para sortear', () => {
    const daily = getDailyWord(TODAY, WORDS)
    const others = WORDS.filter((word) => word !== daily)
    expect(applyReset(used(0, others), TODAY, 'won', firstItem, WORDS)).toBeNull()
  })

  it('não altera o estado recebido', () => {
    const state = used(1, ['ameno'])
    const snapshot = structuredClone(state)
    applyReset(state, TODAY, 'won', firstItem, WORDS)
    expect(state).toEqual(snapshot)
  })

  it('funciona com a lista real de respostas', () => {
    const result = applyReset(createResetState(TODAY), TODAY, 'won', () => 0.5)
    expect(result?.word).toBeTruthy()
    expect(result?.word).not.toBe(getDailyWord(TODAY))
  })
})
