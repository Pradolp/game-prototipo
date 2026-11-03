import { expect, test } from '@playwright/test'

test('abre a página do jogo na Palavra do dia', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('CHUTE')
  await expect(page.getByRole('tab', { name: 'Palavra do dia' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})
