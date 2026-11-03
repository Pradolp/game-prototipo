import { useEffect, useState } from 'react'
import { formatCountdown, msUntilNextDay } from '../game/dates'

/** Tempo até a próxima palavra do dia, atualizado a cada segundo. */
export function useCountdown(now: () => Date): string {
  const [remaining, setRemaining] = useState(() => msUntilNextDay(now()))
  useEffect(() => {
    const timer = setInterval(() => setRemaining(msUntilNextDay(now())), 1000)
    return () => clearInterval(timer)
  }, [now])
  return formatCountdown(remaining)
}
