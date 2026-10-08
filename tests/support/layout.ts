import type { Page } from '@playwright/test';

/**
 * Finds what makes the page scroll sideways. Returns an empty list when nothing does.
 *
 * Reports the document overflow itself plus up to 10 visible elements that stick out past
 * the viewport's right edge. Elements inside a container that clips or scrolls horizontally
 * (e.g. the mobile nav row, which scrolls sideways by design) are not counted.
 */
export async function findHorizontalOverflow(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const viewport = doc.clientWidth;
    const problems: string[] = [];
    if (doc.scrollWidth > viewport) {
      problems.push(
        `document is ${String(doc.scrollWidth)}px wide in a ${String(viewport)}px viewport`,
      );
    }

    const insideHorizontalClip = (el: Element): boolean => {
      for (let p = el.parentElement; p && p !== doc; p = p.parentElement) {
        if (getComputedStyle(p).overflowX !== 'visible') return true;
      }
      return false;
    };
    const label = (el: Element): string =>
      el.tagName.toLowerCase() +
      (el.id ? `#${el.id}` : '') +
      [...el.classList].map((c) => `.${c}`).join('');

    for (const el of document.body.querySelectorAll('*')) {
      if (problems.length > 10) break;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.right <= viewport + 1 || insideHorizontalClip(el)) continue;
      problems.push(`${label(el)} ends at ${String(Math.round(rect.right))}px`);
    }
    return problems;
  });
}
