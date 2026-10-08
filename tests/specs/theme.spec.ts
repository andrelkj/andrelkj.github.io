import { expect, req, test } from '../fixtures/test';
import { scanA11y } from '../support/axe';
import { THEMES } from '../support/types';

const TOGGLE_NAME = {
  en: { toLight: 'Switch to light theme', toDark: 'Switch to dark theme' },
  pt: { toLight: 'Mudar para tema claro', toDark: 'Mudar para tema escuro' },
} as const;

test.describe('theme', { tag: '@theme' }, () => {
  test.describe('first visit', () => {
    test.use({ colorScheme: 'light' });

    test(
      'is dark even when the OS prefers light',
      { annotation: req('REQ-THEME-01') },
      async ({ portfolio }) => {
        await portfolio.goto();

        await expect(portfolio.html).toHaveAttribute('data-theme', 'dark');
        await expect(portfolio.topBar.themeIcon('sun')).toBeVisible();
      },
    );
  });

  for (const lang of ['en', 'pt'] as const) {
    test.describe(`toggle (${lang.toUpperCase()})`, () => {
      test.use({ lang });

      test(
        'switches dark ↔ light with the right icon and label',
        { annotation: req('REQ-THEME-02') },
        async ({ portfolio }) => {
          const { topBar } = portfolio;
          await portfolio.goto();

          await test.step('dark: sun icon, offers light', async () => {
            await expect(portfolio.html).toHaveAttribute('data-theme', 'dark');
            await expect(topBar.themeToggle).toHaveAccessibleName(TOGGLE_NAME[lang].toLight);
            await expect(topBar.themeIcon('sun')).toBeVisible();
            await expect(topBar.themeIcon('moon')).toBeHidden();
          });

          await test.step('toggle → light: moon icon, offers dark', async () => {
            await portfolio.toggleTheme();
            await expect(portfolio.html).toHaveAttribute('data-theme', 'light');
            await expect(topBar.themeToggle).toHaveAccessibleName(TOGGLE_NAME[lang].toDark);
            await expect(topBar.themeIcon('moon')).toBeVisible();
            await expect(topBar.themeIcon('sun')).toBeHidden();
          });

          await test.step('toggle → dark again', async () => {
            await portfolio.toggleTheme();
            await expect(portfolio.html).toHaveAttribute('data-theme', 'dark');
            await expect(topBar.themeToggle).toHaveAccessibleName(TOGGLE_NAME[lang].toLight);
          });
        },
      );
    });
  }

  test(
    'the chosen theme survives a reload and is applied before the page renders',
    { annotation: req('REQ-THEME-03') },
    async ({ page, portfolio }) => {
      // Records the theme at the moment <body> is created, i.e. before anything is painted.
      await page.addInitScript(() => {
        new MutationObserver((_, observer) => {
          if (document.querySelector('body') === null) return;
          document.documentElement.dataset.themeAtFirstPaint =
            document.documentElement.dataset.theme ?? '';
          observer.disconnect();
        }).observe(document, { childList: true, subtree: true });
      });
      await portfolio.goto();
      await portfolio.toggleTheme();

      await page.reload();
      await portfolio.waitForIntroAnimations();

      await expect(portfolio.html).toHaveAttribute('data-theme', 'light');
      await expect(portfolio.html).toHaveAttribute('data-theme-at-first-paint', 'light');
    },
  );

  for (const theme of THEMES) {
    test.describe(`${theme} theme`, () => {
      test.use({ theme });

      test(
        'text meets WCAG AA color contrast',
        { annotation: req('REQ-THEME-04') },
        async ({ page, portfolio }, testInfo) => {
          await portfolio.goto();

          expect(await scanA11y(page, testInfo, { rules: ['color-contrast'] })).toEqual([]);
        },
      );
    });
  }
});
