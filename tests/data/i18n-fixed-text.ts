import type { FixedText } from '../support/i18n';

const fixed = (reason: string, ...matches: (string | RegExp)[]): FixedText[] =>
  matches.map((match) => ({ match, reason }));

/**
 * Text with no translation key that stays the same in EN and PT. Anything else on the page
 * without a key fails REQ-I18N-07, so new copy can't silently skip translation. Entries that no
 * longer match anything also fail, so this list can't go stale.
 */
export const FIXED_TEXT: readonly FixedText[] = [
  ...fixed(
    'Personal name, brand and email.',
    'andre',
    '.kreutzer',
    'André Kreutzer',
    'andre.kreutzer@outlook.com',
  ),
  ...fixed('Language switch labels name the language itself.', 'EN', 'PT'),
  ...fixed('Product and site names.', 'LinkedIn', 'GitHub'),
  ...fixed(
    'Company and award names.',
    '@ Kaizen Gaming',
    '@ Questrade',
    '@ Tunts.Rocks | AOA Technology',
    'Questrade · fintech',
    'Kaizen Gaming · iGaming',
    'Act to Impact Award',
  ),
  ...fixed('"Nov" is the same abbreviation in PT.', 'Questrade · Nov 2023'),
  ...fixed('Platform names.', 'web · iOS · Android', 'Web · iOS · Android'),
  ...fixed(
    'Shell commands and git output, shown as code.',
    'npx playwright test --reporter=list',
    'exit 0',
    /^[0-9a-f]{7}$/,
  ),
  ...fixed('Course project repository names.', 'Universo-Cypress', 'ZombiePlus', 'GravidadeZero'),
  ...fixed(
    'Tool, language and service names (tech chips).',
    'Playwright',
    'Playwright (C#/.NET · TS)',
    'C#',
    'XCUITest',
    'Espresso',
    'Charles Proxy',
    'Grafana',
    'Cypress',
    'TypeScript',
    'JavaScript',
    'SQL',
    'SQL (MySQL · SQL Server)',
    'Postman',
    'BrowserStack',
    'Jira',
    'Agile',
    'cypress-axe',
    'Page Object Model',
    'Sauce Labs',
    'Android Studio',
    'Mockoon',
    'GitLab CI',
    'Cypress Cloud',
    'Datadog',
    'Cypress · PostgreSQL · REST · CI',
    'Playwright · PostgreSQL · Docker · CI',
    'Robot Framework · REST · CI',
  ),
];
