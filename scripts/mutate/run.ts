/**
 * Mutation runner: applies each mutant to a temporary copy of the site, runs the tests that
 * should catch it, and scores the result.
 *
 *   npm run mutate                       run every mutant, print the scores
 *   npm run mutate -- --only M-I18N-01   run selected mutants (comma-separated IDs)
 *   npm run mutate -- --write            also write docs/TRUST.md (done in CI, on Linux)
 *
 * Exits non-zero if any mutant survived, was caught only by unrelated tests, no longer applies,
 * or its run errored.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';
import {
  collectTests,
  findCoverageProblems,
  parseRequirements,
  type JsonReport as ListReport,
} from '../coverage/lib';
import {
  isFailure,
  renderTrust,
  scoreMutant,
  summarizeRun,
  type JsonReport,
  type MutantResult,
} from './lib';
import {
  findCatalogProblems,
  MUTANTS,
  MutantNotApplicable,
  type Mutant,
  type Project,
} from './mutants';

const ROOT = join(import.meta.dirname, '..', '..');
const TRUST = join(ROOT, 'docs', 'TRUST.md');
const SITE_FILES = ['index.html', 'styles.css', 'script.js', 'assets'];
const AREAS: Readonly<Record<string, string>> = {
  A11Y: 'Accessibility',
  THEME: 'Theme',
  I18N: 'Languages',
  RESP: 'Responsive layout',
  LINK: 'Links and assets',
  NAV: 'Navigation',
  HEALTH: 'Health',
  VIS: 'Visual',
};
// Each run gets its own port, so a server left over from a previous run (or `npm run serve`)
// can never be reused by mistake and serve the unmutated site.
let nextPort = 4300;

const args = process.argv.slice(2);
const write = args.includes('--write');
const onlyIndex = args.indexOf('--only');
const only = onlyIndex >= 0 ? (args[onlyIndex + 1] ?? '').split(',').filter(Boolean) : [];

const projectsOf = (m: Mutant): readonly Project[] => m.projects ?? ['desktop'];
const applicable = (m: Mutant): boolean => !m.platform || m.platform === process.platform;
const selected = MUTANTS.filter((m) => only.length === 0 || only.includes(m.id));
if (only.length > 0 && selected.length !== only.length) {
  console.error(`Unknown mutant ID in --only: ${only.join(', ')}`);
  process.exit(2);
}

/** Copies the site files into a new temporary directory. */
function copySite(): string {
  const dir = mkdtempSync(join(tmpdir(), 'mutant-'));
  for (const file of SITE_FILES) cpSync(join(ROOT, file), join(dir, file), { recursive: true });
  return dir;
}

/** Runs Playwright against a site directory and summarizes the JSON report. */
function runTests(siteDir: string, grep: string, projects: readonly Project[]) {
  const result = spawnSync(
    'npx',
    [
      'playwright',
      'test',
      '--grep',
      grep,
      ...projects.flatMap((p) => ['--project', p]),
      '--reporter=json',
      '--retries=0',
    ],
    {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      env: { ...process.env, SITE_DIR: siteDir, PORT: String(nextPort++) },
    },
  );
  try {
    return summarizeRun(JSON.parse(result.stdout) as JsonReport);
  } catch {
    return { failed: [], ran: 0, errors: [`no JSON report: ${result.stderr.slice(0, 500)}`] };
  }
}

/** The tests every mutant relies on must pass on the unmutated site, or scores mean nothing. */
function sanityCheck(mutants: readonly Mutant[]): void {
  const greps = [...new Set(mutants.map((m) => m.grep.split('|')).flat())];
  const projects = [...new Set(mutants.flatMap(projectsOf))];
  const site = copySite();
  try {
    console.log(`Sanity run on the unmutated site: ${greps.join(' ')} on ${projects.join(', ')}…`);
    const run = runTests(site, greps.join('|'), projects);
    if (run.errors.length > 0 || run.ran === 0 || run.failed.length > 0) {
      console.error(
        'The suite is not green on the unmutated site; mutation scores would be meaningless.',
      );
      for (const line of [...run.errors, ...run.failed.map((t) => t.title)])
        console.error(`- ${line}`);
      process.exit(1);
    }
    console.log(`Sanity OK: ${String(run.ran)} tests passed.\n`);
  } finally {
    rmSync(site, { recursive: true, force: true });
  }
}

function runMutant(mutant: Mutant): MutantResult {
  const base = {
    id: mutant.id,
    description: mutant.description,
    area: AREAS[mutant.id.split('-')[1] ?? ''] ?? 'Other',
    expectedReqs: mutant.expectedReqs,
  };
  if (!applicable(mutant)) {
    return { ...base, status: 'skipped', details: [`needs ${mutant.platform ?? ''}`] };
  }
  const site = copySite();
  try {
    for (const change of [mutant, ...(mutant.extraChanges ?? [])]) {
      const path = join(site, change.file);
      writeFileSync(path, change.mutate(readFileSync(path, 'utf8')));
    }
    const { status, details } = scoreMutant(
      mutant.expectedReqs,
      runTests(site, mutant.grep, projectsOf(mutant)),
    );
    return { ...base, status, details };
  } catch (error) {
    if (error instanceof MutantNotApplicable) {
      return { ...base, status: 'not-applicable', details: [error.message] };
    }
    throw error;
  } finally {
    rmSync(site, { recursive: true, force: true });
  }
}

function coverageSummary() {
  const listing = execFileSync('npx', ['playwright', 'test', '--list', '--reporter=json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const requirements = parseRequirements(
    readFileSync(join(ROOT, 'docs', 'REQUIREMENTS.md'), 'utf8'),
  );
  const tests = collectTests(JSON.parse(listing) as ListReport, ['self-test']);
  if (findCoverageProblems(requirements, tests).length > 0) {
    console.warn('Coverage problems exist; run `npm run coverage:check` for details.');
  }
  const covered = requirements.filter((r) => tests.some((t) => t.reqIds.includes(r.id))).length;
  return { covered, total: requirements.length, tests: tests.length };
}

const stale = findCatalogProblems(selected, (file) => readFileSync(join(ROOT, file), 'utf8'));
if (stale.length > 0) {
  console.error(`Mutants that no longer apply to the site:\n- ${stale.join('\n- ')}`);
  process.exit(1);
}
sanityCheck(selected.filter(applicable));

const results: MutantResult[] = [];
for (const mutant of selected) {
  const result = runMutant(mutant);
  results.push(result);
  const mark = result.status === 'caught' ? '✓' : result.status === 'skipped' ? '-' : '✗';
  console.log(`${mark} ${mutant.id.padEnd(12)} ${result.status.padEnd(16)} ${mutant.description}`);
  if (isFailure(result.status)) for (const line of result.details) console.log(`    ${line}`);
}

if (write) {
  const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
  const environment = process.env.CI
    ? `${process.platform} (Playwright container, CI)`
    : process.platform;
  const markdown = renderTrust(results, { environment, commit, coverage: coverageSummary() });
  writeFileSync(
    TRUST,
    await format(markdown, { ...(await resolveConfig(TRUST)), filepath: TRUST }),
  );
  console.log(`\nWrote ${TRUST}`);
}

const failures = results.filter((r) => isFailure(r.status));
const caught = results.filter((r) => r.status === 'caught').length;
const scored = results.filter((r) => r.status !== 'skipped').length;
console.log(`\nMutation score: ${String(caught)}/${String(scored)} caught by the intended tests.`);
if (failures.length > 0) {
  console.error(
    `${String(failures.length)} mutant(s) need attention: ${failures.map((r) => r.id).join(', ')}`,
  );
  process.exit(1);
}
