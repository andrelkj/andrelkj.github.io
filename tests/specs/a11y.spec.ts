import { expect, req, test } from '../fixtures/test';
import { HERO_TERMINAL_LINES } from '../pages/portfolio.page';
import { scanA11y } from '../support/axe';
import { collectFocusStops, tabKey } from '../support/keyboard';
import { findFadedOrAnimated } from '../support/motion';
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

  test(
    'the header stays in view while keyboard focus is on one of its controls',
    { annotation: req('REQ-A11Y-04') },
    async ({ page, portfolio, browserName }) => {
      const { topBar } = portfolio;
      const focused = topBar.navLink('about');
      await portfolio.goto();

      await test.step('Tab to a nav link (skip link, brand, About)', async () => {
        await collectFocusStops(page, 3, tabKey(browserName));
        await expect(focused).toBeFocused();
      });

      await test.step('scroll down far enough for the header to hide', async () => {
        await portfolio.scrollToSection('experience');
        // The site handles a scroll one frame later, marking the section and deciding about the
        // header in the same step. Once the section is marked, that decision has been made.
        await expect(topBar.navLink('experience')).toHaveAttribute('aria-current', 'true');
        await topBar.waitForSlideToEnd();
      });

      await expect(focused).toBeFocused();
      await expect(topBar.root).toBeInViewport();
      await expect(focused).toBeInViewport();
    },
  );

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test(
      'every line of the hero terminal is there at once and nothing in it animates',
      { annotation: req('REQ-A11Y-05') },
      async ({ portfolio }) => {
        // Look at the page as it first appears. Waiting for the intro (~2.8 s) would wait out a
        // line-by-line reveal that must not run at all.
        await portfolio.goto({ waitForIntro: false });

        // Count first: zero lines would pass without checking anything.
        await expect(portfolio.heroTerminalLines).toHaveCount(HERO_TERMINAL_LINES);
        expect(await findFadedOrAnimated(portfolio.heroTerminalLines)).toEqual([]);
      },
    );
  });
});
