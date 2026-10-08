import { test as base, expect } from '@playwright/test';
import { PortfolioPage } from '../pages/portfolio.page';
import { collectPageErrors } from '../support/page-errors';
import type { Lang, Theme } from '../support/types';

export interface PortfolioOptions {
  /** Theme saved in localStorage before the first load. `null` keeps the site default (dark). */
  theme: Theme | null;
  /** Language saved in localStorage before the first load. `null` lets the site auto-detect. */
  lang: Lang | null;
  /**
   * Pattern for console/page/network errors a test expects and accepts. `null` by default:
   * any error fails the test. Keep it narrow and explain why next to the `test.use` call.
   * (A single RegExp rather than an array: `test.use` reads arrays as [value, options].)
   */
  allowedPageErrors: RegExp | null;
}

interface PortfolioFixtures {
  /** Page object for the site. Not opened yet: call `portfolio.goto()`. */
  portfolio: PortfolioPage;
  /** Auto fixture: fails the test if the page logged errors or same-origin requests failed. */
  pageErrorGuard: undefined;
}

/**
 * The project's `test`. Import it from here (not from '@playwright/test') in every spec.
 *
 * Theme and language are seeded through `storageState`, which applies once when the
 * browser context is created. That matters: an `addInitScript` would re-seed on every
 * reload and hide persistence bugs, while storageState lets the site's own pre-paint
 * script read the saved value exactly as it does for a returning visitor.
 */
export const test = base.extend<PortfolioOptions & PortfolioFixtures>({
  theme: [null, { option: true }],
  lang: [null, { option: true }],
  allowedPageErrors: [null, { option: true }],

  storageState: async ({ theme, lang, baseURL }, use) => {
    const localStorage = [
      ...(theme ? [{ name: 'theme', value: theme }] : []),
      ...(lang ? [{ name: 'lang', value: lang }] : []),
    ];
    if (!baseURL || localStorage.length === 0) {
      await use(undefined);
      return;
    }
    await use({ cookies: [], origins: [{ origin: new URL(baseURL).origin, localStorage }] });
  },

  portfolio: async ({ page }, use) => {
    await use(new PortfolioPage(page));
  },

  pageErrorGuard: [
    async ({ page, baseURL, allowedPageErrors }, use) => {
      const collector = collectPageErrors(page, baseURL ?? 'http://localhost');
      await use(undefined);
      const unexpected = collector.errors.filter((error) => !allowedPageErrors?.test(error));
      expect(unexpected, 'page reported errors during the test').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
