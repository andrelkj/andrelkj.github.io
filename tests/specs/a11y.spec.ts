import { expect, req, test } from '../fixtures/test';
import { scanA11y } from '../support/axe';
import { collectFocusStops, tabKey } from '../support/keyboard';
import { THEME_LANG_MATRIX } from '../support/types';

test.describe('accessibility', { tag: '@a11y' }, () => {
  for (const { theme, lang } of THEME_LANG_MATRIX) {
    test.describe(`${theme} theme, ${lang.toUpperCase()}`, () => {
      test.use({ theme, lang });

      test(
        'axe finds no WCAG 2.2 AA or best-practice violations',
        { annotation: req('REQ-A11Y-01') },
        async ({ page, portfolio }, testInfo) => {
          await portfolio.goto();

          expect(await scanA11y(page, testInfo)).toEqual([]);
        },
      );
    });
  }

  test(
    'the skip link is the first stop and jumps past the header',
    { annotation: req('REQ-A11Y-02') },
    async ({ page, portfolio, browserName }) => {
      const key = tabKey(browserName);
      await portfolio.goto();

      await test.step('first Tab lands on the skip link, which becomes visible', async () => {
        await page.keyboard.press(key);
        await expect(portfolio.skipLink).toBeFocused();
        await expect(portfolio.skipLink).toBeInViewport();
      });

      await test.step('activating it moves the keyboard into the main content', async () => {
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/#main$/);
        const [next] = await collectFocusStops(page, 1, key);
        expect(next?.inMain, `next stop "${next?.name ?? ''}" should be inside <main>`).toBe(true);
      });
    },
  );

  test(
    'header controls are reachable in order and show a focus outline',
    { annotation: req('REQ-A11Y-03') },
    async ({ page, portfolio, browserName }) => {
      await portfolio.goto();

      const stops = await collectFocusStops(page, 10, tabKey(browserName));

      expect(stops.map((stop) => stop.name)).toEqual([
        'Skip to content',
        expect.stringMatching(/^>_ andre/),
        'About',
        'Experience',
        'Work',
        'Stack',
        'Contact',
        'EN',
        'PT',
        'Switch to light theme',
      ]);
      const withoutOutline = stops.filter((stop) => !stop.hasVisibleOutline).map((s) => s.name);
      expect(withoutOutline, 'stops without a visible focus outline').toEqual([]);
    },
  );
});
