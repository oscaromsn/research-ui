# Test info

- Name: homepage loads successfully
- Location: /Users/oscar/Projects/jurisconsulta-new/next-app/e2e/app.spec.ts:3:5

# Error details

```
Error: browserType.launch: Executable doesn't exist at /Users/oscar/Library/Caches/ms-playwright/firefox-1482/firefox/Nightly.app/Contents/MacOS/firefox
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     pnpm exec playwright install                                        ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
>  3 | test('homepage loads successfully', async ({ page }) => {
     |     ^ Error: browserType.launch: Executable doesn't exist at /Users/oscar/Library/Caches/ms-playwright/firefox-1482/firefox/Nightly.app/Contents/MacOS/firefox
   4 |   await page.goto('/');
   5 |   
   6 |   // Check that the page title contains expected text
   7 |   await expect(page).toHaveTitle(/LexiSynth/);
   8 |   
   9 |   // Verify main heading is present
  10 |   await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  11 | });
  12 |
  13 | test('navigation is functional', async ({ page }) => {
  14 |   await page.goto('/');
  15 |   
  16 |   // Check that main interface elements are present
  17 |   await expect(page.getByRole('main')).toBeVisible();
  18 | });
```