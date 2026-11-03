import { describe, expect, it } from 'vitest'
import { todayKey } from './dates'

describe('todayKey', () => {
  it('ainda é o dia anterior um segundo antes da meia-noite de Brasília', () => {
    expect(todayKey(new Date('2026-11-04T02:59:59Z'))).toBe('2026-11-03')
  })

  it('vira o dia exatamente à meia-noite de Brasília', () => {
    expect(todayKey(new Date('2026-11-04T03:00:00Z'))).toBe('2026-11-04')
  })

  it('não usa a data UTC', () => {
    const now = new Date('2026-11-04T01:00:00Z')
    expect(todayKey(now)).toBe('2026-11-03')
    expect(todayKey(now, 'UTC')).toBe('2026-11-04')
  })

  it('vira o mês e o ano no fuso de Brasília', () => {
    expect(todayKey(new Date('2027-01-01T02:59:59Z'))).toBe('2026-12-31')
    expect(todayKey(new Date('2027-01-01T03:00:00Z'))).toBe('2027-01-01')
  })

  it('preenche mês e dia com zero', () => {
    expect(todayKey(new Date('2026-03-05T12:00:00Z'))).toBe('2026-03-05')
  })

  it('aceita outro fuso', () => {
    expect(todayKey(new Date('2026-11-03T20:00:00Z'), 'Asia/Tokyo')).toBe('2026-11-04')
  })
})
