import type { Page } from '@playwright/test';

/** Translated text of one `[data-i18n]` key. The same key may appear more than once on the page. */
export type TranslationMap = ReadonlyMap<string, string>;

/** An i18n key that is meant to read the same in EN and PT, with the reason why. */
export interface SameInBothLanguages {
  readonly key: string;
  readonly reason: string;
}

/**
 * Reads every `[data-i18n]` element as key → innerHTML (whitespace collapsed).
 * innerHTML, not text, because translations carry markup such as <strong>.
 */
export async function readTranslations(page: Page): Promise<TranslationMap> {
  const entries = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-i18n]')].map(
      (el) => [el.dataset.i18n ?? '', el.innerHTML.replace(/\s+/g, ' ').trim()] as const,
    ),
  );
  return new Map(entries);
}

/**
 * Reads the `[data-i18n]` texts as authored in the HTML source, before any script runs.
 * The source is fetched and parsed with DOMParser (which never executes scripts), so this is
 * the English the author wrote, independent of what script.js does with it.
 */
export async function readAuthoredTranslations(page: Page, path = '/'): Promise<TranslationMap> {
  const entries = await page.evaluate(async (url) => {
    const source = await (await fetch(url)).text();
    const doc = new DOMParser().parseFromString(source, 'text/html');
    return [...doc.querySelectorAll<HTMLElement>('[data-i18n]')].map(
      (el) => [el.dataset.i18n ?? '', el.innerHTML.replace(/\s+/g, ' ').trim()] as const,
    );
  }, path);
  return new Map(entries);
}

/**
 * Compares the EN and PT renderings of the page and lists every problem:
 * - a key with an empty PT value,
 * - a key whose PT value is identical to EN (untranslated) and not in `sameInBoth`,
 * - a `sameInBoth` entry whose key IS translated (stale entry: remove it),
 * - a `sameInBoth` entry whose key no longer exists on the page.
 * An empty result means the translation is complete.
 */
export function findTranslationGaps(
  en: TranslationMap,
  pt: TranslationMap,
  sameInBoth: readonly SameInBothLanguages[],
): string[] {
  const allowed = new Set(sameInBoth.map((entry) => entry.key));
  const gaps: string[] = [];

  for (const [key, enValue] of en) {
    const ptValue = pt.get(key) ?? '';
    if (ptValue === '') {
      gaps.push(`${key}: PT is empty`);
    } else if (ptValue === enValue && !allowed.has(key)) {
      gaps.push(`${key}: not translated ("${enValue}")`);
    } else if (ptValue !== enValue && allowed.has(key)) {
      gaps.push(`${key}: is translated now, remove it from the same-in-both list`);
    }
  }
  for (const key of allowed) {
    if (!en.has(key)) gaps.push(`${key}: in the same-in-both list but not on the page`);
  }
  return gaps;
}

/** Text that has no translation key and is meant to stay the same in every language. */
export interface FixedText {
  /** Exact text, or a pattern for families such as commit hashes. */
  readonly match: string | RegExp;
  readonly reason: string;
}

/**
 * Lists everything a visitor can read or hear that has NO translation key: text nodes outside
 * `[data-i18n]` and the values of aria-label / alt / title attributes. Decorative content
 * (`aria-hidden="true"`) is skipped. Whitespace is collapsed; strings without letters are dropped.
 */
export async function readUnkeyedTexts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const clean = (text: string): string => text.replace(/\s+/g, ' ').trim();
    const hasLetters = (text: string): boolean => /\p{L}/u.test(text);
    const skipped = '[data-i18n], [aria-hidden="true"], script, style, noscript';
    const texts: string[] = [];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = clean(node.textContent ?? '');
      if (hasLetters(text) && !node.parentElement?.closest(skipped)) texts.push(text);
    }
    for (const el of document.body.querySelectorAll('[aria-label], [alt], [title]')) {
      if (el.closest('[aria-hidden="true"]')) continue;
      for (const attr of ['aria-label', 'alt', 'title']) {
        const value = clean(el.getAttribute(attr) ?? '');
        if (hasLetters(value)) texts.push(value);
      }
    }
    return texts;
  });
}

/**
 * Compares the unkeyed texts of the EN and PT renderings. A text present in both is
 * untranslated; it must match a `fixed` entry. Also reports fixed entries that match nothing
 * (stale). An empty result means every unkeyed text is either translated or approved.
 */
export function findUntranslatedUnkeyed(
  en: readonly string[],
  pt: readonly string[],
  fixed: readonly FixedText[],
): string[] {
  const inEnglish = new Set(en);
  const matches = (entry: FixedText, text: string): boolean =>
    typeof entry.match === 'string' ? entry.match === text : entry.match.test(text);

  const untranslated = [...new Set(pt.filter((text) => inEnglish.has(text)))];
  const problems = untranslated
    .filter((text) => !fixed.some((entry) => matches(entry, text)))
    .map((text) => `"${text}": same in EN and PT, and not on the fixed-text list`);
  for (const entry of fixed) {
    if (!untranslated.some((text) => matches(entry, text))) {
      problems.push(`${String(entry.match)}: on the fixed-text list but not on the page`);
    }
  }
  return problems;
}
