import type { Locator } from '@playwright/test';

/**
 * Finds elements a visitor can't fully see, or that are being animated. Returns an empty list
 * when every element is fully opaque and nothing is animating it or anything inside it.
 *
 * Opacity alone isn't enough. A reveal animation that still runs can leave the computed opacity
 * at 1 before it starts and again after it ends (`forwards`), so a check that only reads opacity
 * passes while the visitor watches the content fade in. The attached animations tell the truth
 * at any moment: waiting, running, and finished-but-still-applied animations are all listed.
 *
 * Reads one snapshot and doesn't retry, on purpose: use it for "this must already be true",
 * where retrying would wait for an animation to finish and hide the defect.
 */
export async function findFadedOrAnimated(elements: Locator): Promise<string[]> {
  return elements.evaluateAll((els) => {
    const problems: string[] = [];
    els.forEach((el, index) => {
      const text = el.textContent.replace(/\s+/g, ' ').trim().slice(0, 40);
      const label = `#${String(index + 1)} "${text}"`;

      // Opacity isn't inherited as a property, but a faded ancestor fades everything inside it.
      let opacity = 1;
      for (let node: Element | null = el; node; node = node.parentElement) {
        opacity *= Number(getComputedStyle(node).opacity);
      }
      if (opacity < 1)
        problems.push(`${label} has opacity ${String(Math.round(opacity * 100) / 100)}`);

      for (const animation of el.getAnimations({ subtree: true })) {
        const name =
          animation instanceof CSSAnimation
            ? animation.animationName
            : animation instanceof CSSTransition
              ? `${animation.transitionProperty} transition`
              : 'a script';
        problems.push(`${label} is animated by ${name} (${animation.playState})`);
      }
    });
    return problems;
  });
}
