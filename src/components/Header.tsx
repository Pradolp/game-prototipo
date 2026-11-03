import type { ReactNode } from 'react'
import type { GameType } from '../game/game'
import type { ResetAvailability } from '../game/resets'
import type { ModalKind } from '../hooks/useGame'
import { ResetButton } from './ResetButton'
import { Tabs } from './Tabs'
import styles from './Header.module.css'

interface HeaderProps {
  active: GameType
  onSelectTab: (type: GameType) => void
  onOpenModal: (modal: ModalKind) => void
  resetsLeft: number
  availability: ResetAvailability
  onPressReset: () => void
}

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" className={styles.tool} aria-label={label} onClick={onClick}>
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        {children}
      </svg>
    </button>
  )
}

export function Header({
  active,
  onSelectTab,
  onOpenModal,
  resetsLeft,
  availability,
  onPressReset,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className="sr-only">CHUTE</h1>
      <Tabs active={active} onSelect={onSelectTab} />
      <div className={styles.tools}>
        <ToolButton label="Ajuda" onClick={() => onOpenModal('help')}>
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M9.2 9.4a2.9 2.9 0 1 1 4.3 2.5c-1 .6-1.5 1.1-1.5 2.3" />
          </g>
          <circle cx="12" cy="17.4" r="1.25" fill="currentColor" />
        </ToolButton>
        <ToolButton label="Estatísticas" onClick={() => onOpenModal('stats')}>
          <path
            d="M5 20v-7M12 20V5M19 20v-10"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </ToolButton>
      </div>
      {active === 'extra' && (
        <div className={styles.reset}>
          <ResetButton remaining={resetsLeft} availability={availability} onPress={onPressReset} />
        </div>
      )}
    </header>
  )
}
