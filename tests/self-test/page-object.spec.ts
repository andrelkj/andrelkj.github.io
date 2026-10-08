import { expect, test } from '../fixtures/test';
import { NAV_SECTIONS, SECTIONS } from '../pages/portfolio.page';
import { LANGS } from '../support/types';

/**
 * Locator contract: every locator in the page object must match exactly one element, in
 * every language. When the site's markup changes, this fails first and names the locator,
 * which is the starting point for the pw-heal skill.
 */
for (const lang of LANGS) {
  test.describe(`page object locators (${lang})`, () => {
    test.use({ lang });

    test('each locator resolves to exactly one element', async ({ portfolio }) => {
      await portfolio.goto();
      const { topBar } = portfolio;

      const locators = {
        'topBar.root': topBar.root,
        'topBar.nav': topBar.nav,
        'topBar.languageSwitch': topBar.languageSwitch,
        'topBar.themeToggle': topBar.themeToggle,
        'topBar.themeIcon(sun)': topBar.themeIcon('sun'),
        'topBar.themeIcon(moon)': topBar.themeIcon('moon'),
        'topBar.languageButton(en)': topBar.languageButton('en'),
        'topBar.languageButton(pt)': topBar.languageButton('pt'),
        html: portfolio.html,
        main: portfolio.main,
        heading: portfolio.heading,
        skipLink: portfolio.skipLink,
        footer: portfolio.footer,
        footerYear: portfolio.footerYear,
        ...Object.fromEntries(NAV_SECTIONS.map((s) => [`navLink(${s})`, topBar.navLink(s)])),
        ...Object.fromEntries(SECTIONS.map((s) => [`section(${s})`, portfolio.section(s)])),
      };

      for (const [name, locator] of Object.entries(locators)) {
        await expect.soft(locator, `${name} should match one element`).toHaveCount(1);
      }
    });
  });
}
