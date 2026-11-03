import type { FontSize, Preferences } from '../storage/preferences'
import { Modal } from './Modal'
import styles from './SettingsModal.module.css'

const LABEL_ID = 'settings-title'
const COLOR_HINT_ID = 'settings-color-hint'

const FONT_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Grande' },
  { value: 'huge', label: 'Muito grande' },
]

interface SettingsModalProps {
  preferences: Preferences
  onChange: (preferences: Preferences) => void
  onClose: () => void
}

export function SettingsModal({ preferences, onChange, onClose }: SettingsModalProps) {
  return (
    <Modal labelId={LABEL_ID} onClose={onClose}>
      <h2 id={LABEL_ID} className={styles.title}>
        Configurações
      </h2>
      <div className={styles.group}>
        <label className={styles.option}>
          <input
            type="checkbox"
            checked={preferences.colorBlind}
            aria-describedby={COLOR_HINT_ID}
            onChange={(event) => onChange({ ...preferences, colorBlind: event.target.checked })}
          />
          Modo daltônico
        </label>
        <p id={COLOR_HINT_ID} className={styles.hint}>
          A casa com a letra no lugar certo fica azul, em vez de verde.
        </p>
      </div>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Tamanho da fonte</legend>
        {FONT_OPTIONS.map(({ value, label }) => (
          <label key={value} className={styles.option}>
            <input
              type="radio"
              name="font-size"
              value={value}
              checked={preferences.fontSize === value}
              onChange={() => onChange({ ...preferences, fontSize: value })}
            />
            {label}
          </label>
        ))}
      </fieldset>
    </Modal>
  )
}
