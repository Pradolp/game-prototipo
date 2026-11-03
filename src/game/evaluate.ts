import { normalize } from './normalize'

export type LetterResult = 'correct' | 'present' | 'absent'

/**
 * Compara em duas passadas: primeiro marca as letras no lugar certo, depois as de
 * lugar errado, descontando o que sobrou de cada letra na resposta.
 */
export function evaluateGuess(guess: string, answer: string): LetterResult[] {
  const guessLetters = [...normalize(guess)]
  const answerLetters = [...normalize(answer)]
  const remaining = new Map<string, number>()

  const results = guessLetters.map((letter, index): LetterResult => {
    if (letter === answerLetters[index]) return 'correct'
    const answerLetter = answerLetters[index]
    if (answerLetter !== undefined) {
      remaining.set(answerLetter, (remaining.get(answerLetter) ?? 0) + 1)
    }
    return 'absent'
  })

  return results.map((result, index) => {
    const letter = guessLetters[index] as string
    const available = remaining.get(letter) ?? 0
    if (result === 'correct' || available === 0) return result
    remaining.set(letter, available - 1)
    return 'present'
  })
}
