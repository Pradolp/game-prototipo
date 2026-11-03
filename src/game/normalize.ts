/** Forma usada em toda comparação: sem acentos, ç -> c, minúsculas. */
export const normalize = (word: string): string =>
  word.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
