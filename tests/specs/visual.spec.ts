import { expect, req, test } from '../fixtures/test';
import { THEMES } from '../support/types';

/** A fixed date, so the footer year in the full-page screenshot never changes. */
const FIXED_DATE = new Date('2026-06-15T12:00:00Z');

test.describe('visual', { tag: '@visual' }, () => {
  // Pixels depend on the OS font rendering. Baselines are generated and compared only on Linux,
  // inside the pinned Playwright container (CI). VISUAL_LOCAL=1 allows local experiments; those
  // baselines are git-ignored and never committed.
  test.skip(
    process.platform !== 'linux' && !process.env.VISUAL_LOCAL,
    'visual baselines are Linux-only (Playwright container in CI)',
  );

  for (const theme of THEMES) {
    test.describe(`${theme} theme`, () => {
      test.use({ theme, lang: 'en' });

      test.beforeEach(async ({ page, portfolio }) => {
        await page.clock.setFixedTime(FIXED_DATE);
        await portfolio.goto();
        expect(await portfolio.webFontsLoaded(), 'Inter and JetBrains Mono loaded').toBe(true);
      });

      test('first screen', { annotation: req('REQ-VIS-01') }, async ({ page }) => {
        await expect(page).toHaveScreenshot(`first-screen-${theme}.png`);
      });

      test('full page', { annotation: req('REQ-VIS-01') }, async ({ page, portfolio }) => {
        const clip = await portfolio.fullPageClip();
        await expect(page).toHaveScreenshot(`full-page-${theme}.png`, { fullPage: true, clip });
      });
    });
  }
});
