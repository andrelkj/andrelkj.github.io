// Unit tests for the coverage matrix logic. Plain @playwright/test: no browser, no page fixtures.
import { expect, test } from '@playwright/test';
import {
  collectTests,
  findCoverageProblems,
  parseRequirements,
  renderCoverage,
  type JsonReport,
} from '../../scripts/coverage/lib';

const REQUIREMENTS_MD = `# Requirements

## Theme

| ID | Requirement |
|---|---|
| REQ-THEME-01 | Dark by default. |
| REQ-THEME-02 | Toggle works \\| both ways. |

## Visual

| ID | Requirement |
|---|---|
| REQ-VIS-01 | Looks right. _Planned: phase 4._ |
`;

const report = (
  specs: { title: string; line: number; projects: string[]; reqs: string[] }[],
): JsonReport => ({
  suites: [
    {
      title: 'theme.spec.ts',
      suites: [
        {
          title: 'theme',
          specs: specs.map((s) => ({
            title: s.title,
            file: 'specs/theme.spec.ts',
            line: s.line,
            tests: s.projects.map((projectName) => ({
              projectName,
              annotations: s.reqs.map((description) => ({ type: 'req', description })),
            })),
          })),
        },
      ],
    },
  ],
});

test.describe('parseRequirements', () => {
  test('reads IDs, text, area and planned status', () => {
    expect(parseRequirements(REQUIREMENTS_MD)).toEqual([
      { id: 'REQ-THEME-01', text: 'Dark by default.', area: 'Theme', planned: false },
      { id: 'REQ-THEME-02', text: 'Toggle works \\| both ways.', area: 'Theme', planned: false },
      { id: 'REQ-VIS-01', text: 'Looks right. _Planned: phase 4._', area: 'Visual', planned: true },
    ]);
  });
});

test.describe('collectTests', () => {
  test('merges projects per test, keeps the describe path, drops excluded projects', () => {
    const tests = collectTests(
      report([
        {
          title: 'is dark',
          line: 7,
          projects: ['mobile', 'desktop', 'self-test'],
          reqs: ['REQ-THEME-01'],
        },
      ]),
      ['self-test'],
    );
    expect(tests).toEqual([
      {
        file: 'specs/theme.spec.ts',
        line: 7,
        title: 'theme › is dark',
        reqIds: ['REQ-THEME-01'],
        projects: ['desktop', 'mobile'],
      },
    ]);
  });
});

test.describe('findCoverageProblems', () => {
  const requirements = parseRequirements(REQUIREMENTS_MD);

  test('no problems when every requirement is proven and every test proves one', () => {
    const tests = collectTests(
      report([
        { title: 'a', line: 1, projects: ['desktop'], reqs: ['REQ-THEME-01'] },
        { title: 'b', line: 2, projects: ['desktop'], reqs: ['REQ-THEME-02'] },
      ]),
      [],
    );
    expect(findCoverageProblems(requirements, tests)).toEqual([]);
  });

  test('reports every kind of gap', () => {
    const tests = collectTests(
      report([
        { title: 'untagged', line: 3, projects: ['desktop'], reqs: [] },
        { title: 'typo', line: 4, projects: ['desktop'], reqs: ['REQ-THEME-99'] },
        { title: 'early', line: 5, projects: ['desktop'], reqs: ['REQ-VIS-01'] },
      ]),
      [],
    );
    expect(findCoverageProblems(requirements, tests)).toEqual([
      'REQ-THEME-01 has no test',
      'REQ-THEME-02 has no test',
      'REQ-VIS-01 is marked planned but has tests: update docs/REQUIREMENTS.md',
      'specs/theme.spec.ts:3 "theme › untagged" proves no requirement (add annotation: req(…))',
      'specs/theme.spec.ts:4 "theme › typo" claims REQ-THEME-99, which is not in docs/REQUIREMENTS.md',
    ]);
  });

  test('reports a requirement ID defined twice', () => {
    const doubled = parseRequirements(`${REQUIREMENTS_MD}\n| REQ-THEME-01 | Again. |\n`);
    expect(findCoverageProblems(doubled, [])).toContain('REQ-THEME-01 is defined more than once');
  });
});

test.describe('renderCoverage', () => {
  test('lists linked tests per requirement and marks gaps', () => {
    const tests = collectTests(
      report([{ title: 'is dark', line: 7, projects: ['mobile'], reqs: ['REQ-THEME-01'] }]),
      [],
    );
    const markdown = renderCoverage(parseRequirements(REQUIREMENTS_MD), tests);

    expect(markdown).toContain('**1 of 3 requirements covered by 1 tests**');
    expect(markdown).toContain(
      '| **REQ-THEME-01** Dark by default. | [specs/theme.spec.ts:7](../tests/specs/theme.spec.ts#L7) theme › is dark | mobile |',
    );
    expect(markdown).toContain('| **REQ-THEME-02** Toggle works \\| both ways. | **none** | — |');
    expect(markdown).toContain(
      '| **REQ-VIS-01** Looks right. _Planned: phase 4._ | _planned_ | — |',
    );
  });
});
