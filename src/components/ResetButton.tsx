import type { ResetAvailability } from '../game/resets'
import styles from './ResetButton.module.css'

interface ResetButtonProps {
  remaining: number
  availability: ResetAvailability
  onPress: () => void
}

const REASON: Record<ResetAvailability, string> = {
  ready: 'Trocar a palavra',
  locked: 'Termine esta palavra para trocar',
  exhausted: 'Novas palavras amanhã',
}

/** Usa `aria-disabled`, não `disabled`: desativado, o toque ainda precisa mostrar o motivo. */
export function ResetButton({ remaining, availability, onPress }: ResetButtonProps) {
  const reason = REASON[availability]
  return (
    <button
      type="button"
      className={styles.reset}
      aria-disabled={availability !== 'ready'}
      // O número visível também entra no nome: quem usa comando de voz fala o que vê.
      aria-label={`${reason}, ${remaining} ${remaining === 1 ? 'troca' : 'trocas'}`}
      title={reason}
      onClick={onPress}
    >
      <span aria-hidden="true">↻</span> {remaining}
    </button>
  )
}
