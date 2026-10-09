/**
 * Every external link on the page, in document order. A link added, removed or changed on
 * the site fails REQ-LINK-02 until this list is updated, which is how a reviewer notices.
 */
export const EXTERNAL_LINKS: readonly string[] = [
  'https://www.linkedin.com/in/andrekj',
  'https://github.com/andrelkj',
  'https://github.com/andrelkj/Universo-Cypress',
  'https://github.com/andrelkj/ZombiePlus',
  'https://github.com/andrelkj/GravidadeZero',
  'https://www.linkedin.com/in/andrekj',
  'https://github.com/andrelkj',
];

/** The resume file every resume link must download. */
export const RESUME_FILE = 'Andre_Kreutzer_SDET_Resume.pdf';

/**
 * Hosts that don't give automated clients a meaningful answer. For these, the nightly
 * reachability check (REQ-LINK-06) accepts the listed statuses and can only prove the host
 * responds, not that the page exists. Every entry needs a reason.
 */
export const BOT_LIMITED_HOSTS: readonly {
  readonly host: string;
  readonly acceptedStatuses: readonly number[];
  readonly reason: string;
}[] = [
  {
    host: 'www.linkedin.com',
    acceptedStatuses: [999],
    reason:
      'LinkedIn answers automated requests from cloud IPs with HTTP 999 or a login wall, whether or not the profile exists.',
  },
];
