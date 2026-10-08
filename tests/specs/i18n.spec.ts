import { COPY, UI_NAMES } from '../data/copy';
import { FIXED_TEXT } from '../data/i18n-fixed-text';
import { SAME_IN_BOTH } from '../data/i18n-same-in-both';
import { expect, req, test } from '../fixtures/test';
import {
  findTranslationGaps,
  findUntranslatedUnkeyed,
  readAuthoredTranslations,
  readTranslations,
  readUnkeyedTexts,
} from '../support/i18n';
import { HTML_LANG, LANGS } from '../support/types';

test.describe('languages', { tag: '@i18n' }, () => {
  test.describe('switching', () => {
    test.use({ lang: 'en' });

    test(
      'every text has a PT translation',
      { annotation: req('REQ-I18N-01') },
      async ({ page, portfolio }) => {
        await portfolio.goto();
        const en = await readTranslations(page);

        await portfolio.switchLanguage('pt');
        const pt = await readTranslations(page);

        expect(findTranslationGaps(en, pt, SAME_IN_BOTH)).toEqual([]);
      },
    );

    test(
      'text without a translation key is only names, tools and code',
      { annotation: req('REQ-I18N-07') },
      async ({ page, portfolio }) => {
        await portfolio.goto();
        const en = await readUnkeyedTexts(page);

        await portfolio.switchLanguage('pt');
        const pt = await readUnkeyedTexts(page);

        expect(findUntranslatedUnkeyed(en, pt, FIXED_TEXT)).toEqual([]);
      },
    );

    test(
      'updates html[lang], the pressed button and localized labels',
      { annotation: req('REQ-I18N-02') },
      async ({ portfolio }) => {
        const { topBar } = portfolio;
        await portfolio.goto();

        const switches = [
          { lang: 'pt', other: 'en' },
          { lang: 'en', other: 'pt' },
        ] as const;
        for (const { lang, other } of switches) {
          await test.step(`switch to ${lang.toUpperCase()}`, async () => {
            await portfolio.switchLanguage(lang);
            await expect(portfolio.html).toHaveAttribute('lang', HTML_LANG[lang]);
            await expect(topBar.languageButton(lang)).toHaveAttribute('aria-pressed', 'true');
            await expect(topBar.languageButton(other)).toHaveAttribute('aria-pressed', 'false');
            await expect(topBar.languageSwitch).toHaveAccessibleName(UI_NAMES[lang].languageGroup);
            await expect(topBar.themeToggle).toHaveAccessibleName(UI_NAMES[lang].themeToggleInDark);
          });
        }
      },
    );

    test(
      'English shows exactly the text authored in index.html, before and after PT',
      { annotation: req('REQ-I18N-03') },
      async ({ page, portfolio }) => {
        await portfolio.goto();
        // Compare against the source, not the first render: script.js re-renders EN on load,
        // so a bug there would already be in the first render.
        const authored = await readAuthoredTranslations(page);

        await test.step('initial English render', async () => {
          expect(await readTranslations(page)).toEqual(authored);
        });

        await test.step('after switching PT → EN', async () => {
          await portfolio.switchLanguage('pt');
          await portfolio.switchLanguage('en');
          expect(await readTranslations(page)).toEqual(authored);
        });
      },
    );

    test(
      'the chosen language survives a reload',
      { annotation: req('REQ-I18N-04') },
      async ({ page, portfolio }) => {
        await portfolio.goto();
        await portfolio.switchLanguage('pt');

        await page.reload();

        await expect(portfolio.html).toHaveAttribute('lang', 'pt-BR');
        await expect(portfolio.sectionHeadings).toHaveText(COPY.pt.sectionHeadings);
      },
    );
  });

  test.describe('first visit picks the language from the browser', () => {
    const cases = [
      { locale: 'pt-BR', expected: 'pt' },
      { locale: 'pt-PT', expected: 'pt' },
      { locale: 'en-US', expected: 'en' },
      { locale: 'es-ES', expected: 'en' },
    ] as const;

    for (const { locale, expected } of cases) {
      test.describe(`${locale} → ${expected}`, () => {
        test.use({ locale, lang: null });

        test(
          'opens in the expected language',
          { annotation: req('REQ-I18N-05') },
          async ({ portfolio }) => {
            await portfolio.goto();

            await expect(portfolio.html).toHaveAttribute('lang', HTML_LANG[expected]);
          },
        );
      });
    }
  });

  for (const lang of LANGS) {
    test.describe(`copy in ${lang}`, () => {
      test.use({ lang });

      test(
        'nav links and section headings read exactly as expected',
        { annotation: req('REQ-I18N-06') },
        async ({ portfolio }) => {
          await portfolio.goto();

          await expect(portfolio.topBar.navLinks).toHaveText(COPY[lang].navLinks);
          await expect(portfolio.sectionHeadings).toHaveText(COPY[lang].sectionHeadings);
        },
      );
    });
  }
});
