import { describe, expect, it } from 'vitest'
import { getDailyWord } from './daily'
import type { GameAction } from './game'
import { canReset } from './resets'
import {
  activeGame,
  createSession,
  playAction,
  resetGame,
  switchGame,
  type Session,
} from './session'
import { createStats, updateStats, type GameResult, type Stats } from './stats'

const TODAY = '2026-11-03'
const TOMORROW = '2026-11-04'
const WORDS = ['pedra', 'praia', 'terra', 'livro', 'mundo', 'tempo', 'campo', 'carta']
const rng = () => 0

const typed = (word: string): GameAction[] =>
  [...word].map((letter) => ({ type: 'typeLetter', letter }))

const guess = (word: string): GameAction[] => [...typed(word), { type: 'submitGuess' }]

/** Aplica as ações e devolve a sessão final com os resultados terminados. */
function play(session: Session, actions: GameAction[]) {
  const results: GameResult[] = []
  let current = session
  for (const action of actions) {
    const step = playAction(current, action)
    current = step.session
    if (step.result) results.push(step.result)
  }
  return { session: current, results }
}

const start = () => createSession(TODAY, WORDS)

const openChute = (session: Session): Session => switchGame(session, 'extra', rng, WORDS)

const dailyAnswer = getDailyWord(TODAY, WORDS)
const wrongGuesses = (answer: string) => WORDS.filter((word) => word !== answer).slice(0, 6)

const answerOf = (session: Session): string => session.extra?.answer ?? ''

/** Vence a palavra de CHUTE, que é o que libera o reset, e troca de palavra. */
const reset = (session: Session): Session => {
  const finished = play(session, guess(answerOf(session))).session
  const next = resetGame(finished, rng, WORDS)
  if (!next) throw new Error('reset deveria funcionar')
  return next
}

describe('createSession', () => {
  it('sempre abre em Palavra do dia, sem palavra de CHUTE e com os resets cheios', () => {
    const session = start()
    expect(session.date).toBe(TODAY)
    expect(session.active).toBe('daily')
    expect(session.extra).toBeNull()
    expect(session.daily).toMatchObject({ type: 'daily', answer: dailyAnswer, date: TODAY })
    expect(session.resets).toEqual({ date: TODAY, used: 0, played: [] })
    expect(activeGame(session)).toBe(session.daily)
  })

  it('usa a lista real de respostas por padrão', () => {
    expect(createSession(TODAY).daily.answer).toBe(getDailyWord(TODAY))
  })
})

describe('primeira abertura da aba CHUTE', () => {
  it('sorteia uma palavra sem gastar reset e registra em played', () => {
    const session = openChute(start())
    const word = session.extra?.answer
    expect(session.active).toBe('extra')
    expect(session.extra).toMatchObject({ type: 'extra', date: TODAY, status: 'playing' })
    expect(word).not.toBe(dailyAnswer)
    expect(session.resets).toEqual({ date: TODAY, used: 0, played: [word] })
    expect(activeGame(session)).toBe(session.extra)
  })

  it('não sorteia de novo ao voltar para a aba', () => {
    const first = openChute(start())
    const second = openChute(switchGame(first, 'daily', rng, WORDS))
    expect(second.extra).toBe(first.extra)
    expect(second.resets).toBe(first.resets)
  })

  it('fica na Palavra do dia se não houver palavra para sortear', () => {
    const session = createSession(TODAY, ['pedra'])
    expect(switchGame(session, 'extra', rng, ['pedra'])).toBe(session)
  })

  it('usa a lista real de respostas por padrão', () => {
    const session = switchGame(createSession(TODAY), 'extra', () => 0.5)
    expect(session.extra?.answer).not.toBe(getDailyWord(TODAY))
  })
})

describe('trocar de aba não muda o progresso', () => {
  it('guarda chutes e letras digitadas da Palavra do dia', () => {
    const inProgress = play(start(), [...guess('praia'), ...typed('te')]).session
    const back = switchGame(openChute(inProgress), 'daily', rng, WORDS)
    expect(back.daily).toBe(inProgress.daily)
    expect(activeGame(back)).toBe(inProgress.daily)
  })

  it('guarda chutes e letras digitadas da palavra de CHUTE', () => {
    const inProgress = play(openChute(start()), [...guess('praia'), ...typed('te')]).session
    const back = openChute(switchGame(inProgress, 'daily', rng, WORDS))
    expect(activeGame(back)).toBe(inProgress.extra)
  })

  it('jogar uma aba não mexe na outra', () => {
    const session = play(openChute(start()), guess('terra')).session
    const daily = play(switchGame(session, 'daily', rng, WORDS), guess('praia')).session
    expect(session.daily.guesses).toEqual([])
    expect(daily.extra).toBe(session.extra)
    expect(daily.daily.guesses).toEqual(['praia'])
  })

  it('não gasta reset', () => {
    const session = reset(openChute(start()))
    const back = openChute(switchGame(session, 'daily', rng, WORDS))
    expect(back.resets).toBe(session.resets)
  })
})

describe('reset', () => {
  it('não funciona na aba Palavra do dia', () => {
    expect(resetGame(start(), rng, WORDS)).toBeNull()
    const opened = openChute(start())
    const finished = play(opened, guess(answerOf(opened))).session
    expect(resetGame(switchGame(finished, 'daily', rng, WORDS), rng, WORDS)).toBeNull()
  })

  it('recusa no meio da partida, sem gastar o reset e sem mexer na palavra', () => {
    const opened = openChute(start())
    const miss = wrongGuesses(answerOf(opened))[0] ?? ''
    const inProgress = play(opened, guess(miss)).session
    expect(resetGame(opened, rng, WORDS)).toBeNull()
    expect(resetGame(inProgress, rng, WORDS)).toBeNull()
    expect(inProgress.resets.used).toBe(0)
    expect(inProgress.extra?.guesses).toEqual([miss])
  })

  it('libera depois de uma vitória antes da 6ª tentativa', () => {
    const opened = openChute(start())
    const miss = wrongGuesses(answerOf(opened))[0] ?? ''
    const won = play(opened, [...guess(miss), ...guess(answerOf(opened))]).session
    expect(won.extra?.status).toBe('won')
    expect(won.extra?.guesses).toHaveLength(2)
    expect(resetGame(won, rng, WORDS)?.resets.used).toBe(1)
  })

  it('libera depois de uma derrota', () => {
    const opened = openChute(start())
    const lost = play(opened, wrongGuesses(answerOf(opened)).flatMap(guess)).session
    expect(lost.extra?.status).toBe('lost')
    expect(resetGame(lost, rng, WORDS)?.resets.used).toBe(1)
  })

  it('troca a palavra de CHUTE, começa vazia e mantém a Palavra do dia', () => {
    const first = play(openChute(start()), guess('praia')).session
    const second = reset(first)
    expect(second.extra?.answer).not.toBe(first.extra?.answer)
    expect(second.extra?.guesses).toEqual([])
    expect(second.daily).toBe(first.daily)
  })

  it('tem 3 resets além da primeira palavra, sem repetir nem usar a do dia', () => {
    const opened = openChute(start())
    const sessions = [opened, reset(opened)]
    sessions.push(reset(sessions[1] as Session))
    sessions.push(reset(sessions[2] as Session))
    const words = sessions.map(answerOf)
    expect(new Set(words).size).toBe(4)
    expect(words).not.toContain(dailyAnswer)
    expect(sessions[3]?.resets.played).toEqual(words)
  })

  it('recusa sem resets restantes, mesmo com a palavra terminada', () => {
    const last = reset(reset(reset(openChute(start()))))
    const finished = play(last, guess(answerOf(last))).session
    expect(finished.extra?.status).toBe('won')
    expect(canReset(finished.resets, TODAY, 'won')).toBe(false)
    expect(resetGame(finished, rng, WORDS)).toBeNull()
  })
})

describe('estatísticas da aba CHUTE', () => {
  const countAll = (results: GameResult[], stats: Stats = createStats()): Stats =>
    results.reduce(updateStats, stats)

  it('vitória conta em jogos, vitórias e distribuição, nunca na sequência', () => {
    const session = openChute(start())
    const { results } = play(session, guess(answerOf(session)))
    expect(results).toEqual([{ type: 'extra', date: TODAY, won: true, attempts: 1 }])
    const stats = countAll(results)
    expect(stats).toMatchObject({ played: 1, won: 1, distribution: [1, 0, 0, 0, 0, 0] })
    expect(stats.currentStreak).toBe(0)
  })

  it('derrota conta em jogos, nunca na sequência', () => {
    const session = openChute(start())
    const { results } = play(session, wrongGuesses(answerOf(session)).flatMap(guess))
    expect(results).toEqual([{ type: 'extra', date: TODAY, won: false, attempts: 6 }])
    const streak = updateStats(createStats(), {
      type: 'daily',
      date: TODAY,
      won: true,
      attempts: 3,
    })
    expect(countAll(results, streak).currentStreak).toBe(1)
  })

  it('palavra em andamento não gera resultado', () => {
    const session = openChute(start())
    const miss = wrongGuesses(answerOf(session))[0] ?? ''
    expect(play(session, guess(miss)).results).toEqual([])
  })
})

describe('virada do dia', () => {
  it('descarta a palavra de CHUTE em andamento e renova tudo', () => {
    const opened = reset(openChute(start()))
    const miss = wrongGuesses(answerOf(opened))[0] ?? ''
    const today = play(opened, guess(miss)).session
    const tomorrow = createSession(TOMORROW, WORDS)
    expect(today.extra?.status).toBe('playing')
    expect(tomorrow.extra).toBeNull()
    expect(tomorrow.active).toBe('daily')
    expect(tomorrow.resets).toEqual({ date: TOMORROW, used: 0, played: [] })
  })

  it('a primeira palavra de CHUTE do novo dia não gasta reset', () => {
    expect(openChute(createSession(TOMORROW, WORDS)).resets.used).toBe(0)
  })
})

describe('playAction', () => {
  it('só devolve resultado na ação que termina a partida', () => {
    const { session, results } = play(start(), guess(dailyAnswer))
    expect(results).toEqual([{ type: 'daily', date: TODAY, won: true, attempts: 1 }])
    expect(playAction(session, { type: 'submitGuess' }).result).toBeNull()
  })

  it('a palavra do dia terminada entra na sequência', () => {
    const { results } = play(start(), guess(dailyAnswer))
    expect(results.reduce(updateStats, createStats()).currentStreak).toBe(1)
  })
})
