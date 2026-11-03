export const GAME_TIME_ZONE = 'America/Sao_Paulo'
const MS_PER_DAY = 86_400_000

/** Dia civil de `now` no fuso do jogo, no formato YYYY-MM-DD. */
export function todayKey(now: Date, tz: string = GAME_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

/** Número do dia civil de uma chave YYYY-MM-DD, para calcular distâncias entre datas. */
export function dayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number) as [number, number, number]
  const time = Date.UTC(year, month - 1, day)
  // Date.UTC aceita 30/02 e o transforma em março: a volta para texto revela o erro.
  if (Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== dateKey) {
    throw new RangeError(`Chave de data inválida: ${dateKey}`)
  }
  return time / MS_PER_DAY
}
