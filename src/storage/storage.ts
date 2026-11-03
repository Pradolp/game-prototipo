const PREFIX = 'chute:v1:'

/** Lê um valor salvo. Devolve `null` se ele não existir ou se o storage falhar. */
export function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? null : (JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

/** Grava um valor. Se o storage falhar, o jogo segue só na memória. */
export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage cheio ou bloqueado: perder o salvamento não pode parar o jogo.
  }
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isCount = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0
