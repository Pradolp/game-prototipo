import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

// O jsdom ainda não tem `showModal`/`close`, `scrollTo` em elementos nem `matchMedia`.
HTMLElement.prototype.scrollTo = () => undefined
HTMLDialogElement.prototype.showModal = function () {
  this.open = true
}
HTMLDialogElement.prototype.close = function () {
  this.open = false
  this.dispatchEvent(new Event('close'))
}
// Com movimento reduzido, a linha vira na hora e os testes não esperam a animação.
window.matchMedia = (query) => ({ matches: true, media: query }) as MediaQueryList
