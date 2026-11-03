import { displayWord } from '../game/board'
import type { GameState } from '../game/game'
import type { Stats } from '../game/stats'
import { useCountdown } from '../hooks/useCountdown'
import { Modal } from './Modal'
import styles from './StatsModal.module.css'

const LABEL_ID = 'stats-title'

interface StatsModalProps {
  game: GameState
  stats: Stats
  streak: number
  now: () => Date
  onClose: () => void
  /** Presente quando o ↻ pode trocar a palavra. */
  onNextWord?: () => void
}

const TITLE: Record<GameState['status'], string> = {
  playing: 'Estatísticas',
  won: 'Você acertou!',
  lost: 'Não foi dessa vez',
}

function Countdown({ now }: { now: () => Date }) {
  const time = useCountdown(now)
  return (
    <p className={styles.countdown}>
      Próxima palavra do dia em <strong className={styles.time}>{time}</strong>
    </p>
  )
}

export function StatsModal({ game, stats, streak, now, onClose, onNextWord }: StatsModalProps) {
  const finished = game.status !== 'playing'
  const showNext = game.type === 'extra' && onNextWord !== undefined
  const figures = [
    { label: 'Jogos', value: stats.played },
    { label: 'Vitórias', value: stats.won },
    { label: 'Sequência', value: streak },
    { label: 'Melhor sequência', value: stats.bestStreak },
  ]
  const peak = Math.max(1, ...stats.distribution)
  const lastAttempts = game.status === 'won' ? game.guesses.length : null

  return (
    <Modal
      labelId={LABEL_ID}
      onClose={onClose}
      action={showNext ? { label: 'Próxima palavra', onClick: onNextWord } : undefined}
    >
      <h2 id={LABEL_ID} className={styles.title}>
        {TITLE[game.status]}
      </h2>
      {finished && (
        <p className={styles.answer}>
          <span>A palavra era</span>
          <strong className={styles.word}>{displayWord(game.answer)}</strong>
        </p>
      )}
      <dl className={styles.figures}>
        {figures.map(({ label, value }) => (
          <div key={label} className={styles.figure}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className={styles.subtitle}>Vitórias por tentativa</h3>
        <ol className={styles.bars}>
          {stats.distribution.map((count, index) => (
            <li
              key={index}
              className={styles.bar}
              data-current={index + 1 === lastAttempts || undefined}
              aria-label={`${index + 1}ª tentativa: ${count}`}
            >
              <span className={styles.attempt}>{index + 1}</span>
              <span className={styles.track}>
                <span className={styles.fill} style={{ width: `${(count / peak) * 100}%` }} />
              </span>
              <span className={styles.count}>{count}</span>
            </li>
          ))}
        </ol>
      </div>
      {finished && <Countdown now={now} />}
    </Modal>
  )
}
