import { expect, test } from '../fixtures/test';
import { readMetadata, sameAsUrls } from '../support/metadata';

test.describe('readMetadata / sameAsUrls', () => {
  test('reads head tags and parses JSON-LD, reporting invalid blocks', async ({ page }) => {
    await page.setContent(`<html><head>
      <meta name="description" content="d"><link rel="canonical" href="https://x.test/">
      <meta property="og:title" content="t">
      <script type="application/ld+json">{"@type":"Person","sameAs":["https://a.test",1]}</script>
      <script type="application/ld+json">{ not json</script>
    </head><body></body></html>`);

    const meta = await readMetadata(page);

    expect(meta.description).toBe('d');
    expect(meta.canonical).toBe('https://x.test/');
    expect(meta.og).toEqual({ title: 't', description: null, url: null, type: null });
    expect(meta.jsonLd.map((block) => block.ok)).toEqual([true, false]);
    expect(sameAsUrls(meta)).toEqual(['https://a.test']);
  });
});
