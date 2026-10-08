import type { Page, PlaywrightWorkerOptions } from '@playwright/test';

type BrowserName = PlaywrightWorkerOptions['browserName'];

/**
 * The key that moves focus to the next link or control. WebKit on macOS follows Safari's
 * default and skips links on plain Tab; Alt+Tab includes them. Everywhere else it's Tab.
 */
export function tabKey(browserName: BrowserName): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

/** What a keyboard user lands on at one Tab stop. */
export interface FocusStop {
  /** aria-label if present, otherwise the visible text (whitespace collapsed). */
  readonly name: string;
  /** True when the focused element draws an outline at least 2px wide. */
  readonly hasVisibleOutline: boolean;
  /** True when the focused element is inside <main>. */
  readonly inMain: boolean;
}

/** Presses `key` (see tabKey) `count` times from the current focus and records each stop. */
export async function collectFocusStops(
  page: Page,
  count: number,
  key: string,
): Promise<FocusStop[]> {
  const stops: FocusStop[] = [];
  for (let i = 0; i < count; i++) {
    await page.keyboard.press(key);
    stops.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body)
          return { name: '', hasVisibleOutline: false, inMain: false };
        const style = getComputedStyle(el);
        return {
          name: (el.getAttribute('aria-label') ?? el.innerText).replace(/\s+/g, ' ').trim(),
          hasVisibleOutline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
          inMain: el.closest('main') !== null,
        };
      }),
    );
  }
  return stops;
}
