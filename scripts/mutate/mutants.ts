/**
 * The mutant catalog: realistic ways the site could break, and which requirement's tests must
 * catch each one. `npm run mutate` applies each mutant to a temporary copy of the site, runs the
 * selected tests, and scores the result in docs/TRUST.md.
 *
 * Every mutant must change its file in exactly one place (replaceOnce). If the site changes and a
 * snippet disappears, the run fails with "no longer applies" instead of silently testing nothing.
 */

export type SiteFile = 'index.html' | 'styles.css' | 'script.js' | `assets/${string}`;
export type Project = 'mobile' | 'tablet' | 'desktop';

export interface FileChange {
  readonly file: SiteFile;
  /** Returns the mutated file content. Throws MutantNotApplicable if the target is gone. */
  readonly mutate: (source: string) => string;
}

export interface Mutant extends FileChange {
  /** Stable ID, e.g. "M-I18N-01". */
  readonly id: string;
  readonly description: string;
  /** Further files the same defect touches (most mutants change one file). */
  readonly extraChanges?: readonly FileChange[];
  /** The mutant counts as caught only if a failing test proves one of these requirements. */
  readonly expectedReqs: readonly string[];
  /** Playwright --grep for the tests to run (area tags). */
  readonly grep: string;
  /** Projects to run; default desktop. */
  readonly projects?: readonly Project[];
  /** Only meaningful on this platform (visual baselines exist only on Linux). */
  readonly platform?: 'linux';
}

export class MutantNotApplicable extends Error {}

/** Replaces `search` with `replacement`, requiring exactly one occurrence. */
function replaceOnce(search: string, replacement: string): (source: string) => string {
  return (source) => {
    const count = source.split(search).length - 1;
    if (count !== 1) {
      throw new MutantNotApplicable(
        `expected 1 occurrence of ${JSON.stringify(search)}, found ${String(count)}`,
      );
    }
    return source.replace(search, replacement);
  };
}

/** Replaces the whole file, ignoring its content (e.g. a broken asset). */
function replaceWith(content: string): (source: string) => string {
  return () => content;
}

const ALL_DEVICES: readonly Project[] = ['mobile', 'tablet', 'desktop'];
const COMPACT: readonly Project[] = ['mobile', 'tablet'];

const PRE_PAINT_SCRIPT = `  <script>
    // Apply saved theme before paint to avoid a flash.
    try {
      var t = localStorage.getItem("theme");
      if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
    } catch (e) {}
  </script>
`;

export const MUTANTS: readonly Mutant[] = [
  // ---------- Accessibility ----------
  {
    id: 'M-A11Y-01',
    description: 'Light theme dim text becomes low contrast (#b5bfbb)',
    file: 'styles.css',
    mutate: replaceOnce('  --text-dim: #5b6b65;', '  --text-dim: #b5bfbb;'),
    expectedReqs: ['REQ-A11Y-01', 'REQ-THEME-04'],
    grep: '@a11y|@theme',
  },
  {
    id: 'M-A11Y-02',
    description: 'Keyboard focus outline removed',
    file: 'styles.css',
    mutate: replaceOnce(
      ':focus-visible { outline: 2px solid var(--accent);',
      ':focus-visible { outline: none;',
    ),
    expectedReqs: ['REQ-A11Y-03'],
    grep: '@a11y',
  },
  {
    id: 'M-A11Y-03',
    description: 'Skip link jumps to the top instead of the main content',
    file: 'index.html',
    mutate: replaceOnce('<a class="skip-link" href="#main"', '<a class="skip-link" href="#top"'),
    expectedReqs: ['REQ-A11Y-02'],
    grep: '@a11y',
  },

  // ---------- Theme ----------
  {
    id: 'M-THEME-01',
    description: 'Pre-paint script removed: saved theme is never applied',
    file: 'index.html',
    mutate: replaceOnce(PRE_PAINT_SCRIPT, ''),
    expectedReqs: ['REQ-THEME-03'],
    grep: '@theme',
  },
  {
    id: 'M-THEME-02',
    description: 'Saved theme applied late, at the end of <body> (flash of dark theme)',
    file: 'index.html',
    mutate: (source) =>
      replaceOnce(
        '  <script src="script.js"></script>',
        `${PRE_PAINT_SCRIPT}  <script src="script.js"></script>`,
      )(replaceOnce(PRE_PAINT_SCRIPT, '')(source)),
    expectedReqs: ['REQ-THEME-03'],
    grep: '@theme',
  },
  {
    id: 'M-THEME-03',
    description: 'Theme toggle label never changes ("Switch to light theme" forever)',
    file: 'script.js',
    mutate: replaceOnce(
      'themeBtn.setAttribute("aria-label", dark ? UI[lang].toLight : UI[lang].toDark);',
      'themeBtn.setAttribute("aria-label", UI[lang].toLight);',
    ),
    expectedReqs: ['REQ-THEME-02'],
    grep: '@theme',
  },
  {
    id: 'M-THEME-04',
    description: 'Moon icon never shown in the light theme',
    file: 'styles.css',
    mutate: replaceOnce(':root[data-theme="light"] .theme-btn .icon-moon { display: block; }', ''),
    expectedReqs: ['REQ-THEME-02'],
    grep: '@theme',
  },
  {
    id: 'M-THEME-05',
    description: 'First visit follows the OS color scheme instead of defaulting to dark',
    file: 'index.html',
    mutate: replaceOnce(
      'if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;',
      'if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; else if (matchMedia("(prefers-color-scheme: light)").matches) document.documentElement.dataset.theme = "light";',
    ),
    expectedReqs: ['REQ-THEME-01'],
    grep: '@theme',
  },

  // ---------- Languages ----------
  {
    id: 'M-I18N-01',
    description: 'A PT translation is deleted (about.c3.t)',
    file: 'script.js',
    mutate: replaceOnce('    "about.c3.t": "APIs &amp; mocks",\n', ''),
    expectedReqs: ['REQ-I18N-01'],
    grep: '@i18n',
  },
  {
    id: 'M-I18N-02',
    description: 'Two PT translations swapped (Experience ↔ Selected work headings)',
    file: 'script.js',
    mutate: (source) =>
      replaceOnce(
        '    "work.title": "Projetos em destaque",',
        '    "work.title": "Experiência",',
      )(
        replaceOnce(
          '    "exp.title": "Experiência",',
          '    "exp.title": "Projetos em destaque",',
        )(source),
      ),
    expectedReqs: ['REQ-I18N-06'],
    grep: '@i18n',
  },
  {
    id: 'M-I18N-03',
    description: 'html[lang] is not updated when switching language',
    file: 'script.js',
    mutate: replaceOnce('    root.lang = lang === "pt" ? "pt-BR" : "en";\n', ''),
    expectedReqs: ['REQ-I18N-02', 'REQ-I18N-05'],
    grep: '@i18n',
  },
  {
    id: 'M-I18N-04',
    description: 'The language choice is not saved',
    file: 'script.js',
    mutate: replaceOnce('    store("lang", lang);\n', ''),
    expectedReqs: ['REQ-I18N-04'],
    grep: '@i18n',
  },
  {
    id: 'M-I18N-05',
    description: 'No auto-detection of Portuguese browsers',
    file: 'script.js',
    mutate: replaceOnce(
      'const initial = saved || ((navigator.language || "").toLowerCase().startsWith("pt") ? "pt" : "en");',
      'const initial = saved || "en";',
    ),
    expectedReqs: ['REQ-I18N-05'],
    grep: '@i18n',
  },
  {
    id: 'M-I18N-06',
    description: 'English snapshot taken with textContent: bold markup lost',
    file: 'script.js',
    mutate: replaceOnce(
      'EN[el.dataset.i18n] = el.innerHTML;',
      'EN[el.dataset.i18n] = el.textContent;',
    ),
    expectedReqs: ['REQ-I18N-03'],
    grep: '@i18n',
  },
  {
    id: 'M-I18N-07',
    description: 'New copy added without a translation key',
    file: 'index.html',
    mutate: replaceOnce(
      '<p class="eyebrow mono" data-i18n="edu.eyebrow">// background</p>',
      '<p class="eyebrow mono" data-i18n="edu.eyebrow">// background</p><p class="eyebrow mono">// new section</p>',
    ),
    expectedReqs: ['REQ-I18N-07'],
    grep: '@i18n',
  },
  {
    id: 'M-I18N-08',
    description: 'PT screen-reader label for the tech lists deleted',
    file: 'script.js',
    mutate: replaceOnce(',\n    "label.tech": "Tecnologias"', ''),
    expectedReqs: ['REQ-I18N-07'],
    grep: '@i18n',
  },
  {
    id: 'M-I18N-09',
    description: 'Screen-reader labels are never translated',
    file: 'script.js',
    mutate: replaceOnce('if (value !== undefined) el.setAttribute("aria-label", value);', ''),
    expectedReqs: ['REQ-I18N-07'],
    grep: '@i18n',
  },

  // ---------- Responsive ----------
  {
    id: 'M-RESP-01',
    description: 'Hero terminal forced to 600px wide (cut off on phones)',
    file: 'styles.css',
    mutate: (source) => `${source}\n.terminal { min-width: 600px; }\n`,
    expectedReqs: ['REQ-RESP-01'],
    grep: '@responsive',
    projects: ALL_DEVICES,
  },
  {
    id: 'M-RESP-02',
    description: 'Tab bar tap targets shrink to 36px',
    file: 'styles.css',
    mutate: replaceOnce('    min-height: 44px;', '    min-height: 36px;'),
    expectedReqs: ['REQ-RESP-02'],
    grep: '@responsive',
    projects: COMPACT,
  },
  {
    id: 'M-RESP-03',
    description: 'Header never hides on scroll (mobile/tablet)',
    file: 'script.js',
    mutate: replaceOnce('    topbar.classList.toggle("is-hidden", y > lastY);', ''),
    expectedReqs: ['REQ-RESP-03'],
    grep: '@responsive',
    projects: COMPACT,
  },
  {
    id: 'M-RESP-04',
    description: 'Header hides even when the visitor prefers reduced motion',
    file: 'script.js',
    mutate: replaceOnce(
      'if (!compact.matches || calm.matches || y < 120',
      'if (!compact.matches || y < 120',
    ),
    expectedReqs: ['REQ-RESP-03'],
    grep: '@responsive',
    projects: COMPACT,
  },
  {
    id: 'M-RESP-05',
    description: 'Nav tabs too wide to fit the row',
    file: 'styles.css',
    mutate: replaceOnce('    padding: 0 7px;', '    padding: 0 30px;'),
    expectedReqs: ['REQ-RESP-04'],
    grep: '@responsive',
    projects: COMPACT,
  },
  {
    id: 'M-RESP-06',
    description: 'Header hides on desktop too',
    file: 'script.js',
    mutate: replaceOnce(
      'if (!compact.matches || calm.matches || y < 120',
      'if (calm.matches || y < 120',
    ),
    // The hide transform is CSS-scoped to ≤820px, so the defect needs both halves to be visible:
    // the script hides on desktop AND the CSS rule applies at every width.
    extraChanges: [
      {
        file: 'styles.css',
        mutate: (source) =>
          `${replaceOnce('  .topbar.is-hidden { transform: translateY(-100%); }\n', '')(source)}\n.topbar.is-hidden { transform: translateY(-100%); }\n`,
      },
    ],
    expectedReqs: ['REQ-RESP-03'],
    grep: '@responsive',
    projects: ['desktop'],
  },

  // ---------- Links & assets ----------
  {
    id: 'M-LINK-01',
    description: 'Section id renamed (#stack → #tools): nav link points nowhere',
    file: 'index.html',
    mutate: replaceOnce(
      '<section class="section container" id="stack"',
      '<section class="section container" id="tools"',
    ),
    expectedReqs: ['REQ-LINK-01'],
    grep: '@links',
  },
  {
    id: 'M-LINK-02',
    description: 'Current nav link is never marked (aria-current)',
    file: 'script.js',
    mutate: replaceOnce('        a.setAttribute("aria-current", "true");\n', ''),
    expectedReqs: ['REQ-LINK-01', 'REQ-NAV-01'],
    grep: '@links|@nav',
  },
  {
    id: 'M-LINK-03',
    description: 'rel="noopener" dropped from a new-tab link',
    file: 'index.html',
    mutate: replaceOnce(
      '<a href="https://github.com/andrelkj/ZombiePlus" target="_blank" rel="noopener">',
      '<a href="https://github.com/andrelkj/ZombiePlus" target="_blank">',
    ),
    expectedReqs: ['REQ-LINK-02'],
    grep: '@links',
  },
  {
    id: 'M-LINK-04',
    description: 'Hero LinkedIn link points to the wrong profile',
    file: 'index.html',
    mutate: replaceOnce(
      '</a>\n          <a class="btn btn-ghost" href="https://www.linkedin.com/in/andrekj"',
      '</a>\n          <a class="btn btn-ghost" href="https://www.linkedin.com/in/andre-k"',
    ),
    expectedReqs: ['REQ-LINK-02'],
    grep: '@links',
  },
  {
    id: 'M-LINK-05',
    description: 'External link opens in the same tab',
    file: 'index.html',
    mutate: replaceOnce(
      '<a href="https://github.com/andrelkj/GravidadeZero" target="_blank" rel="noopener">',
      '<a href="https://github.com/andrelkj/GravidadeZero">',
    ),
    expectedReqs: ['REQ-LINK-02'],
    grep: '@links',
  },
  {
    id: 'M-LINK-06',
    description: 'Hero resume link points to a missing file',
    file: 'index.html',
    mutate: replaceOnce(
      'href="assets/Andre_Kreutzer_SDET_Resume.pdf" download>\n',
      'href="assets/resume.pdf" download>\n',
    ),
    expectedReqs: ['REQ-LINK-03'],
    grep: '@links',
  },
  {
    id: 'M-LINK-07',
    description: 'Resume file replaced by an HTML page',
    file: 'assets/Andre_Kreutzer_SDET_Resume.pdf',
    mutate: replaceWith('<!DOCTYPE html><html><body>Not found</body></html>'),
    expectedReqs: ['REQ-LINK-03'],
    grep: '@links',
  },
  {
    id: 'M-LINK-08',
    description: 'Favicon file truncated (invalid SVG)',
    file: 'assets/favicon.svg',
    mutate: (source) => source.slice(0, 60),
    expectedReqs: ['REQ-LINK-04'],
    grep: '@links',
  },
  {
    id: 'M-LINK-09',
    description: 'Contact email differs from the structured data',
    file: 'index.html',
    mutate: replaceOnce(
      '<a class="btn btn-primary" href="mailto:andre.kreutzer@outlook.com">',
      '<a class="btn btn-primary" href="mailto:andre@example.com">',
    ),
    expectedReqs: ['REQ-LINK-05'],
    grep: '@links',
  },

  {
    id: 'M-LINK-10',
    description: 'A course project link points to a repository that does not exist',
    file: 'index.html',
    mutate: replaceOnce(
      'href="https://github.com/andrelkj/ZombiePlus" target="_blank"',
      'href="https://github.com/andrelkj/ZombiePlus-archived" target="_blank"',
    ),
    // Real network: this mutant only runs the nightly @external check.
    expectedReqs: ['REQ-LINK-06'],
    grep: '@external',
  },

  // ---------- Navigation ----------
  {
    id: 'M-NAV-01',
    description: 'Bottom-of-page rule removed: last section never becomes current',
    file: 'script.js',
    mutate: replaceOnce(
      `    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      markActive(sections[sections.length - 1].id);
      return;
    }
`,
      '',
    ),
    expectedReqs: ['REQ-NAV-01'],
    grep: '@nav',
    projects: ['tablet', 'desktop'],
  },
  {
    id: 'M-NAV-02',
    description: 'Tab bar no longer scrolls to the current tab',
    file: 'script.js',
    mutate: replaceOnce(
      'navLinks.scrollTo({ left: a.parentElement.offsetLeft - 16, behavior: "smooth" });',
      '',
    ),
    expectedReqs: ['REQ-NAV-02'],
    grep: '@nav',
    projects: COMPACT,
  },
  {
    id: 'M-NAV-03',
    description: 'Footer year not computed (stays hardcoded)',
    file: 'script.js',
    mutate: replaceOnce(
      '  document.getElementById("year").textContent = new Date().getFullYear();\n',
      '',
    ),
    expectedReqs: ['REQ-NAV-03'],
    grep: '@nav',
  },
  {
    id: 'M-NAV-04',
    description: 'Previous nav link keeps aria-current (two current links)',
    file: 'script.js',
    mutate: replaceOnce('        a.removeAttribute("aria-current");\n', ''),
    expectedReqs: ['REQ-NAV-01'],
    grep: '@nav',
  },

  // ---------- Health ----------
  {
    id: 'M-HEALTH-01',
    description: 'JSON-LD sameAs LinkedIn profile differs from the linked one',
    file: 'index.html',
    mutate: replaceOnce(
      '"sameAs": ["https://www.linkedin.com/in/andrekj",',
      '"sameAs": ["https://www.linkedin.com/in/andre-k",',
    ),
    expectedReqs: ['REQ-HEALTH-03'],
    grep: '@smoke',
  },
  {
    id: 'M-HEALTH-02',
    description: 'JSON-LD becomes invalid JSON (trailing comma)',
    file: 'index.html',
    mutate: replaceOnce('"AI-assisted QA"]', '"AI-assisted QA"],'),
    expectedReqs: ['REQ-HEALTH-03'],
    grep: '@smoke',
  },
  {
    id: 'M-HEALTH-03',
    description: 'og:url points to another site',
    file: 'index.html',
    mutate: replaceOnce(
      '<meta property="og:url" content="https://andrelkj.github.io/" />',
      '<meta property="og:url" content="https://example.com/" />',
    ),
    expectedReqs: ['REQ-HEALTH-03'],
    grep: '@smoke',
  },
  {
    id: 'M-HEALTH-04',
    description: 'Theme toggle throws a runtime error',
    file: 'script.js',
    mutate: replaceOnce(
      '    store("theme", root.dataset.theme);',
      '    store("theme", root.dataset.theme); undefinedFn();',
    ),
    expectedReqs: ['REQ-HEALTH-02'],
    grep: '@smoke',
  },

  // ---------- Visual (Linux baselines only) ----------
  {
    id: 'M-VIS-01',
    description: 'Hero buttons spaced 14px apart instead of 8px',
    file: 'styles.css',
    mutate: replaceOnce(
      '.cta-row { display: flex; flex-wrap: wrap; gap: 8px;',
      '.cta-row { display: flex; flex-wrap: wrap; gap: 14px;',
    ),
    expectedReqs: ['REQ-VIS-01'],
    grep: '@visual',
    projects: ALL_DEVICES,
    platform: 'linux',
  },
  {
    id: 'M-VIS-02',
    description: 'Light accent green darkened (still passes contrast)',
    file: 'styles.css',
    mutate: replaceOnce('  --accent: #15803d;', '  --accent: #166534;'),
    expectedReqs: ['REQ-VIS-01'],
    grep: '@visual',
    projects: ALL_DEVICES,
    platform: 'linux',
  },
  {
    id: 'M-VIS-03',
    description: 'Card corner radius 14px → 4px',
    file: 'styles.css',
    mutate: replaceOnce('  --radius: 14px;', '  --radius: 4px;'),
    expectedReqs: ['REQ-VIS-01'],
    grep: '@visual',
    projects: ALL_DEVICES,
    platform: 'linux',
  },
];

/**
 * Lists mutants that no longer apply to the current site (target text gone, or no change).
 * `read` returns a site file's current content. Empty result: the catalog matches the site.
 */
export function findCatalogProblems(
  mutants: readonly Mutant[],
  read: (file: SiteFile) => string,
): string[] {
  const problems: string[] = [];
  for (const mutant of mutants) {
    for (const change of [mutant, ...(mutant.extraChanges ?? [])]) {
      const source = read(change.file);
      try {
        if (change.mutate(source) === source) {
          problems.push(`${mutant.id}: ${change.file} unchanged`);
        }
      } catch (error) {
        problems.push(`${mutant.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  return problems;
}
