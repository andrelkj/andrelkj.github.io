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
