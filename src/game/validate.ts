import { VALID_WORDS } from '../data/valid'
import { normalize } from './normalize'

const VALID_KEYS = new Set(VALID_WORDS.map(normalize))

export const isValidGuess = (guess: string): boolean => VALID_KEYS.has(normalize(guess))
