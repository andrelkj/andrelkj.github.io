/**
 * Mutation testing logic: reading Playwright's JSON report, scoring mutants and rendering
 * docs/TRUST.md. Pure functions, unit-tested in tests/self-test/mutation.spec.ts.
 */

export interface FailedTest {
  /** "file › describe › test [project]" */
  readonly title: string;
  readonly reqIds: readonly string[];
}

export interface RunSummary {
  /** Tests that failed. */
  readonly failed: readonly FailedTest[];
  /** Tests that ran (passed + failed + flaky). Zero means nothing was actually tested. */
  readonly ran: number;
  /** Errors outside tests (config, web server…): the run can't be trusted either way. */
  readonly errors: readonly string[];
}

export type MutantStatus =
  | 'caught' // a test proving one of the expected requirements failed
  | 'caught-elsewhere' // only tests for other requirements failed: the catalog's claim is wrong
  | 'survived' // nothing failed: a gap in the suite
  | 'error' // the run itself broke (no tests ran, server error…)
  | 'not-applicable' // the mutant's target text is gone from the site
  | 'skipped'; // needs another platform (visual baselines are Linux-only)

export interface MutantResult {
  readonly id: string;
  readonly description: string;
  readonly area: string;
  readonly expectedReqs: readonly string[];
  readonly status: MutantStatus;
  /** Failing tests (caught) or the reason (error / not-applicable / skipped). */
  readonly details: readonly string[];
}

// Minimal shape of Playwright's JSON reporter output that this module relies on.
interface JsonSuite {
  readonly title: string;
  readonly specs?: readonly {
    readonly title: string;
    readonly tests: readonly {
      readonly projectName: string;
      readonly status: 'expected' | 'unexpected' | 'flaky' | 'skipped';
      readonly annotations: readonly { readonly type: string; readonly description?: string }[];
    }[];
  }[];
  readonly suites?: readonly JsonSuite[];
}
export interface JsonReport {
  readonly suites?: readonly JsonSuite[];
  readonly errors?: readonly { readonly message?: string }[];
}

/** Extracts what a mutation run needs from Playwright's JSON report. */
export function summarizeRun(report: JsonReport): RunSummary {
  const failed: FailedTest[] = [];
  let ran = 0;
  const visit = (suite: JsonSuite, path: readonly string[]): void => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        if (test.status === 'skipped') continue;
        ran++;
        if (test.status !== 'unexpected') continue;
        failed.push({
          title: `${[...path, spec.title].join(' › ')} [${test.projectName}]`,
          reqIds: test.annotations
            .filter((a) => a.type === 'req' && a.description)
            .map((a) => a.description ?? ''),
        });
      }
    }
    for (const child of suite.suites ?? []) visit(child, [...path, child.title]);
  };
  for (const suite of report.suites ?? []) visit(suite, [suite.title]);
  const errors = (report.errors ?? []).map((e) => e.message ?? 'unknown error');
  return { failed, ran, errors };
}

/** Decides a mutant's status from its run. */
export function scoreMutant(
  expectedReqs: readonly string[],
  run: RunSummary,
): { status: MutantStatus; details: string[] } {
  if (run.errors.length > 0) return { status: 'error', details: [...run.errors] };
  if (run.ran === 0) return { status: 'error', details: ['no tests ran'] };
  if (run.failed.length === 0) return { status: 'survived', details: [] };
  const intended = run.failed.filter((t) => t.reqIds.some((id) => expectedReqs.includes(id)));
  if (intended.length > 0) {
    return { status: 'caught', details: intended.map((t) => t.title) };
  }
  return {
    status: 'caught-elsewhere',
    details: run.failed.map((t) => `${t.title} (${t.reqIds.join(', ') || 'no REQ'})`),
  };
}

/** Statuses that fail `npm run mutate`. Skipped mutants don't (they run in CI on Linux). */
export function isFailure(status: MutantStatus): boolean {
  return status !== 'caught' && status !== 'skipped';
}

const STATUS_LABEL: Readonly<Record<MutantStatus, string>> = {
  caught: '✅ caught',
  'caught-elsewhere': '⚠️ caught by other tests',
  survived: '❌ survived',
  error: '❌ run error',
  'not-applicable': '❌ no longer applies',
  skipped: '⏭️ skipped (needs Linux)',
};

export interface TrustContext {
  /** e.g. "linux (Playwright container)" */
  readonly environment: string;
  /** Commit the site and tests were at. */
  readonly commit: string;
  readonly coverage: { readonly covered: number; readonly total: number; readonly tests: number };
}

/** Renders docs/TRUST.md: the one page to read instead of the test code. */
export function renderTrust(results: readonly MutantResult[], context: TrustContext): string {
  const scored = results.filter((r) => r.status !== 'skipped');
  const caught = scored.filter((r) => r.status === 'caught').length;
  const percent = scored.length === 0 ? 0 : Math.round((caught / scored.length) * 100);
  const skipped = results.length - scored.length;

  const lines = [
    '# Trust scorecard',
    '',
    '<!-- Generated by `npm run mutate -- --write`. Do not edit by hand. -->',
    '',
    `Generated in **${context.environment}** at commit \`${context.commit}\`.`,
    '',
    '## Summary',
    '',
    '| Signal | Result |',
    '|---|---|',
    `| **Mutation score** | **${String(caught)} of ${String(scored.length)} mutants caught by the intended tests (${String(percent)}%)**${skipped > 0 ? `, ${String(skipped)} skipped on this platform` : ''} |`,
    `| Requirement coverage | ${String(context.coverage.covered)} of ${String(context.coverage.total)} requirements proven by ${String(context.coverage.tests)} tests ([COVERAGE.md](COVERAGE.md)) |`,
    '| Flaky tests | Fail CI (`failOnFlakyTests`); new specs are repeated before merge |',
    '| Silent errors | Any console error, uncaught exception or failed same-origin request fails a test |',
    '| Helpers | Every helper has self-tests that prove it reports a known-bad page |',
    '',
    '## How to read this',
    '',
    'Each mutant is a realistic defect applied to a temporary copy of the site ([catalog](../scripts/mutate/mutants.ts)).',
    'It counts as **caught** only if a test that proves one of the expected requirements fails.',
    'A mutant caught only by unrelated tests, or not caught at all, is a gap and fails the run.',
    '',
  ];

  const areas = [...new Set(results.map((r) => r.area))];
  for (const area of areas) {
    lines.push(
      `## ${area}`,
      '',
      '| Mutant | Defect | Expected | Result | Caught by |',
      '|---|---|---|---|---|',
    );
    for (const r of results.filter((result) => result.area === area)) {
      const shown = r.details.slice(0, 2).map(escapeCell);
      const more = r.details.length > 2 ? `<br>+${String(r.details.length - 2)} more` : '';
      lines.push(
        `| ${r.id} | ${escapeCell(r.description)} | ${r.expectedReqs.join(', ')} | ${STATUS_LABEL[r.status]} | ${shown.join('<br>') || '—'}${more} |`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

/** Escapes table pipes and HTML (a description like "end of <body>" would render as a tag). */
function escapeCell(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(?<!\\)\|/g, '\\|');
}
