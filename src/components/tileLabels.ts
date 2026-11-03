import type { TileView } from '../game/board'
import { WORD_LENGTH } from '../game/rules'

/** Nome da casa da linha atual, usado no botão e no anúncio para leitores de tela. */
export function slotLabel(index: number, letter: string, selected: boolean): string {
  const content = letter === '' ? 'vazia' : `letra ${letter}`
  const position = `casa ${index + 1} de ${WORD_LENGTH}`
  return `${position}, ${content}${selected ? ', selecionada' : ''}`
}

/** Anúncio da linha atual: o que já foi escrito e onde está a seleção; vazio sem partida. */
export function rowAnnouncement(tiles: TileView[] | undefined): string {
  const index = tiles?.findIndex((tile) => tile.selected) ?? -1
  if (tiles === undefined || index === -1) return ''
  const written = tiles.flatMap(({ letter }, position) =>
    letter === '' ? [] : [`${letter} na casa ${position + 1}`],
  )
  const selected = slotLabel(index, tiles[index]?.letter ?? '', true)
  return written.length === 0 ? selected : `${written.join(', ')}. ${selected}`
}
