import type { TileView } from '../game/board'
import type { Notice } from '../hooks/useGame'
import { Row } from './Row'
import styles from './Board.module.css'

interface BoardProps {
  rows: TileView[][]
  typingRow: number
  revealRow: number | null
  notice: Notice | null
}

const rejectsGuess = (notice: Notice | null): boolean =>
  notice?.kind === 'tooShort' || notice?.kind === 'notInList'

export function Board({ rows, typingRow, revealRow, notice }: BoardProps) {
  const shaking = rejectsGuess(notice)
  return (
    <div className={styles.area}>
      <div className={styles.board} role="group" aria-label="Tabuleiro">
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
            />
          )
        })}
      </div>
    </div>
  )
}
