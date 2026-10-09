import { EXTERNAL_LINKS, RESUME_FILE } from '../data/links';
import { expect, req, test } from '../fixtures/test';
import { NAV_SECTIONS } from '../pages/portfolio.page';
import {
  collectIcons,
  collectLinks,
  findBrokenAnchors,
  findUnsafeLinks,
  svgRootName,
} from '../support/links';
import { readMetadata } from '../support/metadata';

/** Hosts of external links. Requests to them are stubbed so tests never depend on third parties. */
const STUBBED_HOSTS = /^https:\/\/(www\.linkedin\.com|github\.com)\//;

test.describe('links and assets', { tag: '@links' }, () => {
  test(
    'every in-page link points at an existing element',
    { annotation: req('REQ-LINK-01') },
    async ({ page, portfolio }) => {
      await portfolio.goto();

      expect(await findBrokenAnchors(page)).toEqual([]);
    },
  );

  for (const section of NAV_SECTIONS) {
    test(
      `nav link "#${section}" brings the section into view and marks itself current`,
      { annotation: req('REQ-LINK-01') },
      async ({ page, portfolio }) => {
        await portfolio.goto();

        await portfolio.topBar.navLink(section).click();

        await expect(page).toHaveURL(new RegExp(`#${section}$`));
        await expect(portfolio.section(section)).toBeInViewport();
        await expect(portfolio.topBar.navLink(section)).toHaveAttribute('aria-current', 'true');
      },
    );
  }

  test(
    'external links are the expected ones and are safe',
    { annotation: req('REQ-LINK-02') },
    async ({ page, portfolio }) => {
      await portfolio.goto();
      const links = await collectLinks(page);

      expect(links.filter((link) => link.kind === 'external').map((link) => link.url)).toEqual(
        EXTERNAL_LINKS,
      );
      expect(
        links.filter((link) => link.kind === 'external' && link.target !== '_blank'),
        'external links that do not open in a new tab',
      ).toEqual([]);
      expect(findUnsafeLinks(links)).toEqual([]);
    },
  );

  test(
    'clicking an external link opens its destination in a new tab',
    { annotation: req('REQ-LINK-02') },
    async ({ context, page, portfolio }) => {
      await context.route(STUBBED_HOSTS, (route) =>
        route.fulfill({ contentType: 'text/html', body: '<title>stub</title>' }),
      );
      await portfolio.goto();

      for (const url of new Set(EXTERNAL_LINKS)) {
        await test.step(url, async () => {
          const links = portfolio.linksTo(url);
          // Count first: a loop over zero links would pass without clicking anything.
          await expect(links).toHaveCount(
            EXTERNAL_LINKS.filter((expected) => expected === url).length,
          );
          for (const link of await links.all()) {
            const popupOpened = page.waitForEvent('popup');
            await link.click();
            const popup = await popupOpened;
            await expect(popup).toHaveURL(url);
            await popup.close();
          }
        });
      }
    },
  );

  test(
    'every resume link downloads the real PDF',
    { annotation: req('REQ-LINK-03') },
    async ({ page, portfolio, request }) => {
      await portfolio.goto();
      const resumeLinks = (await collectLinks(page)).filter((link) => link.url.endsWith('.pdf'));
      expect(resumeLinks, 'resume links on the page').toHaveLength(2);

      for (const link of resumeLinks) {
        await test.step(`${link.text}: ${link.href}`, async () => {
          expect(link.download, 'has the download attribute').toBe(true);
          const response = await request.get(link.url);
          expect(response.status()).toBe(200);
          expect(response.headers()['content-type']).toMatch(/^application\/pdf/);
          expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
        });
      }

      await test.step('clicking each one saves the file under its own name', async () => {
        const links = portfolio.linksTo(resumeLinks[0]?.href ?? '');
        await expect(links, 'every resume link shares one href').toHaveCount(resumeLinks.length);
        for (const link of await links.all()) {
          const downloadStarted = page.waitForEvent('download');
          await link.click();
          expect((await downloadStarted).suggestedFilename()).toBe(RESUME_FILE);
        }
      });
    },
  );

  test(
    'every declared icon loads with its declared type',
    { annotation: req('REQ-LINK-04') },
    async ({ page, portfolio, request }) => {
      await portfolio.goto();
      const icons = await collectIcons(page);
      expect(icons.length, 'icons declared in <head>').toBeGreaterThan(0);

      for (const icon of icons) {
        await test.step(`${icon.url} loads`, async () => {
          const response = await request.get(icon.url);
          expect(response.status()).toBe(200);
          expect(response.headers()['content-type']).toContain(icon.type ?? 'image/');
        });
      }
      for (const icon of icons.filter((i) => i.type === 'image/svg+xml')) {
        await test.step(`${icon.url} is a valid SVG document`, async () => {
          const svg = await (await request.get(icon.url)).text();
          expect(await svgRootName(page, svg)).toBe('svg');
        });
      }
    },
  );

  test(
    'the contact email matches the structured data',
    { annotation: req('REQ-LINK-05') },
    async ({ page, portfolio }) => {
      await portfolio.goto();
      const mailto = (await collectLinks(page)).filter((link) => link.kind === 'mailto');
      const [person] = (await readMetadata(page)).jsonLd;

      expect(mailto.map((link) => link.href)).toEqual([
        expect.stringMatching(/^mailto:[^@\s]+@[^@\s]+$/),
      ]);
      expect(person).toMatchObject({ ok: true, value: { email: mailto[0]?.href } });
    },
  );
});
