import type { ResetAvailability } from '../game/resets'
import styles from './ResetButton.module.css'

interface ResetButtonProps {
  remaining: number
  availability: ResetAvailability
  onPress: () => void
}

const LABEL: Record<ResetAvailability, (remaining: number) => string> = {
  ready: (remaining) => `Trocar a palavra, ${remaining} ${remaining === 1 ? 'troca' : 'trocas'}`,
  locked: () => 'Termine esta palavra para trocar',
  exhausted: () => 'Novas palavras amanhã',
}

/** Usa `aria-disabled`, não `disabled`: desativado, o toque ainda precisa mostrar o motivo. */
export function ResetButton({ remaining, availability, onPress }: ResetButtonProps) {
  const label = LABEL[availability](remaining)
  return (
    <button
      type="button"
      className={styles.reset}
      aria-disabled={availability !== 'ready'}
      aria-label={label}
      title={label}
      onClick={onPress}
    >
      ↻ {remaining}
    </button>
  )
}
