/**
 * Generates docs/COVERAGE.md and enforces the coverage rules.
 *
 *   npm run coverage         regenerate docs/COVERAGE.md, fail on coverage problems
 *   npm run coverage:check   same rules, and fail if docs/COVERAGE.md is out of date (CI)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';
import {
  collectTests,
  findCoverageProblems,
  parseRequirements,
  renderCoverage,
  type JsonReport,
} from './lib';

const ROOT = join(import.meta.dirname, '..', '..');
const REQUIREMENTS = join(ROOT, 'docs', 'REQUIREMENTS.md');
const COVERAGE = join(ROOT, 'docs', 'COVERAGE.md');
/** Self-tests prove the helpers, not site requirements. */
const EXCLUDED_PROJECTS = ['self-test'];

const checkOnly = process.argv.includes('--check');

const listing = execFileSync('npx', ['playwright', 'test', '--list', '--reporter=json'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const requirements = parseRequirements(readFileSync(REQUIREMENTS, 'utf8'));
const tests = collectTests(JSON.parse(listing) as JsonReport, EXCLUDED_PROJECTS);
const problems = findCoverageProblems(requirements, tests);
// Formatted with the repo's Prettier config, so the generated file passes `npm run check` and
// --check compares exactly what `npm run coverage` writes.
const rendered = await format(renderCoverage(requirements, tests), {
  ...(await resolveConfig(COVERAGE)),
  filepath: COVERAGE,
});

if (checkOnly) {
  const committed = readFileSync(COVERAGE, 'utf8');
  if (committed !== rendered) {
    problems.push('docs/COVERAGE.md is out of date: run `npm run coverage` and commit it');
  }
} else {
  writeFileSync(COVERAGE, rendered);
  console.log(`Wrote ${COVERAGE}`);
}

if (problems.length > 0) {
  console.error(`Coverage problems (${String(problems.length)}):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `Coverage OK: ${String(requirements.length)} requirements, ${String(tests.length)} tests.`,
);
