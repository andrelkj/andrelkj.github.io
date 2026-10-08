/**
 * Coverage matrix: links docs/REQUIREMENTS.md to the tests that prove each requirement.
 * Pure functions only, so they can be unit-tested without Playwright or the file system.
 */

export interface Requirement {
  readonly id: string;
  readonly text: string;
  /** The `##` heading the requirement sits under, e.g. "Accessibility". */
  readonly area: string;
  /** True when the requirement text says "_Planned: …_": it may have no test yet. */
  readonly planned: boolean;
}

export interface ListedTest {
  /** Path relative to the test directory, e.g. "specs/a11y.spec.ts". */
  readonly file: string;
  readonly line: number;
  /** Describe blocks and test title, joined with " › ". */
  readonly title: string;
  readonly reqIds: readonly string[];
  readonly projects: readonly string[];
}

const REQ_ROW = /^\|\s*(REQ-[A-Z0-9]+-\d+)\s*\|\s*(.+?)\s*\|\s*$/;

/** Reads requirement rows (`| REQ-… | text |`) and the `##` area each belongs to. */
export function parseRequirements(markdown: string): Requirement[] {
  const requirements: Requirement[] = [];
  let area = '';
  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) area = line.slice(3).trim();
    const match = REQ_ROW.exec(line);
    if (match?.[1] && match[2]) {
      requirements.push({
        id: match[1],
        text: match[2],
        area,
        planned: /_Planned:[^_]*_/.test(match[2]),
      });
    }
  }
  return requirements;
}

// Minimal shape of `playwright test --list --reporter=json` that this script relies on.
interface JsonSuite {
  readonly title: string;
  readonly specs?: readonly JsonSpec[];
  readonly suites?: readonly JsonSuite[];
}
interface JsonSpec {
  readonly title: string;
  readonly file: string;
  readonly line: number;
  readonly tests: readonly {
    readonly projectName: string;
    readonly annotations: readonly { readonly type: string; readonly description?: string }[];
  }[];
}
export interface JsonReport {
  readonly suites: readonly JsonSuite[];
}

/**
 * Flattens the JSON listing into one entry per test (projects merged).
 * Tests from `excludeProjects` (e.g. self-tests of helpers) are left out.
 */
export function collectTests(report: JsonReport, excludeProjects: readonly string[]): ListedTest[] {
  const byKey = new Map<string, { test: ListedTest; projects: Set<string>; reqIds: Set<string> }>();

  const visit = (suite: JsonSuite, path: readonly string[]): void => {
    for (const spec of suite.specs ?? []) {
      for (const run of spec.tests) {
        if (excludeProjects.includes(run.projectName)) continue;
        const title = [...path, spec.title].join(' › ');
        const key = `${spec.file}:${String(spec.line)}:${title}`;
        const entry = byKey.get(key) ?? {
          test: { file: spec.file, line: spec.line, title, reqIds: [], projects: [] },
          projects: new Set<string>(),
          reqIds: new Set<string>(),
        };
        entry.projects.add(run.projectName);
        for (const annotation of run.annotations) {
          if (annotation.type === 'req' && annotation.description) {
            entry.reqIds.add(annotation.description);
          }
        }
        byKey.set(key, entry);
      }
    }
    for (const child of suite.suites ?? []) visit(child, [...path, child.title]);
  };
  // Top-level suites are files; their title is the file name, not a describe block.
  for (const fileSuite of report.suites) visit(fileSuite, []);

  return [...byKey.values()].map(({ test, projects, reqIds }) => ({
    ...test,
    projects: [...projects].sort(),
    reqIds: [...reqIds].sort(),
  }));
}

/**
 * Every rule the matrix enforces. An empty list means:
 * - every requirement that isn't planned has at least one test,
 * - every test proves at least one requirement,
 * - every requirement a test claims exists,
 * - no "planned" requirement already has tests (the doc would be stale).
 */
export function findCoverageProblems(
  requirements: readonly Requirement[],
  tests: readonly ListedTest[],
): string[] {
  const known = new Set(requirements.map((r) => r.id));
  const covered = new Set(tests.flatMap((t) => t.reqIds));
  const problems: string[] = [];

  for (const r of requirements) {
    if (!r.planned && !covered.has(r.id)) problems.push(`${r.id} has no test`);
    if (r.planned && covered.has(r.id)) {
      problems.push(`${r.id} is marked planned but has tests: update docs/REQUIREMENTS.md`);
    }
  }
  for (const t of tests) {
    const where = `${t.file}:${String(t.line)} "${t.title}"`;
    if (t.reqIds.length === 0)
      problems.push(`${where} proves no requirement (add annotation: req(…))`);
    for (const id of t.reqIds) {
      if (!known.has(id))
        problems.push(`${where} claims ${id}, which is not in docs/REQUIREMENTS.md`);
    }
  }
  const duplicates = requirements.filter(
    (r, i) => requirements.findIndex((o) => o.id === r.id) !== i,
  );
  for (const r of duplicates) problems.push(`${r.id} is defined more than once`);
  return problems;
}

/** Renders docs/COVERAGE.md. Deterministic: same input → same bytes, so CI can diff it. */
export function renderCoverage(
  requirements: readonly Requirement[],
  tests: readonly ListedTest[],
): string {
  const lines = [
    '# Coverage matrix',
    '',
    '<!-- Generated by `npm run coverage` from docs/REQUIREMENTS.md and the test annotations. Do not edit by hand. -->',
    '',
    'Which tests prove each requirement in [REQUIREMENTS.md](REQUIREMENTS.md), and on which projects they run.',
    'CI fails when a requirement has no test, a test proves no requirement, or this file is out of date.',
    'Projects lists where a test is registered; a few tests skip on specific viewports and the report states why.',
    '',
  ];
  const testCount = tests.length;
  const coveredCount = requirements.filter((r) =>
    tests.some((t) => t.reqIds.includes(r.id)),
  ).length;
  lines.push(
    `**${String(coveredCount)} of ${String(requirements.length)} requirements covered by ${String(testCount)} tests** (planned requirements may have none).`,
    '',
  );

  const areas = [...new Set(requirements.map((r) => r.area))];
  for (const area of areas) {
    lines.push(`## ${area}`, '', '| Requirement | Tests | Projects |', '|---|---|---|');
    for (const r of requirements.filter((req) => req.area === area)) {
      const proving = tests
        .filter((t) => t.reqIds.includes(r.id))
        .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
      const testCell =
        proving.length === 0
          ? r.planned
            ? '_planned_'
            : '**none**'
          : proving.map((t) => `${testLink(t)} ${escapeCell(t.title)}`).join('<br>');
      const projects = [...new Set(proving.flatMap((t) => t.projects))].sort().join(', ');
      lines.push(`| **${r.id}** ${escapeCell(r.text)} | ${testCell} | ${projects || '—'} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

/** Markdown link from docs/ to the test's line, e.g. [specs/a.spec.ts:7](../tests/specs/a.spec.ts#L7). */
function testLink(test: ListedTest): string {
  const location = `${test.file}:${String(test.line)}`;
  return `[${location}](../tests/${test.file}#L${String(test.line)})`;
}

function escapeCell(text: string): string {
  // Requirement text comes from a Markdown table, where pipes are already escaped as \|.
  return text.replace(/(?<!\\)\|/g, '\\|');
}
