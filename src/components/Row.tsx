import type { TileView } from '../game/board'
import { Tile } from './Tile'
import styles from './Board.module.css'

interface RowProps {
  tiles: TileView[]
  number: number
  flipping: boolean
  shaking: boolean
}

export function Row({ tiles, number, flipping, shaking }: RowProps) {
  return (
    <div
      className={styles.row}
      role="group"
      aria-label={`Tentativa ${number}`}
      data-shake={shaking || undefined}
    >
      {tiles.map((tile, index) => (
        <Tile key={index} {...tile} flipIndex={flipping ? index : undefined} />
      ))}
    </div>
  )
}
