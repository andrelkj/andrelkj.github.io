import { expect, req, test } from '../fixtures/test';
import { NAV_SECTIONS } from '../pages/portfolio.page';
import { isFullyVisibleInScroller } from '../support/nav';

test.describe('navigation', { tag: '@nav' }, () => {
  test(
    'marks the section being read as current, down the page and back up',
    { annotation: req('REQ-NAV-01') },
    async ({ portfolio }) => {
      const { topBar } = portfolio;
      await portfolio.goto();

      for (const section of [...NAV_SECTIONS, ...[...NAV_SECTIONS].reverse()]) {
        await test.step(section, async () => {
          await portfolio.scrollToSection(section);
          await expect(topBar.currentNavLink).toHaveCount(1);
          await expect(topBar.currentNavLink).toHaveAttribute('href', `#${section}`);
        });
      }
    },
  );

  test(
    'at the very bottom, the last section is current',
    { annotation: req('REQ-NAV-01') },
    async ({ portfolio }) => {
      await portfolio.goto();

      await portfolio.scrollToBottom();

      await expect(portfolio.topBar.currentNavLink).toHaveAttribute('href', '#contact');
    },
  );

  // At 320 px the PT tabs (334 px) don't fit, so the row has to scroll sideways. The EN tabs
  // do fit at 320 px, which is why this case is pinned to PT. Runs on every engine.
  test.describe('320 px phone in PT, where the tab bar scrolls sideways', () => {
    test.use({ lang: 'pt', viewport: { width: 320, height: 568 } });

    test(
      'keeps the current tab scrolled into view',
      { annotation: req('REQ-NAV-02') },
      async ({ portfolio }) => {
        const { topBar } = portfolio;
        await portfolio.goto();

        await test.step('the last tab starts out of view', async () => {
          expect(await isFullyVisibleInScroller(topBar.navLink('contact'))).toBe(false);
        });

        await test.step('reaching Contact scrolls its tab into view', async () => {
          await portfolio.scrollToBottom();
          await expect(topBar.currentNavLink).toHaveAttribute('href', '#contact');
          await expect.poll(() => isFullyVisibleInScroller(topBar.currentNavLink)).toBe(true);
        });
      },
    );
  });

  test.describe('footer', () => {
    test(
      'shows the current year (computed, not hardcoded)',
      { annotation: req('REQ-NAV-03') },
      async ({ page, portfolio }) => {
        // A year that is not in the HTML, so a hardcoded value can't pass.
        await page.clock.setFixedTime(new Date('2031-06-15T12:00:00Z'));
        await portfolio.goto();

        await expect(portfolio.footerYear).toHaveText('2031');
      },
    );
  });
});
