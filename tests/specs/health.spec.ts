import { expect, req, test } from '../fixtures/test';
import { collectLinks } from '../support/links';
import { readMetadata, sameAsUrls } from '../support/metadata';
import { collectPageErrors } from '../support/page-errors';

const CANONICAL_URL = 'https://andrelkj.github.io/';
const TITLE = 'André Kreutzer — Sr. QA Engineer / SDET';

test.describe('page health', () => {
  test(
    'home page loads with its title and main landmark',
    { tag: '@smoke', annotation: req('REQ-HEALTH-01') },
    async ({ page, portfolio }) => {
      await portfolio.goto();

      await expect(page).toHaveTitle(TITLE);
      await expect(portfolio.main).toBeVisible();
      await expect(portfolio.heading).toHaveText(/André Kreutzer/);
    },
  );

  test(
    'no errors while using the page: scrolling, switching language and theme',
    { tag: '@smoke', annotation: req('REQ-HEALTH-02') },
    async ({ page, portfolio, baseURL }) => {
      const collector = collectPageErrors(page, baseURL ?? '');
      await portfolio.goto();

      await portfolio.scrollToBottom();
      await portfolio.switchLanguage('pt');
      await portfolio.toggleTheme();
      await portfolio.switchLanguage('en');
      await portfolio.toggleTheme();

      expect(collector.errors).toEqual([]);
    },
  );

  test(
    'search and social metadata are complete and consistent',
    { tag: '@smoke', annotation: req('REQ-HEALTH-03') },
    async ({ page, portfolio }) => {
      await portfolio.goto();
      const meta = await readMetadata(page);

      await test.step('meta description and canonical URL', () => {
        expect(meta.description?.length, 'meta description length').toBeGreaterThan(50);
        expect(meta.canonical).toBe(CANONICAL_URL);
      });

      await test.step('Open Graph matches the page', () => {
        expect(meta.og).toEqual({
          title: TITLE,
          description: expect.stringMatching(/\S{3,}/),
          url: CANONICAL_URL,
          type: 'profile',
        });
      });

      await test.step('JSON-LD is one valid Person pointing at this site', () => {
        expect(meta.jsonLd).toEqual([
          {
            ok: true,
            value: expect.objectContaining({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'André Kreutzer',
              url: CANONICAL_URL,
            }),
          },
        ]);
      });

      await test.step('every JSON-LD sameAs profile is linked on the page', async () => {
        const sameAs = sameAsUrls(meta);
        const linked = new Set((await collectLinks(page)).map((link) => link.url));

        expect(sameAs.length, 'sameAs profiles in JSON-LD').toBeGreaterThan(0);
        expect(
          sameAs.filter((url) => !linked.has(url)),
          'sameAs URLs not linked',
        ).toEqual([]);
      });
    },
  );
});
