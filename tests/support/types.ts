/** Themes the site supports; stored in `localStorage.theme` and on `html[data-theme]`. */
export const THEMES = ['dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];

/** Languages the site supports; stored in `localStorage.lang`. */
export const LANGS = ['en', 'pt'] as const;
export type Lang = (typeof LANGS)[number];

/** Value the site writes to `html[lang]` for each language. */
export const HTML_LANG: Readonly<Record<Lang, string>> = { en: 'en', pt: 'pt-BR' };

/** Every theme × language pair, for specs that must hold in all of them. */
export const THEME_LANG_MATRIX: readonly { readonly theme: Theme; readonly lang: Lang }[] =
  THEMES.flatMap((theme) => LANGS.map((lang) => ({ theme, lang })));
