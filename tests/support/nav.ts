import type { Locator } from '@playwright/test';

/**
 * True when the element is horizontally inside its scroll container's visible box,
 * i.e. a visitor can see it without scrolling the nav row sideways.
 */
export async function isFullyVisibleInScroller(element: Locator): Promise<boolean> {
  return element.evaluate((el) => {
    const scroller = el.closest('ul') ?? el.parentElement;
    if (!scroller) return false;
    const box = el.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    return box.left >= view.left - 1 && box.right <= view.right + 1;
  });
}
