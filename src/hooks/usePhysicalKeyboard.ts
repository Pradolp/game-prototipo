import { useEffect } from 'react'
import type { GameAction } from '../game/game'

function toAction(key: string): GameAction | null {
  if (key === 'Backspace') return { type: 'deleteLetter' }
  if (key === 'Enter') return { type: 'submitGuess' }
  return /^\p{L}$/u.test(key) ? { type: 'typeLetter', letter: key } : null
}

/** Liga o teclado físico ao jogo enquanto `enabled` for verdadeiro. */
export function usePhysicalKeyboard(onAction: (action: GameAction) => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const action = toAction(event.key)
      if (action === null) return
      const button = event.target instanceof HTMLButtonElement ? event.target : null
      // Enter em um botão focado pertence ao botão. Ao digitar, o foco volta para o jogo,
      // senão o Enter seguinte acionaria de novo a aba ou o ↻ tocado antes.
      if (button !== null && action.type === 'submitGuess') return
      button?.blur()
      event.preventDefault()
      onAction(action)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onAction, enabled])
}
