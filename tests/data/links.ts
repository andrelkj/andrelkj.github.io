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
