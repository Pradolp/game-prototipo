import type { CSSProperties } from 'react'
import type { LetterResult } from '../game/evaluate'
import { WORD_LENGTH } from '../game/rules'
import { FLIP_MS, FLIP_STAGGER_MS } from '../styles/motion'
import { keepFocus } from './keepFocus'
import styles from './Tile.module.css'

const RESULT_LABEL: Record<LetterResult, string> = {
  correct: 'lugar certo',
  present: 'lugar errado',
  absent: 'não está na palavra',
}

interface TileProps {
  letter: string
  result: LetterResult | null
  active?: boolean
  selected?: boolean
  /** Posição na linha que está virando; `undefined` quando a casa não anima. */
  flipIndex?: number
  /** Só na linha atual: posição da casa e a ação de selecioná-la. */
  slot?: { index: number; onSelect: () => void }
}

function tileLabel(letter: string, result: LetterResult | null): string {
  if (letter === '') return 'vazia'
  return result ? `letra ${letter}, ${RESULT_LABEL[result]}` : `letra ${letter}`
}

function slotLabel(index: number, letter: string, selected: boolean): string {
  const content = letter === '' ? 'vazia' : `letra ${letter}`
  const position = `casa ${index + 1} de ${WORD_LENGTH}`
  return `${position}, ${content}${selected ? ', selecionada' : ''}`
}

export function Tile({
  letter,
  result,
  active = false,
  selected = false,
  flipIndex,
  slot,
}: TileProps) {
  const flip =
    flipIndex === undefined
      ? undefined
      : ({
          '--flip-ms': `${FLIP_MS}ms`,
          '--flip-delay': `${flipIndex * FLIP_STAGGER_MS}ms`,
        } as CSSProperties)
  if (slot) {
    return (
      <button
        type="button"
        className={styles.tile}
        aria-label={slotLabel(slot.index, letter, selected)}
        aria-pressed={selected}
        data-active
        data-selected={selected || undefined}
        onMouseDown={keepFocus}
        onClick={slot.onSelect}
      >
        {letter}
      </button>
    )
  }
  return (
    <div
      className={styles.tile}
      role="img"
      aria-label={tileLabel(letter, result)}
      data-result={result ?? undefined}
      data-active={active || undefined}
      data-flip={flip ? true : undefined}
      style={flip}
    >
      {letter}
    </div>
  )
}
