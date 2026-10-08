// Unit tests for the mutation runner logic and the mutant catalog. No browser needed.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseRequirements } from '../../scripts/coverage/lib';
import {
  renderTrust,
  scoreMutant,
  summarizeRun,
  type JsonReport,
  type MutantResult,
  type RunSummary,
} from '../../scripts/mutate/lib';
import { findCatalogProblems, MUTANTS } from '../../scripts/mutate/mutants';

const ROOT = join(import.meta.dirname, '..', '..');

const report: JsonReport = {
  suites: [
    {
      title: 'i18n.spec.ts',
      suites: [
        {
          title: 'languages',
          specs: [
            {
              title: 'every text has a PT translation',
              tests: [
                {
                  projectName: 'desktop',
                  status: 'unexpected',
                  annotations: [{ type: 'req', description: 'REQ-I18N-01' }],
                },
              ],
            },
            {
              title: 'copy reads as expected',
              tests: [
                { projectName: 'desktop', status: 'expected', annotations: [] },
                { projectName: 'mobile', status: 'skipped', annotations: [] },
              ],
            },
          ],
        },
      ],
    },
  ],
};

test.describe('summarizeRun', () => {
  test('lists failed tests with their requirements and counts tests that ran', () => {
    expect(summarizeRun(report)).toEqual({
      failed: [
        {
          title: 'i18n.spec.ts › languages › every text has a PT translation [desktop]',
          reqIds: ['REQ-I18N-01'],
        },
      ],
      ran: 2,
      errors: [],
    });
  });

  test('keeps run-level errors', () => {
    expect(summarizeRun({ suites: [], errors: [{ message: 'web server failed' }] }).errors).toEqual(
      ['web server failed'],
    );
  });
});

test.describe('scoreMutant', () => {
  const failing = (reqIds: string[]): RunSummary => ({
    failed: [{ title: 't [desktop]', reqIds }],
    ran: 5,
    errors: [],
  });

  test('caught when a test for an expected requirement fails', () => {
    expect(scoreMutant(['REQ-I18N-01'], failing(['REQ-I18N-01'])).status).toBe('caught');
  });

  test('caught-elsewhere when only unrelated tests fail', () => {
    expect(scoreMutant(['REQ-I18N-01'], failing(['REQ-NAV-01'])).status).toBe('caught-elsewhere');
  });

  test('survived when nothing fails', () => {
    expect(scoreMutant(['REQ-I18N-01'], { failed: [], ran: 5, errors: [] }).status).toBe(
      'survived',
    );
  });

  test('a broken run is an error, never a catch', () => {
    expect(scoreMutant(['REQ-I18N-01'], { failed: [], ran: 0, errors: [] }).status).toBe('error');
    expect(
      scoreMutant(['REQ-I18N-01'], { failed: [], ran: 3, errors: ['web server failed'] }).status,
    ).toBe('error');
  });
});

test.describe('renderTrust', () => {
  test('scores only mutants that ran on this platform', () => {
    const result = (id: string, status: MutantResult['status']): MutantResult => ({
      id,
      description: 'defect | with pipe',
      area: 'Languages',
      expectedReqs: ['REQ-I18N-01'],
      status,
      details: [],
    });
    const markdown = renderTrust(
      [result('M-1', 'caught'), result('M-2', 'survived'), result('M-3', 'skipped')],
      { environment: 'linux', commit: 'abc1234', coverage: { covered: 30, total: 31, tests: 53 } },
    );
    expect(markdown).toContain(
      '**1 of 2 mutants caught by the intended tests (50%)**, 1 skipped on this platform',
    );
    expect(markdown).toContain('| M-2 | defect \\| with pipe | REQ-I18N-01 | ❌ survived | — |');
    expect(markdown).toContain('30 of 31 requirements proven by 53 tests');
  });

  test('escapes HTML in cells so descriptions render as text', () => {
    const markdown = renderTrust(
      [
        {
          id: 'M-1',
          description: 'theme applied at the end of <body>',
          area: 'Theme',
          expectedReqs: ['REQ-THEME-03'],
          status: 'caught',
          details: [],
        },
      ],
      { environment: 'linux', commit: 'abc1234', coverage: { covered: 1, total: 1, tests: 1 } },
    );
    expect(markdown).toContain('theme applied at the end of &lt;body&gt;');
  });
});

test.describe('mutant catalog', () => {
  test('IDs are unique and every expected requirement exists', () => {
    const ids = MUTANTS.map((m) => m.id);
    expect(new Set(ids).size, 'duplicate mutant IDs').toBe(ids.length);

    const known = new Set(
      parseRequirements(readFileSync(join(ROOT, 'docs', 'REQUIREMENTS.md'), 'utf8')).map(
        (r) => r.id,
      ),
    );
    const unknown = MUTANTS.flatMap((m) => m.expectedReqs.filter((id) => !known.has(id)));
    expect(unknown, 'expected requirements missing from REQUIREMENTS.md').toEqual([]);
  });

  // Runs on every PR in milliseconds: a site edit that breaks a mutant fails here, not only in
  // the long mutation run.
  test('every mutant still applies to the current site and changes it', () => {
    expect(findCatalogProblems(MUTANTS, (file) => readFileSync(join(ROOT, file), 'utf8'))).toEqual(
      [],
    );
  });
});
