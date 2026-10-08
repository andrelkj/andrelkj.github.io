import { expect, test } from '../fixtures/test';
import { collectLinks, findBrokenAnchors, findUnsafeLinks, svgRootName } from '../support/links';

const LINKS_PAGE = `
  <section id="about">About</section>
  <a href="#about">ok anchor</a>
  <a href="#missing">broken anchor</a>
  <a href="assets/cv.pdf" download>cv</a>
  <a href="mailto:me@example.com">mail</a>
  <a href="https://example.com" target="_blank" rel="noopener">safe</a>
  <a href="https://example.org" target="_blank">unsafe</a>
  <a href="http://example.net">insecure</a>`;

test.describe('link helpers', () => {
  // The links must resolve against the real origin so "asset" vs "external" is meaningful.
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setContent(LINKS_PAGE);
  });

  test('collectLinks classifies each link', async ({ page }) => {
    const links = await collectLinks(page);
    expect(links.map((l) => [l.href, l.kind])).toEqual([
      ['#about', 'anchor'],
      ['#missing', 'anchor'],
      ['assets/cv.pdf', 'asset'],
      ['mailto:me@example.com', 'mailto'],
      ['https://example.com', 'external'],
      ['https://example.org', 'external'],
      ['http://example.net', 'external'],
    ]);
    expect(links.find((l) => l.href === 'assets/cv.pdf')?.download).toBe(true);
  });

  test('findUnsafeLinks flags missing noopener and plain http', async ({ page }) => {
    expect(findUnsafeLinks(await collectLinks(page))).toEqual([
      'https://example.org: target="_blank" without rel="noopener"',
      'http://example.net: external link is not https',
    ]);
  });

  test('findBrokenAnchors flags ids that do not exist', async ({ page }) => {
    expect(await findBrokenAnchors(page)).toEqual(['#missing: no element with this id']);
  });
});

test.describe('svgRootName', () => {
  test('accepts a valid SVG and rejects broken or non-SVG text', async ({ page }) => {
    expect(await svgRootName(page, '<svg xmlns="http://www.w3.org/2000/svg"></svg>')).toBe('svg');
    expect(await svgRootName(page, '<svg xmlns="http://www.w3.org/2000/svg">')).toBe('parsererror');
    expect(await svgRootName(page, '<html><body>404</body></html>')).toBe('html');
  });
});
