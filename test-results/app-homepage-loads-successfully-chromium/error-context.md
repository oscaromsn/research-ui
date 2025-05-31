# Test info

- Name: homepage loads successfully
- Location: /Users/oscar/Projects/jurisconsulta-new/next-app/e2e/app.spec.ts:3:5

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: getByRole('heading', { level: 1 })
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for getByRole('heading', { level: 1 })

    at /Users/oscar/Projects/jurisconsulta-new/next-app/e2e/app.spec.ts:10:57
```

# Page snapshot

```yaml
- banner:
  - text: LS LexiSynth
  - textbox: "Research: Maritime Salvage Rights - The 'Oceanic' Case"
  - text: Ideate Plan Research Analyze Review Draft
  - button
  - button
  - button
- main:
  - heading "Guidance & Strategy" [level=2]
  - text: Auto Mode Automatically refine queries and continue research
  - switch
  - textbox "Enter Legal Question or Research Topic"
  - text: "Jurisdiction: Federal Jurisdiction: California"
  - button "Start Research" [disabled]
  - heading "Evidence & Analysis" [level=2]
  - button "Menu options":
    - img "Menu"
  - text: No document content available. Relevance 0/10
  - paragraph: "Summary:"
  - paragraph: No analysis available for this document.
  - paragraph: "Key Arguments:"
  - list:
    - listitem: No key arguments identified.
  - paragraph: "Extracted Entities:"
  - text: No entities extracted.
  - button "View Analysis Reasoning"
  - heading "Synthesis & Reporting" [level=2]
  - button "Synthesis Studio"
  - button "Report Drafter"
  - heading "Synthesized Topics" [level=3]
  - paragraph: No synthesis topics available yet. Topics will appear here as analysis progresses.
  - heading "Unanswered Aspects:" [level=3]
  - paragraph: No unanswered aspects identified yet.
  - button "View Synthesis Reasoning"
- alert
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test('homepage loads successfully', async ({ page }) => {
   4 |   await page.goto('/');
   5 |   
   6 |   // Check that the page title contains expected text
   7 |   await expect(page).toHaveTitle(/LexiSynth/);
   8 |   
   9 |   // Verify main heading is present
> 10 |   await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
     |                                                         ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  11 | });
  12 |
  13 | test('navigation is functional', async ({ page }) => {
  14 |   await page.goto('/');
  15 |   
  16 |   // Check that main interface elements are present
  17 |   await expect(page.getByRole('main')).toBeVisible();
  18 | });
```