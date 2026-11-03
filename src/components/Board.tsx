import { useEffect, useRef } from 'react'
import type { TileView } from '../game/board'
import type { Notice } from '../hooks/useGame'
import { Row } from './Row'
import { rowAnnouncement } from './tileLabels'
import styles from './Board.module.css'

interface BoardProps {
  rows: TileView[][]
  typingRow: number
  revealRow: number | null
  notice: Notice | null
  onSelectSlot: (index: number) => void
}

const rejectsGuess = (notice: Notice | null): boolean =>
  notice?.kind === 'tooShort' || notice?.kind === 'notInList'

export function Board({ rows, typingRow, revealRow, notice, onSelectSlot }: BoardProps) {
  const shaking = rejectsGuess(notice)
  const board = useRef<HTMLDivElement>(null)
  const live = useRef<HTMLParagraphElement>(null)
  const announcement = rowAnnouncement(rows[typingRow])

  // Com o foco em uma casa, ele segue a seleção e o leitor de tela já fala a casa nova;
  // anunciar de novo seria repetir. Sem foco nas casas, quem avisa é a região `aria-live`.
  useEffect(() => {
    const focused = document.activeElement
    if (focused instanceof HTMLElement && focused.dataset.slot !== undefined) {
      board.current?.querySelector<HTMLElement>('[data-slot][aria-pressed="true"]')?.focus()
    } else if (live.current) {
      live.current.textContent = announcement
    }
  }, [announcement])

  return (
    <div className={styles.area}>
      <p ref={live} className="sr-only" aria-live="polite" />
      <div ref={board} className={styles.board} role="group" aria-label="Tabuleiro">
        {rows.map((tiles, index) => {
          const shakes = shaking && index === typingRow
          return (
            <Row
              // A chave nova reinicia a animação quando o mesmo aviso se repete.
              key={shakes ? `${index}-${notice?.id}` : index}
              tiles={tiles}
              number={index + 1}
              flipping={index === revealRow}
              shaking={shakes}
              onSelectSlot={onSelectSlot}
            />
          )
        })}
      </div>
    </div>
  )
}
