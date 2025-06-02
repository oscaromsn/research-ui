import { expect, test } from '@playwright/test'

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/')

  // Check that the page title contains expected text
  await expect(page).toHaveTitle(/LexiSynth/)

  // Verify main heading is present
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('navigation is functional', async ({ page }) => {
  await page.goto('/')

  // Check that main interface elements are present
  await expect(page.getByRole('main')).toBeVisible()
})
