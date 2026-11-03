import { describe, expect, it } from 'vitest'

// Teste de exemplo: confirma que o Vitest roda em src/game/.
// Pode ser removido quando a lógica real chegar na Fase 2.
describe('ambiente de testes', () => {
  it('executa um teste simples', () => {
    expect('palavra'.length).toBe(7)
  })
})
