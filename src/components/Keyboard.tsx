import type { LetterResult } from '../game/evaluate'
import type { GameAction } from '../game/game'
import { keepFocus } from './keepFocus'
import styles from './Keyboard.module.css'

const TOP_ROW = [...'qwertyuiop']
const MIDDLE_ROW = [...'asdfghjkl']
const BOTTOM_ROW = [...'zxcvbnm']

const RESULT_LABEL: Record<LetterResult, string> = {
  correct: 'lugar certo',
  present: 'lugar errado',
  absent: 'não está na palavra',
}

interface KeyboardProps {
  letters: ReadonlyMap<string, LetterResult>
  onAction: (action: GameAction) => void
}

export function Keyboard({ letters, onAction }: KeyboardProps) {
  const letterKey = (letter: string) => {
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
  }

  return (
    <div className={styles.keyboard} role="group" aria-label="Teclado">
      {TOP_ROW.map(letterKey)}
      {MIDDLE_ROW.map(letterKey)}
      <button
        type="button"
        className={`${styles.key} ${styles.wide} ${styles.submit}`}
        aria-label="OK, enviar palavra"
        onMouseDown={keepFocus}
        onClick={() => onAction({ type: 'submitGuess' })}
      >
        OK
      </button>
      {BOTTOM_ROW.map(letterKey)}
      <button
        type="button"
        className={`${styles.key} ${styles.wide}`}
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
    </div>
  )
}
