import type { SameInBothLanguages } from '../support/i18n';

/**
 * i18n keys whose PT text is intentionally identical to EN.
 * The parity test fails if one of these gets translated (stale entry) or disappears, so
 * this list can only shrink when the site changes, never silently grow.
 */
export const SAME_IN_BOTH: readonly SameInBothLanguages[] = [
  { key: 'nav.stack', reason: '"Stack" is the term used in Brazilian tech jargon too.' },
  { key: 'hero.role', reason: 'Job titles are kept in English, as on the resume.' },
  { key: 'exp.k.role', reason: 'Job title, kept in English.' },
  { key: 'exp.q.role', reason: 'Job title, kept in English.' },
  { key: 'exp.t.date', reason: '"Jun 2020 – Jan 2023": both month abbreviations match in PT.' },
  { key: 'ai.c5', reason: '"README" is a file name.' },
  { key: 'stack.web', reason: 'Lowercase category label in code style; "web" is the same in PT.' },
  { key: 'stack.mobile', reason: 'Code-style category label; "mobile" is used as-is in PT.' },
  { key: 'stack.api', reason: 'Code-style category label; "api" is the same in PT.' },
];
