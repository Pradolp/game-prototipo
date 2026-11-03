export const WORD_LENGTH = 5
export const MAX_ATTEMPTS = 6

/** Gera números em [0, 1), como `Math.random`. Injetável para testes determinísticos. */
export type Rng = () => number
