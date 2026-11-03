import type { TileView } from '../game/board'
import { Tile } from './Tile'
import styles from './Board.module.css'

interface RowProps {
  tiles: TileView[]
  number: number
  flipping: boolean
  shaking: boolean
  onSelectSlot: (index: number) => void
}

export function Row({ tiles, number, flipping, shaking, onSelectSlot }: RowProps) {
  return (
    <div
      className={styles.row}
      role="group"
      aria-label={`Tentativa ${number}`}
      data-shake={shaking || undefined}
    >
      {tiles.map((tile, index) => (
        <Tile
          key={index}
          {...tile}
          flipIndex={flipping ? index : undefined}
          slot={tile.active ? { index, onSelect: () => onSelectSlot(index) } : undefined}
        />
      ))}
    </div>
  )
}
