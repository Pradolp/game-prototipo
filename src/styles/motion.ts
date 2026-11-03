import { WORD_LENGTH } from '../game/rules'

/** Tempos da virada das casas: o CSS recebe estes valores pelo `style` de cada casa. */
export const FLIP_MS = 420
export const FLIP_STAGGER_MS = 130
export const REVEAL_MS = FLIP_MS + FLIP_STAGGER_MS * (WORD_LENGTH - 1)

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
