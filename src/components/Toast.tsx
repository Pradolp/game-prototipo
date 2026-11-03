import type { Notice, NoticeKind } from '../hooks/useGame'
import styles from './Toast.module.css'

const MESSAGE: Record<NoticeKind, string> = {
  tooShort: 'Faltam letras',
  notInList: 'Palavra não encontrada',
  finishWord: 'Termine esta palavra para trocar',
  noResets: 'Novas palavras amanhã',
}

/** A região fica sempre montada: leitores de tela só anunciam mudanças em quem já existe. */
export function Toast({ notice }: { notice: Notice | null }) {
  return (
    <div className={styles.region} role="status">
      {notice && (
        <p key={notice.id} className={styles.toast}>
          {MESSAGE[notice.kind]}
        </p>
      )}
    </div>
  )
}
