import type { Page } from '@playwright/test';

/**
 * Finds what makes the page scroll sideways. Returns an empty list when nothing does.
 *
 * Reports the document overflow itself plus up to 10 visible elements that stick out past
 * the viewport's right edge. Elements inside a container that clips or scrolls horizontally
 * (e.g. the mobile nav row, which scrolls sideways by design) are not counted.
 *
 * The element check matters even when the document reports no extra width: a site with
 * `body { overflow-x: hidden }` (like this one) never scrolls sideways, it silently cuts
 * content off instead, which is the same bug for a visitor.
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
      // <body>/<html> overflow is propagated to the viewport: `body { overflow-x: hidden }`
      // doesn't make content fit, it cuts it off. So clipping only counts below <body>.
      for (let p = el.parentElement; p && p !== document.body && p !== doc; p = p.parentElement) {
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
