import { collectPageErrors } from '../support/page-errors';
import { expect, test } from '../fixtures/test';

test.describe('collectPageErrors', () => {
  // These tests trigger errors on purpose; the auto guard must accept exactly those.
  test.use({ allowedPageErrors: /boom|does-not-exist\.png/ });

  test('records console errors, uncaught exceptions and same-origin 404s', async ({
    page,
    baseURL,
  }) => {
    const origin = baseURL ?? '';
    const collector = collectPageErrors(page, origin);
    await page.goto('/');

    await page.evaluate(async () => {
      console.error('boom');
      setTimeout(() => {
        throw new Error('kaboom');
      }, 0);
      await fetch('/does-not-exist.png').catch(() => undefined);
    });

    await expect
      .poll(() => collector.errors)
      .toEqual(
        expect.arrayContaining([
          'console.error: boom',
          'uncaught exception: kaboom',
          `HTTP 404: ${origin}/does-not-exist.png`,
        ]),
      );
  });

  test('ignores cross-origin failures', async ({ page, baseURL }) => {
    const collector = collectPageErrors(page, baseURL ?? '');
    await page.route('https://third-party.example/**', (route) => route.abort());
    await page.goto('/');

    await page.evaluate(() => fetch('https://third-party.example/x').catch(() => undefined));

    expect(collector.errors.filter((e) => e.includes('third-party'))).toEqual([]);
  });
});

test.describe('storageState seeding', () => {
  test.use({ theme: 'light', lang: 'pt' });

  test('seeds theme and language once, so changes survive a reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });
    await page.reload();

    // If the fixture re-seeded on every navigation, this would be 'light' again.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
