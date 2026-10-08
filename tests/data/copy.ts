import type { Lang } from '../support/types';

/**
 * Exact text of the most visible strings, per language. The parity check proves PT differs
 * from EN; these prove it says the RIGHT thing (e.g. catches two keys swapped).
 */
export const COPY: Readonly<
  Record<
    Lang,
    { readonly navLinks: readonly string[]; readonly sectionHeadings: readonly string[] }
  >
> = {
  en: {
    navLinks: ['About', 'Experience', 'Work', 'Stack', 'Contact'],
    sectionHeadings: [
      'Quality that ships with the code.',
      'Experience',
      'Selected work',
      'How this site was built',
      'Tools I work with',
      'Education & recognition',
      "Let's talk about quality.",
    ],
  },
  pt: {
    navLinks: ['Sobre', 'Experiência', 'Projetos', 'Stack', 'Contato'],
    sectionHeadings: [
      'Qualidade que vai junto com o código.',
      'Experiência',
      'Projetos em destaque',
      'Como este site foi feito',
      'Ferramentas que uso',
      'Formação & reconhecimento',
      'Vamos falar sobre qualidade.',
    ],
  },
};

/** Accessible names that script.js localizes (UI dictionary). */
export const UI_NAMES: Readonly<
  Record<Lang, { readonly languageGroup: string; readonly themeToggleInDark: string }>
> = {
  en: { languageGroup: 'Language', themeToggleInDark: 'Switch to light theme' },
  pt: { languageGroup: 'Idioma', themeToggleInDark: 'Mudar para tema claro' },
};
