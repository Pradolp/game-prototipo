import { Board } from './components/Board'
import { Header } from './components/Header'
import { HelpModal } from './components/HelpModal'
import { Keyboard } from './components/Keyboard'
import { StatsModal } from './components/StatsModal'
import { PANEL_ID, tabId } from './components/tabIds'
import { Toast } from './components/Toast'
import type { Rng } from './game/rules'
import { useGame } from './hooks/useGame'
import { usePhysicalKeyboard } from './hooks/usePhysicalKeyboard'
import styles from './App.module.css'

interface AppProps {
  now?: () => Date
  rng?: Rng
}

const systemNow = () => new Date()

function App({ now = systemNow, rng = Math.random }: AppProps) {
  const ui = useGame(now, rng)
  const { game } = ui
  usePhysicalKeyboard(ui.play, ui.modal === null)

  return (
    <div className={styles.app} data-game={game.type}>
      <Header
        active={game.type}
        onSelectTab={ui.switchTab}
        onOpenModal={ui.openModal}
        resetsLeft={ui.resetsLeft}
        availability={ui.availability}
        onPressReset={ui.pressReset}
      />
      <main
        id={PANEL_ID}
        className={styles.panel}
        role="tabpanel"
        aria-labelledby={tabId(game.type)}
      >
        <Toast notice={ui.notice} />
        <Board
          rows={ui.rows}
          typingRow={game.guesses.length}
          revealRow={ui.revealRow}
          notice={ui.notice}
          onSelectSlot={(index) => ui.play({ type: 'selectSlot', index })}
        />
        <Keyboard letters={ui.letters} onAction={ui.play} />
      </main>
      {ui.modal === 'help' && <HelpModal onClose={ui.closeModal} />}
      {ui.modal === 'stats' && (
        <StatsModal
          game={game}
          onNextWord={ui.availability === 'ready' ? ui.pressReset : undefined}
          stats={ui.stats}
          streak={ui.streak}
          now={now}
          onClose={ui.closeModal}
        />
      )}
    </div>
  )
}

export default App
