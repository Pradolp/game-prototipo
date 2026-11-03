import { expect, test, type Page } from '@playwright/test'
import { getDailyWord } from '../src/game/daily'
import { normalize } from '../src/game/normalize'

const NOW = new Date('2026-11-03T15:00:00.000Z')
const DAILY = normalize(getDailyWord('2026-11-03'))
const FONT_SIZES = [
  { label: 'Normal', px: '18px' },
  { label: 'Grande', px: '20px' },
  { label: 'Muito grande', px: '22px' },
]

const settings = (page: Page) => page.getByRole('button', { name: 'Configurações' })
const closeDialog = (page: Page) =>
  page.getByRole('dialog').getByRole('button', { name: 'Fechar' }).click()
const rootFontSize = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).fontSize)
const tileColor = (page: Page) =>
  page
    .getByRole('group', { name: 'Tentativa 1' })
    .getByRole('img')
    .first()
    .evaluate((tile) => getComputedStyle(tile).backgroundColor)

async function chooseFont(page: Page, label: string) {
  await settings(page).click()
  await page.getByRole('radio', { name: label, exact: true }).check()
  await closeDialog(page)
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
  await page.addInitScript(() => {
    Math.random = () => 0
  })
  await page.goto('/')
  await expect(page.getByRole('tablist')).toBeVisible()
})

test('a fonte muda na hora e continua depois de recarregar', async ({ page }) => {
  await settings(page).click()
  await page.getByRole('radio', { name: 'Muito grande' }).check()
  expect(await rootFontSize(page)).toBe('22px')
  await closeDialog(page)

  await page.reload()
  await expect(page.getByRole('tablist')).toBeVisible()
  expect(await rootFontSize(page)).toBe('22px')
  await settings(page).click()
  await expect(page.getByRole('radio', { name: 'Muito grande' })).toBeChecked()
})

test('o modo daltônico troca o verde pelo azul na hora, e a escolha fica salva', async ({
  page,
}) => {
  await page.keyboard.type(DAILY)
  await page.keyboard.press('Enter')
  await closeDialog(page)
  expect(await tileColor(page)).toBe('rgb(158, 206, 106)')

  await settings(page).click()
  await page.getByRole('checkbox', { name: 'Modo daltônico' }).check()
  await closeDialog(page)
  expect(await tileColor(page)).toBe('rgb(122, 162, 247)')

  await page.reload()
  await expect(page.getByRole('tablist')).toBeVisible()
  expect(await tileColor(page)).toBe('rgb(122, 162, 247)')
})

test('a janela funciona só pelo teclado e devolve o foco à engrenagem', async ({ page }) => {
  await settings(page).focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('checkbox', { name: 'Modo daltônico' })).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page.getByRole('checkbox', { name: 'Modo daltônico' })).toBeChecked()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('radio', { name: 'Normal' })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('radio', { name: 'Grande', exact: true })).toBeChecked()
  expect(await rootFontSize(page)).toBe('20px')

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(settings(page)).toBeFocused()
})

test('as setas levam o foco e a seleção pelas casas da linha atual', async ({ page }) => {
  const slot = (number: number) =>
    page.getByRole('button', { name: new RegExp(`^casa ${number} de 5`) })
  await slot(2).focus()
  await page.keyboard.press('Enter')
  await expect(slot(2)).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('ArrowRight')
  await expect(slot(3)).toHaveAttribute('aria-pressed', 'true')
  await expect(slot(3)).toBeFocused()
})

test('o resultado não substitui a janela aberta durante a virada', async ({ page }) => {
  await page.keyboard.type(DAILY)
  await page.keyboard.press('Enter')
  await settings(page).click()
  const dialog = page.getByRole('dialog', { name: 'Configurações' })
  await expect(dialog).toBeVisible()
  await expect(page.locator('[data-flip]')).toHaveCount(0)
  await page.getByRole('radio', { name: 'Normal' }).focus()
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Você acertou!' })).toHaveCount(0)
})

test('o foco do teclado aparece nas casas', async ({ page }) => {
  await settings(page).focus()
  await page.keyboard.press('Tab')
  const slot = page.getByRole('button', { name: /^casa 1 de 5/ })
  await expect(slot).toBeFocused()
  const outline = await slot.evaluate((tile) => getComputedStyle(tile).outlineStyle)
  expect(outline).toBe('solid')
})

test('a casa selecionada é anunciada para leitores de tela', async ({ page }) => {
  const live = page.locator('[aria-live="polite"]')
  await expect(live).toHaveText('casa 1 de 5, vazia, selecionada')
  await page.getByRole('button', { name: /^casa 4 de 5/ }).click()
  await expect(live).toHaveText('casa 4 de 5, vazia, selecionada')
})

const noScroll = (page: Page) =>
  page.evaluate(() => {
    const { scrollWidth, scrollHeight, clientWidth, clientHeight } = document.documentElement
    return { x: scrollWidth - clientWidth, y: scrollHeight - clientHeight }
  })

for (const { label } of FONT_SIZES) {
  test.describe(`fonte ${label} em 360×640`, () => {
    test.use({ viewport: { width: 360, height: 640 } })

    for (const name of ['Ajuda', 'Estatísticas', 'Configurações']) {
      test(`a janela de ${name} não estoura na largura`, async ({ page }) => {
        await chooseFont(page, label)
        await page.getByRole('button', { name }).click()
        const overflow = await page
          .getByRole('dialog')
          .evaluate((dialog) => dialog.scrollWidth - dialog.clientWidth)
        expect(overflow).toBeLessThanOrEqual(0)
      })
    }
  })

  for (const { width, height, tall } of [
    { width: 360, height: 640, tall: true },
    { width: 360, height: 560, tall: false },
    { width: 320, height: 568, tall: false },
    { width: 480, height: 800, tall: true },
    { width: 500, height: 800, tall: true },
    { width: 640, height: 360, tall: true },
    { width: 740, height: 360, tall: true },
    { width: 800, height: 360, tall: true },
    { width: 1024, height: 600, tall: true },
  ]) {
    test.describe(`fonte ${label} em ${width}×${height}`, () => {
      test.use({ viewport: { width, height } })

      test('tudo cabe sem rolagem e sem sobreposição', async ({ page }) => {
        await chooseFont(page, label)
        await page.getByRole('tab', { name: 'CHUTE' }).click()
        expect(await noScroll(page)).toEqual({ x: 0, y: 0 })

        const keyboard = page.getByRole('group', { name: 'Teclado' })
        await expect(page.getByRole('group', { name: 'Tabuleiro' })).toBeInViewport({ ratio: 1 })
        await expect(keyboard).toBeInViewport({ ratio: 1 })
        for (const key of await keyboard.getByRole('button').all()) {
          await expect(key).toBeInViewport({ ratio: 1 })
          const fits = await key.evaluate((button) => button.scrollWidth <= button.clientWidth)
          expect(fits).toBe(true)
        }

        const reset = page.getByRole('button', { name: /trocar/i })
        await expect(reset).toBeInViewport({ ratio: 1 })
        const resetBox = await reset.boundingBox()
        const tabs = await page.getByRole('tablist').boundingBox()
        expect((tabs?.x ?? 0) + (tabs?.width ?? 0)).toBeLessThanOrEqual(resetBox?.x ?? 0)
        for (const name of ['Ajuda', 'Estatísticas', 'Configurações']) {
          const tool = page.getByRole('button', { name })
          await expect(tool).toBeInViewport({ ratio: 1 })
          const box = await tool.boundingBox()
          const clear =
            (box?.x ?? 0) + (box?.width ?? 0) <= (resetBox?.x ?? 0) ||
            (box?.y ?? 0) >= (resetBox?.y ?? 0) + (resetBox?.height ?? 0)
          expect(clear).toBe(true)
        }

        if (tall) {
          const tile = await page.getByRole('button', { name: /^casa 1 de 5/ }).boundingBox()
          expect(tile?.width).toBeGreaterThanOrEqual(44)
          expect(tile?.height).toBeGreaterThanOrEqual(44)
        }
      })
    })
  }
}
