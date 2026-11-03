import { expect, test } from '@playwright/test'

test('abre a página do jogo', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('CHUTE')
  await expect(page.getByRole('heading', { name: 'CHUTE' })).toBeVisible()
})
