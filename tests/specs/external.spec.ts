import { BOT_LIMITED_HOSTS } from '../data/links';
import { expect, req, test } from '../fixtures/test';
import { collectLinks } from '../support/links';

/**
 * Real-network checks of the page's external links. Excluded from normal runs (grepInvert in
 * playwright.config.ts); the Nightly workflow runs them with RUN_EXTERNAL=1. Each link is
 * retried for up to a minute, so a brief third-party outage doesn't fail the night.
 */
test.describe('external destinations', { tag: '@external' }, () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'a network check needs one browser');

  test(
    'every external link on the page answers without an error',
    { annotation: req('REQ-LINK-06') },
    async ({ page, portfolio, request }) => {
      await portfolio.goto();
      const urls = [
        ...new Set(
          (await collectLinks(page)).filter((l) => l.kind === 'external').map((l) => l.url),
        ),
      ];
      expect(urls.length, 'external links on the page').toBeGreaterThan(0);

      for (const url of urls) {
        const limited = BOT_LIMITED_HOSTS.find((h) => h.host === new URL(url).host);

        await test.step(url, async () => {
          await expect(async () => {
            const response = await request.get(url, { maxRedirects: 5, timeout: 15_000 });
            const status = response.status();
            const accepted = status < 400 || (limited?.acceptedStatuses.includes(status) ?? false);
            expect(accepted, `${url} answered HTTP ${String(status)}`).toBe(true);
          }).toPass({ intervals: [2_000, 5_000, 15_000], timeout: 60_000 });
        });
      }
    },
  );
});
