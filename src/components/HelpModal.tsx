import { Modal } from './Modal'
import { Tile } from './Tile'
import styles from './HelpModal.module.css'

const LABEL_ID = 'help-title'

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal labelId={LABEL_ID} onClose={onClose}>
      <h2 id={LABEL_ID} className={styles.title}>
        CHUTE
      </h2>
      <p className={styles.text}>
        Descubra a palavra de 5 letras em até 6 tentativas. Depois de cada tentativa, as casas
        mostram o quanto você chegou perto.
      </p>
      <dl className={styles.legend}>
        <div className={styles.example}>
          <dt className={styles.tile}>
            <Tile letter="M" result="correct" />
          </dt>
          <dd>A letra está na palavra, no lugar certo.</dd>
        </div>
        <div className={styles.example}>
          <dt className={styles.tile}>
            <Tile letter="A" result="present" />
          </dt>
          <dd>A letra está na palavra, em outro lugar. A casa tem borda tracejada.</dd>
        </div>
        <div className={styles.example}>
          <dt className={styles.tile}>
            <Tile letter="E" result="absent" />
          </dt>
          <dd>A letra não está na palavra.</dd>
        </div>
      </dl>
      <p className={styles.text}>
        Toque em uma casa para escolher onde escrever. Não precisa digitar acentos nem cedilha.
      </p>
      <h3 className={styles.subtitle}>Palavra do dia</h3>
      <p className={styles.text}>
        Uma palavra nova à meia-noite. É a única que conta para a sequência de dias.
      </p>
      <h3 className={styles.subtitle}>CHUTE</h3>
      <p className={styles.text}>
        Uma palavra a mais por dia. Quando terminar, toque em ↻ para jogar outra, até 3 vezes por
        dia.
      </p>
      <a
        className={styles.link}
        href={`${import.meta.env.BASE_URL}THIRD_PARTY_NOTICES.txt`}
        target="_blank"
        rel="noreferrer"
      >
        Créditos e licenças
      </a>
    </Modal>
  )
}
