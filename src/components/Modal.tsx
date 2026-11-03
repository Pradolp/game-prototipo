import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import styles from './Modal.module.css'

interface ModalProps {
  labelId: string
  onClose: () => void
  /** Ação principal da janela: quando existe, "Fechar" passa a ser a secundária. */
  action?: { label: string; onClick: () => void }
  children: ReactNode
}

/** `<dialog>` nativo: prende o foco, fecha com Esc e devolve o foco ao sair. */
export function Modal({ labelId, onClose, action, children }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal()
    // O `showModal` foca "Fechar" e rola um modal longo até o fim, escondendo o título.
    dialog.current?.focus()
    dialog.current?.scrollTo(0, 0)
  }, [])

  const closeOnBackdrop = (event: MouseEvent) => {
    if (event.target === dialog.current) dialog.current?.close()
  }

  return (
    <dialog
      ref={dialog}
      tabIndex={-1}
      className={styles.modal}
      aria-labelledby={labelId}
      onClose={onClose}
      onClick={closeOnBackdrop}
    >
      <div className={styles.content}>
        {children}
        {action && (
          <button type="button" className={styles.button} onClick={action.onClick}>
            {action.label}
          </button>
        )}
        <button
          type="button"
          className={styles.button}
          data-secondary={action ? true : undefined}
          onClick={() => dialog.current?.close()}
        >
          Fechar
        </button>
      </div>
    </dialog>
  )
}
