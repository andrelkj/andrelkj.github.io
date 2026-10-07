import { expect, test } from '../fixtures/test';
import { findTranslationGaps, readTranslations } from '../support/i18n';

const en = new Map([
  ['nav.about', 'About'],
  ['nav.stack', 'Stack'],
  ['about.p1', 'I have <strong>4+ years</strong>'],
]);

test.describe('findTranslationGaps', () => {
  test('a complete translation has no gaps', () => {
    const pt = new Map([
      ['nav.about', 'Sobre'],
      ['nav.stack', 'Stack'],
      ['about.p1', 'Tenho <strong>4+ anos</strong>'],
    ]);
    const sameInBoth = [{ key: 'nav.stack', reason: 'tech term' }];
    expect(findTranslationGaps(en, pt, sameInBoth)).toEqual([]);
  });

  test('reports empty, untranslated, stale and unknown entries', () => {
    const pt = new Map([
      ['nav.about', ''],
      ['nav.stack', 'Pilha'],
      ['about.p1', 'I have <strong>4+ years</strong>'],
    ]);
    const sameInBoth = [
      { key: 'nav.stack', reason: 'tech term' },
      { key: 'gone.key', reason: 'removed' },
    ];
    expect(findTranslationGaps(en, pt, sameInBoth)).toEqual([
      'nav.about: PT is empty',
      'nav.stack: is translated now, remove it from the same-in-both list',
      'about.p1: not translated ("I have <strong>4+ years</strong>")',
      'gone.key: in the same-in-both list but not on the page',
    ]);
  });
});

test.describe('readTranslations', () => {
  test('reads key → innerHTML with collapsed whitespace', async ({ page }) => {
    await page.setContent(`<p data-i18n="a">Hello
        <strong>world</strong></p><span data-i18n="b">x</span>`);
    expect(await readTranslations(page)).toEqual(
      new Map([
        ['a', 'Hello <strong>world</strong>'],
        ['b', 'x'],
      ]),
    );
  });
});
