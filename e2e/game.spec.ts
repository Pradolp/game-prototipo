import { expect, test, type Page } from '@playwright/test'
import { getDailyWord } from '../src/game/daily'
import { normalize } from '../src/game/normalize'
import { createResetState, drawFirstExtra } from '../src/game/resets'

const NOW = new Date('2026-11-03T15:00:00.000Z')
const TODAY = '2026-11-03'
const DAILY = getDailyWord(TODAY)
const EXTRA = drawFirstExtra(createResetState(TODAY), TODAY, () => 0)?.word ?? ''
const row = (page: Page, number: number) =>
  page.getByRole('group', { name: `Tentativa ${number}` }).getByRole('img')
const reset = (page: Page) => page.getByRole('button', { name: /trocar|Novas palavras/i })

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
  await page.addInitScript(() => {
    Math.random = () => 0
  })
  await page.goto('/')
  // O teclado físico só responde depois que o React monta.
  await expect(page.getByRole('tablist')).toBeVisible()
})

test('vence a palavra do dia e vê o resultado', async ({ page }) => {
  await page.keyboard.type(normalize(DAILY))
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Você acertou!')
  await expect(dialog).toContainText(DAILY.toUpperCase())
  await expect(dialog).toContainText('Próxima palavra do dia em 12:00:00')
  await dialog.getByRole('button', { name: 'Fechar' }).click()
  await expect(row(page, 1).first()).toHaveAttribute('aria-label', /lugar certo/)
})

test('palavra fora da lista não gasta tentativa', async ({ page }) => {
  await page.keyboard.type('xxxxx')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toHaveText('Palavra não encontrada')
  await expect(row(page, 1).first()).toHaveAttribute('aria-label', 'letra X')
})

test('o ↻ só existe na aba CHUTE e troca a palavra terminada', async ({ page }) => {
  await expect(page.getByText(/↻/)).toHaveCount(0)
  await page.getByRole('tab', { name: 'CHUTE' }).click()
  await expect(reset(page)).toHaveText('↻ 3')
  await expect(reset(page)).toBeDisabled()

  await reset(page).click({ force: true })
  await expect(page.getByRole('status')).toHaveText('Termine esta palavra para trocar')

  await page.keyboard.type(normalize(EXTRA))
  await page.keyboard.press('Enter')
  await page.getByRole('dialog').getByRole('button', { name: 'Fechar' }).click()
  await expect(reset(page)).toBeEnabled()
  await reset(page).click()
  await expect(reset(page)).toHaveText('↻ 2')
  await expect(row(page, 1).first()).toHaveAttribute('aria-label', 'vazia')
})

test('a virada não se repete ao voltar para a aba', async ({ page }) => {
  await page.keyboard.type(normalize(DAILY))
  await page.keyboard.press('Enter')
  await page.getByRole('dialog').getByRole('button', { name: 'Fechar' }).click()
  await page.getByRole('tab', { name: 'CHUTE' }).click()
  await page.getByRole('tab', { name: 'Palavra do dia' }).click()
  await expect(page.locator('[data-flip]')).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test.describe('em 360px', () => {
  test.use({ viewport: { width: 360, height: 640 } })

  test('as teclas têm pelo menos 44×44px e a página não rola para o lado', async ({ page }) => {
    const keys = await page.getByRole('group', { name: 'Teclado' }).getByRole('button').all()
    expect(keys).toHaveLength(28)
    for (const key of keys) {
      const box = await key.boundingBox()
      expect(box?.width).toBeGreaterThanOrEqual(44)
      expect(box?.height).toBeGreaterThanOrEqual(44)
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('a ajuda abre mostrando o título, com o foco no modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajuda' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'CHUTE', level: 2 })).toBeInViewport()
    await expect(dialog).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
  })

  test('as abas ficam à esquerda e o ↻ à direita, na mesma linha', async ({ page }) => {
    await page.getByRole('tab', { name: 'CHUTE' }).click()
    const tabs = await page.getByRole('tablist').boundingBox()
    const button = await reset(page).boundingBox()
    expect(tabs?.x).toBeLessThan(16)
    expect((button?.x ?? 0) + (button?.width ?? 0)).toBeGreaterThan(336)
    expect(button?.y).toBeLessThan((tabs?.y ?? 0) + (tabs?.height ?? 0))
  })
})
