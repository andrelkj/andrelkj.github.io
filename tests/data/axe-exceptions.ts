/**
 * Accessibility findings we knowingly accept. Empty means the site has zero accepted
 * violations, which is the goal.
 *
 * Rules for adding an entry (enforced by tests/support/axe.ts):
 * - scope it to a selector; a rule is never switched off for the whole page,
 * - say why, and who owns removing it,
 * - set an expiry; an expired entry fails every a11y test until it is fixed or renewed.
 */
export interface AxeException {
  /** axe rule id, e.g. 'color-contrast'. */
  readonly rule: string;
  /** CSS selector of the element(s) excluded from that rule. */
  readonly selector: string;
  readonly reason: string;
  readonly owner: string;
  /** ISO date (YYYY-MM-DD). */
  readonly expires: string;
}

export const AXE_EXCEPTIONS: readonly AxeException[] = [];
