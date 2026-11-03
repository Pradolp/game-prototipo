import type { CSSProperties } from 'react'
import type { LetterResult } from '../game/evaluate'
import { FLIP_MS, FLIP_STAGGER_MS } from '../styles/motion'
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
  /** Posição na linha que está virando; `undefined` quando a casa não anima. */
  flipIndex?: number
}

function tileLabel(letter: string, result: LetterResult | null): string {
  if (letter === '') return 'vazia'
  return result ? `letra ${letter}, ${RESULT_LABEL[result]}` : `letra ${letter}`
}

export function Tile({ letter, result, active = false, flipIndex }: TileProps) {
  const flip =
    flipIndex === undefined
      ? undefined
      : ({
          '--flip-ms': `${FLIP_MS}ms`,
          '--flip-delay': `${flipIndex * FLIP_STAGGER_MS}ms`,
        } as CSSProperties)
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
