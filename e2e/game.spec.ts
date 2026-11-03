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
const slot = (page: Page, number: number) =>
  page.getByRole('button', { name: new RegExp(`^casa ${number} de 5`) })
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
  await expect(slot(page, 1)).toHaveText('X')
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
  await expect(slot(page, 1)).toHaveText('')
})

test('preenche a 5ª casa primeiro e envia o chute na ordem das casas', async ({ page }) => {
  const guess = 'praia' === normalize(DAILY) ? 'pedra' : 'praia'
  const last = guess.at(-1) ?? ''
  await slot(page, 5).click()
  await page.getByRole('button', { name: last.toUpperCase(), exact: true }).click()
  await expect(slot(page, 5)).toHaveText(last.toUpperCase())
  await expect(slot(page, 1)).toHaveText('')

  await slot(page, 1).click()
  for (const letter of guess.slice(0, -1)) {
    await page.getByRole('button', { name: letter.toUpperCase(), exact: true }).click()
  }
  await page.getByRole('button', { name: 'OK, enviar palavra' }).click()

  const tiles = row(page, 1)
  await expect(tiles).toHaveCount(5)
  await expect(tiles.first()).toHaveText(guess.charAt(0).toUpperCase())
  await expect(tiles.last()).toHaveText(last.toUpperCase())
  await expect(tiles.first()).toHaveAttribute('aria-label', /^letra .+, /)
  await expect(slot(page, 1).first()).toHaveAttribute('aria-pressed', 'true')
})

test('Próxima palavra troca a palavra na aba CHUTE', async ({ page }) => {
  await page.getByRole('tab', { name: 'CHUTE' }).click()
  await page.keyboard.type(normalize(EXTRA))
  await page.keyboard.press('Enter')
  await page.getByRole('dialog').getByRole('button', { name: 'Próxima palavra' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(reset(page)).toHaveText('↻ 2')
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

  test('as teclas usam toda a largura e a altura mínima', async ({ page }) => {
    const keys = page.getByRole('group', { name: 'Teclado' }).getByRole('button')
    await expect(keys).toHaveCount(28)
    for (const key of await keys.all()) {
      const box = await key.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(52)
      expect(box?.width).toBeGreaterThanOrEqual(31)
    }
    const first = await page.getByRole('button', { name: 'Q', exact: true }).boundingBox()
    const last = await page.getByRole('button', { name: 'P', exact: true }).boundingBox()
    expect(first?.x).toBeLessThanOrEqual(4)
    expect((last?.x ?? 0) + (last?.width ?? 0)).toBeGreaterThanOrEqual(356)
    for (const name of ['OK, enviar palavra', 'Apagar']) {
      const box = await page.getByRole('button', { name }).boundingBox()
      expect(box?.width).toBeGreaterThanOrEqual(44)
    }
  })

  test('a linha do meio do teclado fica centralizada', async ({ page }) => {
    const first = await page.getByRole('button', { name: 'A', exact: true }).boundingBox()
    const last = await page.getByRole('button', { name: 'L', exact: true }).boundingBox()
    const left = first?.x ?? 0
    const right = 360 - ((last?.x ?? 0) + (last?.width ?? 0))
    expect(Math.abs(left - right)).toBeLessThanOrEqual(2)
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

for (const { name, width, height } of [
  { name: '360×640', width: 360, height: 640 },
  { name: 'celular deitado', width: 800, height: 360 },
  { name: 'celular deitado estreito', width: 640, height: 360 },
]) {
  test.describe(`em ${name}`, () => {
    test.use({ viewport: { width, height } })

    test('cabe sem rolagem, com casas e botões de pelo menos 44×44px', async ({ page }) => {
      await page.getByRole('tab', { name: 'CHUTE' }).click()
      const scroll = await page.evaluate(() => {
        const { scrollWidth, scrollHeight, clientWidth, clientHeight } = document.documentElement
        return { x: scrollWidth - clientWidth, y: scrollHeight - clientHeight }
      })
      expect(scroll).toEqual({ x: 0, y: 0 })

      const targets = [
        slot(page, 1),
        slot(page, 5),
        reset(page),
        page.getByRole('tab', { name: 'CHUTE' }),
        page.getByRole('tab', { name: 'Palavra do dia' }),
        page.getByRole('button', { name: 'Ajuda' }),
        page.getByRole('button', { name: 'Estatísticas' }),
      ]
      for (const target of targets) {
        await expect(target).toBeInViewport({ ratio: 1 })
        const box = await target.boundingBox()
        expect(box?.width).toBeGreaterThanOrEqual(44)
        expect(box?.height).toBeGreaterThanOrEqual(44)
      }
      await expect(row(page, 6).last()).toBeInViewport({ ratio: 1 })
      await expect(page.getByRole('button', { name: 'Apagar' })).toBeInViewport({ ratio: 1 })
    })
  })
}
