import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { getDailyWord } from '../src/game/daily'
import { normalize } from '../src/game/normalize'

const NOW = new Date('2026-11-03T15:00:00.000Z')
const DAILY = normalize(getDailyWord('2026-11-03'))
const WRONG = ['acaso', 'achar'].filter((word) => word !== DAILY)

async function guess(page: Page, word: string) {
  await page.keyboard.type(word)
  await page.keyboard.press('Enter')
}

/** Falha com a regra e os elementos no relatório, para o erro já dizer o que corrigir. */
async function expectNoSeriousIssues(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations
    .filter(({ impact }) => impact === 'serious' || impact === 'critical')
    .map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.map(({ html }) => html) }))
  expect(serious).toEqual([])
}

async function enableColorBlind(page: Page) {
  await page.getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('checkbox', { name: 'Modo daltônico' }).check()
  await page.getByRole('dialog').getByRole('button', { name: 'Fechar' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
  await page.addInitScript(() => {
    Math.random = () => 0
  })
  await page.goto('/')
  await expect(page.getByRole('tablist')).toBeVisible()
})

test('jogo em andamento, nas duas abas', async ({ page }) => {
  await guess(page, WRONG[0] ?? '')
  await expect(page.locator('[data-flip]')).toHaveCount(0)
  await expectNoSeriousIssues(page)
  await page.getByRole('tab', { name: 'CHUTE' }).click()
  await expectNoSeriousIssues(page)
})

test('modo daltônico, com o teclado colorido', async ({ page }) => {
  await enableColorBlind(page)
  await guess(page, WRONG[0] ?? '')
  await guess(page, WRONG[1] ?? '')
  await expect(page.locator('[data-flip]')).toHaveCount(0)
  await expectNoSeriousIssues(page)
})

for (const name of ['Ajuda', 'Estatísticas', 'Configurações']) {
  test(`janela de ${name}`, async ({ page }) => {
    await page.getByRole('button', { name }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoSeriousIssues(page)
  })
}

test('janela de resultado', async ({ page }) => {
  await guess(page, DAILY)
  await expect(page.getByRole('dialog')).toContainText('Você acertou!')
  await expectNoSeriousIssues(page)
})
