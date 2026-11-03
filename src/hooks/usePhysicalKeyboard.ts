import { useEffect } from 'react'
import type { GameAction } from '../game/game'

function toAction(key: string): GameAction | null {
  if (key === 'Backspace') return { type: 'deleteLetter' }
  if (key === 'Enter') return { type: 'submitGuess' }
  if (key === 'ArrowLeft') return { type: 'moveCursor', delta: -1 }
  if (key === 'ArrowRight') return { type: 'moveCursor', delta: 1 }
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
      const onSlot = button?.dataset.slot !== undefined
      // Enter em um botão focado pertence ao botão. Ao digitar, o foco volta para o jogo,
      // senão o Enter seguinte acionaria de novo a aba ou o ↻ tocado antes. Só a casa já
      // selecionada não tem o que fazer com ele: aí o Enter envia, como sempre.
      const selectedSlot = onSlot && button?.ariaPressed === 'true'
      if (button !== null && action.type === 'submitGuess' && !selectedSlot) return
      // Nas abas, as setas já servem para trocar de aba.
      if (action.type === 'moveCursor' && button?.role === 'tab') return
      // Nas casas, a seta leva o foco para a casa seguinte: o `Board` cuida disso.
      if (action.type !== 'moveCursor' || !onSlot) button?.blur()
      event.preventDefault()
      onAction(action)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onAction, enabled])
}
