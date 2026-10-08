import { expect, test } from '../fixtures/test';
import { findHorizontalOverflow } from '../support/layout';

const page = (body: string): string =>
  `<!doctype html><html><head><style>body{margin:0}</style></head><body>${body}</body></html>`;

test.describe('findHorizontalOverflow', () => {
  test.use({ viewport: { width: 375, height: 700 } });

  test('returns nothing when content fits', async ({ page: p }) => {
    await p.setContent(page('<div style="width:100%">fits</div>'));
    expect(await findHorizontalOverflow(p)).toEqual([]);
  });

  test('names the element that overflows', async ({ page: p }) => {
    await p.setContent(page('<div id="wide" class="banner" style="width:600px">too wide</div>'));
    const problems = await findHorizontalOverflow(p);
    expect(problems[0]).toBe('document is 600px wide in a 375px viewport');
    expect(problems).toContain('div#wide.banner ends at 600px');
  });

  test('still finds content cut off by body { overflow-x: hidden }', async ({ page: p }) => {
    await p.setContent(
      page('<style>body{overflow-x:hidden}</style><div id="wide" style="width:600px">cut</div>'),
    );
    expect(await findHorizontalOverflow(p)).toContain('div#wide ends at 600px');
  });

  test('ignores content inside a horizontal scroller', async ({ page: p }) => {
    await p.setContent(
      page('<ul style="overflow-x:auto;display:flex"><li style="min-width:600px">tab</li></ul>'),
    );
    expect(await findHorizontalOverflow(p)).toEqual([]);
  });
});
