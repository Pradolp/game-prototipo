import { expect, test, type Page } from '@playwright/test'
import { getDailyWord } from '../src/game/daily'
import { normalize } from '../src/game/normalize'
import { applyReset, createResetState, drawFirstExtra, type ResetResult } from '../src/game/resets'

const NOW = new Date('2026-11-03T15:00:00.000Z')
const NEXT_DAY = new Date('2026-11-04T03:00:00.000Z')
const TODAY = '2026-11-03'
const TOMORROW = '2026-11-04'
const DAILY = normalize(getDailyWord(TODAY))
const NEXT_DAILY = normalize(getDailyWord(TOMORROW))

/** Palavras de CHUTE do dia, na ordem em que saem com `Math.random` fixo em 0. */
function chuteWords(today: string): string[] {
  const first = drawFirstExtra(createResetState(today), today, () => 0)
  if (first === null) throw new Error('lista sem palavras')
  const steps: ResetResult[] = [first]
  for (let round = 0; round < 3; round += 1) {
    const last = steps.at(-1) as ResetResult
    const next = applyReset(last.state, today, 'won', () => 0)
    if (next === null) throw new Error('reset recusado')
    steps.push(next)
  }
  return steps.map(({ word }) => normalize(word))
}

const CHUTE_WORDS = chuteWords(TODAY)
const WRONG = ['acaso', 'achar', 'adiar', 'abuso'].filter(
  (word) => word !== DAILY && !CHUTE_WORDS.includes(word),
)

const row = (page: Page, number: number) =>
  page.getByRole('group', { name: `Tentativa ${number}` }).getByRole('img')
const slot = (page: Page, number: number) =>
  page.getByRole('button', { name: new RegExp(`^casa ${number} de 5`) })
const reset = (page: Page) => page.getByRole('button', { name: /trocar|Novas palavras/i })
const tab = (page: Page, name: string) => page.getByRole('tab', { name })

const ready = (page: Page) => expect(page.getByRole('tablist')).toBeVisible()

async function guess(page: Page, word: string) {
  await page.keyboard.type(word)
  await page.keyboard.press('Enter')
}

/** Acerta a palavra e fecha a janela de resultado. */
async function win(page: Page, word: string) {
  await guess(page, word)
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Você acertou!')
  await dialog.getByRole('button', { name: 'Fechar' }).click()
  await expect(dialog).toHaveCount(0)
}

const figure = (page: Page, label: string) =>
  page
    .getByRole('dialog')
    .locator('div', { has: page.getByText(label, { exact: true }) })
    .last()

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
  await page.addInitScript(() => {
    Math.random = () => 0
  })
  await page.goto('/')
  await ready(page)
})

test('(1) dois chutes continuam na tela depois de recarregar', async ({ page }) => {
  const [first = '', second = ''] = WRONG
  await guess(page, first)
  await expect(row(page, 1)).toHaveCount(5)
  await guess(page, second)
  await expect(row(page, 2)).toHaveCount(5)
  await slot(page, 3).click()
  await page.keyboard.type('b')

  await page.reload()
  await ready(page)

  await expect(row(page, 1).first()).toHaveText(first.charAt(0).toUpperCase())
  await expect(row(page, 1).first()).toHaveAttribute('aria-label', /^letra /)
  await expect(row(page, 2).first()).toHaveText(second.charAt(0).toUpperCase())
  await expect(slot(page, 3)).toHaveText('B')
  await expect(slot(page, 4)).toHaveAttribute('aria-pressed', 'true')
})

test('recarregar na aba CHUTE abre em Palavra do dia e mantém a palavra', async ({ page }) => {
  const [word = ''] = WRONG
  await tab(page, 'CHUTE').click()
  await guess(page, word)
  await expect(row(page, 1)).toHaveCount(5)

  await page.reload()
  await ready(page)
  await expect(tab(page, 'Palavra do dia')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText(/↻/)).toHaveCount(0)

  await tab(page, 'CHUTE').click()
  await expect(reset(page)).toHaveText('↻ 3')
  await expect(row(page, 1).first()).toHaveText(word.charAt(0).toUpperCase())
})

test('(2) o ↻ exige terminar cada palavra e acaba depois de 3 trocas', async ({ page }) => {
  await tab(page, 'CHUTE').click()
  const [last, ...words] = [...CHUTE_WORDS].reverse()
  for (const [index, word] of words.reverse().entries()) {
    await expect(reset(page)).toHaveText(`↻ ${3 - index}`)
    await expect(reset(page)).toBeDisabled()
    await win(page, word)
    await expect(reset(page)).toBeEnabled()
    await reset(page).click()
  }

  await expect(reset(page)).toHaveText('↻ 0')
  await expect(reset(page)).toBeDisabled()
  await reset(page).click({ force: true })
  await expect(page.getByRole('status')).toHaveText('Novas palavras amanhã')

  await win(page, last ?? '')
  await expect(reset(page)).toBeDisabled()

  await page.reload()
  await ready(page)
  await tab(page, 'CHUTE').click()
  await expect(reset(page)).toHaveText('↻ 0')
  await expect(reset(page)).toBeDisabled()
})

test('(3) no dia seguinte, os resets voltam a 3 e a palavra do dia muda', async ({ page }) => {
  expect(NEXT_DAILY).not.toBe(DAILY)
  await tab(page, 'CHUTE').click()
  await win(page, CHUTE_WORDS[0] ?? '')
  await reset(page).click()
  await expect(reset(page)).toHaveText('↻ 2')

  await page.clock.setFixedTime(NEXT_DAY)
  await page.reload()
  await ready(page)

  await win(page, NEXT_DAILY)
  await tab(page, 'CHUTE').click()
  await expect(reset(page)).toHaveText('↻ 3')
  await expect(slot(page, 1)).toHaveText('')
})

test('(4) vencer atualiza as estatísticas, que sobrevivem ao recarregar', async ({ page }) => {
  const [wrong = ''] = WRONG
  await guess(page, wrong)
  await expect(row(page, 1)).toHaveCount(5)
  await win(page, DAILY)

  await page.reload()
  await ready(page)
  await page.getByRole('button', { name: 'Estatísticas' }).click()

  for (const label of ['Jogos', 'Vitórias', 'Sequência', 'Melhor sequência']) {
    await expect(figure(page, label).locator('dd')).toHaveText('1')
  }
  await expect(page.getByRole('listitem', { name: '2ª tentativa: 1' })).toBeVisible()
  await expect(page.getByRole('listitem', { name: '1ª tentativa: 0' })).toBeVisible()
})

test('(5) o ↻ não aparece na aba Palavra do dia', async ({ page }) => {
  await expect(page.getByText(/↻/)).toHaveCount(0)
  await tab(page, 'CHUTE').click()
  await expect(reset(page)).toBeVisible()
  await tab(page, 'Palavra do dia').click()
  await expect(page.getByText(/↻/)).toHaveCount(0)
})

for (const [name, returnToTab] of [
  [
    'visibilitychange',
    (page: Page) => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))),
  ],
  ['focus', (page: Page) => page.evaluate(() => window.dispatchEvent(new Event('focus')))],
] as const) {
  test(`(6) com a página aberta, ${name} depois da meia-noite inicia o novo dia`, async ({
    page,
  }) => {
    await tab(page, 'CHUTE').click()
    await win(page, CHUTE_WORDS[0] ?? '')
    await reset(page).click()
    await expect(reset(page)).toHaveText('↻ 2')
    await page.keyboard.type('b')
    await expect(slot(page, 1)).toHaveText('B')

    await page.clock.setFixedTime(NEXT_DAY)
    await returnToTab(page)

    await expect(tab(page, 'Palavra do dia')).toHaveAttribute('aria-selected', 'true')
    await win(page, NEXT_DAILY)
    await tab(page, 'CHUTE').click()
    await expect(reset(page)).toHaveText('↻ 3')
    await expect(slot(page, 1)).toHaveText('')
  })
}
