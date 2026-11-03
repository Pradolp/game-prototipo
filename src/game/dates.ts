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

/** Quanto falta para a próxima meia-noite no fuso do jogo. */
export function msUntilNextDay(now: Date, tz: string = GAME_TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((item) => item.type === type)?.value)
  const seconds = part('hour') * 3600 + part('minute') * 60 + part('second')
  return MS_PER_DAY - seconds * 1000 - now.getUTCMilliseconds()
}

/** Formata uma duração como HH:MM:SS, arredondando para cima o segundo em andamento. */
export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const units = [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60]
  return units.map((unit) => String(unit).padStart(2, '0')).join(':')
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
