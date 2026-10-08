import AxeBuilder from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';
import { AXE_EXCEPTIONS, type AxeException } from '../data/axe-exceptions';

/** One axe violation (derived from AxeBuilder so we don't import the transitive axe-core). */
type Result = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

/** WCAG 2.2 AA (which includes 2.0 and 2.1 A/AA) plus axe best practices. */
export const AXE_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice',
] as const;

export interface AxeScanOptions {
  /** Limit the scan to these rule ids (e.g. ['color-contrast']). Default: all rules for AXE_TAGS. */
  readonly rules?: readonly string[];
  /** Accepted findings. Defaults to AXE_EXCEPTIONS; injectable so self-tests stay isolated. */
  readonly exceptions?: readonly AxeException[];
  /** Reference date for expiry checks. Injectable for self-tests. */
  readonly today?: Date;
}

/** Throws if any exception has expired, so accepted debt cannot be forgotten. */
export function assertExceptionsNotExpired(
  exceptions: readonly AxeException[],
  today: Date = new Date(),
): void {
  const expired = exceptions.filter((e) => new Date(`${e.expires}T23:59:59Z`) < today);
  if (expired.length > 0) {
    const list = expired.map((e) => `${e.rule} on "${e.selector}" (expired ${e.expires})`);
    throw new Error(`Expired axe exceptions, fix or renew them:\n- ${list.join('\n- ')}`);
  }
}

/**
 * Turns axe results into one line per violation, e.g.
 * `color-contrast [serious] Elements must meet minimum color contrast ratio thresholds → .hero p.lede`.
 * Short and stable, so a failing assertion diff is readable without opening the report.
 */
export function summarizeViolations(violations: readonly Result[]): string[] {
  return violations.map((v) => {
    const targets = v.nodes.map((n) => n.target.join(' ')).slice(0, 5);
    const more = v.nodes.length > targets.length ? ` (+${String(v.nodes.length - 5)} more)` : '';
    return `${v.id} [${v.impact ?? 'unknown'}] ${v.help} → ${targets.join(', ')}${more}`;
  });
}

/**
 * Runs axe on the current page state and returns the violation summary.
 * The full axe JSON is attached to the test report for every scan.
 */
export async function scanA11y(
  page: Page,
  testInfo: TestInfo,
  options: AxeScanOptions = {},
): Promise<string[]> {
  const exceptions = options.exceptions ?? AXE_EXCEPTIONS;
  assertExceptionsNotExpired(exceptions, options.today);

  let builder = new AxeBuilder({ page }).withTags([...AXE_TAGS]);
  if (options.rules) builder = builder.withRules([...options.rules]);

  const results = await builder.analyze();
  await testInfo.attach('axe-results.json', {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });
  const remaining = await removeExceptedNodes(page, results.violations, exceptions);
  return summarizeViolations(remaining);
}

/**
 * Drops violation nodes covered by an exception: same rule id AND the element matches the
 * exception's selector. AxeBuilder.exclude() is not used because it hides the element from
 * every rule, which would silently widen an exception.
 */
async function removeExceptedNodes(
  page: Page,
  violations: readonly Result[],
  exceptions: readonly AxeException[],
): Promise<Result[]> {
  const remaining: Result[] = [];
  for (const violation of violations) {
    const selectors = exceptions.filter((e) => e.rule === violation.id).map((e) => e.selector);
    const nodes = [];
    for (const node of violation.nodes) {
      const target = node.target.join(' ');
      const excepted =
        selectors.length > 0 &&
        (await page.evaluate(
          ([t, list]) => list.some((s) => document.querySelector(t)?.matches(s) === true),
          [target, selectors] as const,
        ));
      if (!excepted) nodes.push(node);
    }
    if (nodes.length > 0) remaining.push({ ...violation, nodes });
  }
  return remaining;
}
