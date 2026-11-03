import type { MouseEvent } from 'react'

/** Botão do jogo não pega o foco: o Enter do teclado físico continua enviando o chute. */
export const keepFocus = (event: MouseEvent) => event.preventDefault()
