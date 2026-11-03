import type { MouseEvent } from 'react'
import type { LetterResult } from '../game/evaluate'
import type { GameAction } from '../game/game'
import styles from './Keyboard.module.css'

/*
 * Grade alfabética de 7 colunas: 26 letras + Apagar + OK fecham 4 linhas exatas. Um teclado
 * de 10 colunas teria teclas de ~31px em 360px; o mínimo do jogo é 44×44px.
 */
const LETTERS = [...'abcdefghijklmnopqrstuvwxyz']

const RESULT_LABEL: Record<LetterResult, string> = {
  correct: 'lugar certo',
  present: 'lugar errado',
  absent: 'não está na palavra',
}

interface KeyboardProps {
  letters: ReadonlyMap<string, LetterResult>
  onAction: (action: GameAction) => void
}

/** Tecla virtual não pega o foco: o Enter do teclado físico continua enviando o chute. */
const keepFocus = (event: MouseEvent) => event.preventDefault()

export function Keyboard({ letters, onAction }: KeyboardProps) {
  return (
    <div className={styles.keyboard} role="group" aria-label="Teclado">
      {LETTERS.map((letter) => {
        const result = letters.get(letter)
        const name = letter.toUpperCase()
        return (
          <button
            key={letter}
            type="button"
            className={styles.key}
            data-result={result}
            aria-label={result ? `${name}, ${RESULT_LABEL[result]}` : name}
            onMouseDown={keepFocus}
            onClick={() => onAction({ type: 'typeLetter', letter })}
          >
            {name}
          </button>
        )
      })}
      <button
        type="button"
        className={styles.key}
        aria-label="Apagar"
        onMouseDown={keepFocus}
        onClick={() => onAction({ type: 'deleteLetter' })}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path
            d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7zM12 9.5l5 5m0-5-5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        className={`${styles.key} ${styles.submit}`}
        aria-label="OK, enviar palavra"
        onMouseDown={keepFocus}
        onClick={() => onAction({ type: 'submitGuess' })}
      >
        OK
      </button>
    </div>
  )
}
