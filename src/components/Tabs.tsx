import { useRef, type KeyboardEvent } from 'react'
import type { GameType } from '../game/game'
import { PANEL_ID, tabId } from './tabIds'
import styles from './Tabs.module.css'

const TABS: { type: GameType; label: string }[] = [
  { type: 'daily', label: 'Palavra do dia' },
  { type: 'extra', label: 'CHUTE' },
]

interface TabsProps {
  active: GameType
  onSelect: (type: GameType) => void
}

export function Tabs({ active, onSelect }: TabsProps) {
  const refs = useRef(new Map<GameType, HTMLButtonElement>())

  const moveWithArrows = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const other = active === 'daily' ? 'extra' : 'daily'
    onSelect(other)
    refs.current.get(other)?.focus()
  }

  return (
    <div className={styles.tabs} role="tablist" aria-label="Jogos" onKeyDown={moveWithArrows}>
      {TABS.map(({ type, label }) => (
        <button
          key={type}
          ref={(button) => {
            if (button) refs.current.set(type, button)
          }}
          id={tabId(type)}
          type="button"
          role="tab"
          className={styles.tab}
          aria-selected={active === type}
          aria-controls={PANEL_ID}
          tabIndex={active === type ? 0 : -1}
          onClick={() => onSelect(type)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
