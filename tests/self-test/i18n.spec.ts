import { expect, test } from '../fixtures/test';
import {
  findTranslationGaps,
  findUntranslatedUnkeyed,
  readAuthoredTranslations,
  readTranslations,
  readUnkeyedTexts,
} from '../support/i18n';

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

test.describe('readAuthoredTranslations', () => {
  test('reads the source HTML, ignoring changes made by scripts', async ({ page }) => {
    const source = `<p data-i18n="a">Hi <strong>there</strong></p>
      <script>document.querySelector('[data-i18n=a]').textContent = 'changed';</script>`;
    await page.route('**/authored-fixture.html', (route) =>
      route.fulfill({ body: source, contentType: 'text/html' }),
    );
    await page.goto('/authored-fixture.html');
    expect(await readTranslations(page)).toEqual(new Map([['a', 'changed']]));

    expect(await readAuthoredTranslations(page, '/authored-fixture.html')).toEqual(
      new Map([['a', 'Hi <strong>there</strong>']]),
    );
  });
});

test.describe('readUnkeyedTexts', () => {
  test('reads text and labels outside [data-i18n], skipping decorative content', async ({
    page,
  }) => {
    await page.setContent(`
      <p data-i18n="k">Keyed <strong>text</strong></p>
      <p class="eyebrow">// about</p>
      <span aria-hidden="true">decorative</span>
      <nav aria-label="Primary"><img alt="Logo" src="data:,"></nav>
      <p>123 · 456</p>`);

    expect(await readUnkeyedTexts(page)).toEqual(['// about', 'Primary', 'Logo']);
  });
});

test.describe('findUntranslatedUnkeyed', () => {
  const fixed = [
    { match: 'GitHub', reason: 'name' },
    { match: /^[0-9a-f]{7}$/, reason: 'hash' },
  ];

  test('accepts translated text and approved fixed text', () => {
    const en = ['// about', 'GitHub', 'a3f9c1e'];
    const pt = ['// sobre', 'GitHub', 'a3f9c1e'];
    expect(findUntranslatedUnkeyed(en, pt, fixed)).toEqual([]);
  });

  test('reports untranslated text once, and fixed entries that match nothing', () => {
    const en = ['// about', 'Tech', 'Tech', 'GitHub'];
    const pt = ['// about', 'Tech', 'Tech', 'GitHub'];
    expect(findUntranslatedUnkeyed(en, pt, fixed)).toEqual([
      '"// about": same in EN and PT, and not on the fixed-text list',
      '"Tech": same in EN and PT, and not on the fixed-text list',
      '/^[0-9a-f]{7}$/: on the fixed-text list but not on the page',
    ]);
  });
});
