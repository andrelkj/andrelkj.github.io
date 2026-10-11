import { expect, test } from '../fixtures/test';
import { findFadedOrAnimated } from '../support/motion';

const page = (body: string, css = ''): string =>
  `<!doctype html><html><head><style>
    @keyframes reveal { from { opacity: 0; } to { opacity: 1; } }
    @keyframes blink { 50% { opacity: 0; } }
    ${css}</style></head><body>${body}</body></html>`;

const LINES = '<p>one</p><p>two</p>';

test.describe('findFadedOrAnimated', () => {
  test('returns nothing for still, fully opaque elements', async ({ page: p }) => {
    await p.setContent(page(LINES));
    expect(await findFadedOrAnimated(p.locator('p'))).toEqual([]);
  });

  test('names an element left invisible', async ({ page: p }) => {
    await p.setContent(page('<p>one</p><p style="opacity:0">two</p>'));
    expect(await findFadedOrAnimated(p.locator('p'))).toEqual(['#2 "two" has opacity 0']);
  });

  test('counts a faded ancestor', async ({ page: p }) => {
    await p.setContent(page(`<div style="opacity:0.5">${LINES}</div>`));
    expect(await findFadedOrAnimated(p.locator('p'))).toEqual([
      '#1 "one" has opacity 0.5',
      '#2 "two" has opacity 0.5',
    ]);
  });

  // The cases an opacity-only check gets wrong: the element reads as opacity 1.
  test('reports a reveal that has not started yet, although opacity reads 1', async ({
    page: p,
  }) => {
    await p.setContent(page(LINES, 'p { animation: reveal 1s 60s forwards; }'));
    expect(await findFadedOrAnimated(p.locator('p'))).toEqual([
      '#1 "one" is animated by reveal (running)',
      '#2 "two" is animated by reveal (running)',
    ]);
  });

  test('reports a reveal that already finished, although opacity reads 1', async ({ page: p }) => {
    await p.setContent(page(LINES, 'p { opacity: 0; animation: reveal 1ms forwards; }'));
    await p.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
    expect(await findFadedOrAnimated(p.locator('p'))).toEqual([
      '#1 "one" is animated by reveal (finished)',
      '#2 "two" is animated by reveal (finished)',
    ]);
  });

  test('reports an animation on something inside the element', async ({ page: p }) => {
    await p.setContent(
      page('<p>$ <span style="animation: blink 1s steps(1) infinite"></span></p>'),
    );
    expect(await findFadedOrAnimated(p.locator('p'))).toEqual([
      '#1 "$" is animated by blink (running)',
    ]);
  });

  test('reports a transition in progress', async ({ page: p }) => {
    await p.setContent(page('<p>one</p>', 'p { transition: opacity 60s linear; }'));
    await p.locator('p').evaluate((el) => {
      // Reading the layout commits the starting value, so the change below is a transition.
      el.getBoundingClientRect();
      el.style.opacity = '0';
    });
    const problems = await findFadedOrAnimated(p.locator('p'));
    expect(problems).toContain('#1 "one" is animated by opacity transition (running)');
  });
});
