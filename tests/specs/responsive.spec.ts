import { expect, req, test } from '../fixtures/test';
import { COMPACT_MAX_WIDTH, NAV_SECTIONS } from '../pages/portfolio.page';
import { findHorizontalOverflow } from '../support/layout';
import { LANGS } from '../support/types';

const MIN_TAP_TARGET_PX = 44;

/** True on projects narrower than or equal to the tab-bar breakpoint (mobile, tablet). */
const isCompact = (width: number | undefined): boolean => (width ?? 0) <= COMPACT_MAX_WIDTH;

test.describe('responsive layout', { tag: '@responsive' }, () => {
  for (const lang of LANGS) {
    test.describe(`in ${lang}`, () => {
      test.use({ lang });

      test(
        'nothing sticks out past the right edge',
        { annotation: req('REQ-RESP-01') },
        async ({ page, portfolio }) => {
          await portfolio.goto();

          expect(await findHorizontalOverflow(page)).toEqual([]);
        },
      );

      test(
        'every nav link is fully visible without scrolling the nav',
        { annotation: req('REQ-RESP-04') },
        async ({ portfolio }) => {
          await portfolio.goto();

          // Count first: a loop over zero links would pass without checking anything.
          await expect(portfolio.topBar.navLinks).toHaveCount(NAV_SECTIONS.length);
          for (const link of await portfolio.topBar.navLinks.all()) {
            await expect(link).toBeInViewport({ ratio: 1 });
          }
        },
      );
    });
  }

  test.describe('compact header (≤ 820 px)', () => {
    test.skip(({ viewport }) => !isCompact(viewport?.width), 'tab bar exists only at ≤ 820 px');

    test(
      `every nav tab is at least ${String(MIN_TAP_TARGET_PX)} px tall`,
      { annotation: req('REQ-RESP-02') },
      async ({ portfolio }) => {
        await portfolio.goto();

        const heights = await portfolio.topBar.navLinks.evaluateAll((links) =>
          links.map((link) => Math.round(link.getBoundingClientRect().height)),
        );
        expect(heights).toHaveLength(5);
        for (const height of heights) {
          expect(height).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX);
        }
      },
    );

    test(
      'the header hides while scrolling down and returns when scrolling up',
      { annotation: req('REQ-RESP-03') },
      async ({ portfolio }) => {
        const header = portfolio.topBar.root;
        await portfolio.goto();

        await portfolio.scrollTo(1200);
        await expect(header).not.toBeInViewport();

        await portfolio.scrollTo(800);
        await expect(header).toBeInViewport();
      },
    );

    test.describe('with reduced motion', () => {
      test.use({ reducedMotion: 'reduce' });

      test('the header never hides', { annotation: req('REQ-RESP-03') }, async ({ portfolio }) => {
        await portfolio.goto();

        await portfolio.scrollTo(1200);
        await expect(portfolio.topBar.root).toBeInViewport();
      });
    });
  });

  test.describe('desktop header (> 820 px)', () => {
    test.skip(({ viewport }) => isCompact(viewport?.width), 'desktop header only above 820 px');

    test(
      'the header stays visible while scrolling down',
      { annotation: req('REQ-RESP-03') },
      async ({ portfolio }) => {
        await portfolio.goto();

        await portfolio.scrollTo(1200);
        await expect(portfolio.topBar.root).toBeInViewport();
      },
    );
  });
});
