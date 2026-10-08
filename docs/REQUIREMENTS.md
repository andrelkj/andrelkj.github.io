# Requirements

This file is the source of truth for **what the suite validates**. Each requirement has an ID. Every test carries the IDs it proves in a `req` annotation (`annotation: { type: 'req', description: 'REQ-…' }`), so any requirement can be traced to its tests and any test back to a requirement.

Unless a requirement says otherwise, it must hold on every project: **mobile** (375 px, WebKit), **tablet** (768 px, WebKit) and **desktop** (1280 px, Chromium).

Which tests prove each requirement is generated into `docs/COVERAGE.md` (phase 6).

## Health

| ID            | Requirement                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-HEALTH-01 | The page loads with its title, a `main` landmark and the `h1` with André's name.                                                                               |
| REQ-HEALTH-02 | The page logs no console errors, throws no uncaught exceptions, and every same-origin request succeeds. (Also enforced on every test by the page error guard.) |
| REQ-HEALTH-03 | Search and social metadata are present: meta description, canonical URL, Open Graph title/description/url, and valid JSON-LD `Person` data.                    |

## Accessibility

| ID          | Requirement                                                                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-A11Y-01 | axe finds **zero** violations (WCAG 2.2 AA + best practices) in every theme × language combination. Accepted exceptions must be scoped and unexpired (`tests/data/axe-exceptions.ts`). |
| REQ-A11Y-02 | The skip link is the first keyboard stop, becomes visible when focused, and moves focus to the main content.                                                                           |
| REQ-A11Y-03 | Header controls (nav links, language buttons, theme toggle) can be reached by keyboard and show a visible focus outline.                                                               |

## Theme

| ID           | Requirement                                                                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-THEME-01 | A first-time visitor gets the dark theme, even when the OS prefers light. (Documents current behavior: the site doesn't follow `prefers-color-scheme`.)              |
| REQ-THEME-02 | The theme toggle switches dark ↔ light and shows the matching icon. Its accessible name describes the next action ("Switch to light theme") in the current language. |
| REQ-THEME-03 | The chosen theme is remembered after a reload and applied before the page renders (no flash of the other theme).                                                     |
| REQ-THEME-04 | Text meets WCAG AA color contrast in both themes (axe `color-contrast`, reported separately from REQ-A11Y-01 so a contrast regression is named explicitly).          |

## Languages (EN / PT-BR)

| ID          | Requirement                                                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-I18N-01 | Every translatable text is translated to PT. Texts that are meant to read the same in both languages are listed with a reason (`tests/data/i18n-same-in-both.ts`), and that list can't go stale.        |
| REQ-I18N-02 | Switching language updates `html[lang]` (`en` / `pt-BR`), the pressed state of the EN/PT buttons, and the accessible names of the language group and theme toggle.                                      |
| REQ-I18N-03 | English shows exactly the text authored in `index.html` (markup included), on first load and after switching PT → EN.                                                                                   |
| REQ-I18N-04 | The chosen language is remembered after a reload.                                                                                                                                                       |
| REQ-I18N-05 | A first-time visitor whose browser language is Portuguese gets PT. Anyone else gets EN.                                                                                                                 |
| REQ-I18N-06 | Key headings read exactly as expected in each language (catches swapped or wrong translations that the parity check can't see).                                                                         |
| REQ-I18N-07 | Text without a translation key (including screen-reader labels) is limited to an approved list of names, tools and code (`tests/data/i18n-fixed-text.ts`), so new copy can't silently skip translation. |

## Responsive layout

| ID          | Requirement                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-RESP-01 | Nothing sticks out past the right edge of the screen (no sideways scroll and no cut-off content) in EN and PT.                                           |
| REQ-RESP-02 | At ≤ 820 px the section links form a tab bar where every tab is at least 44 px tall.                                                                     |
| REQ-RESP-03 | At ≤ 820 px the header hides when scrolling down and comes back when scrolling up. It never hides on desktop or when the visitor prefers reduced motion. |
| REQ-RESP-04 | All primary nav links are visible without scrolling the nav row, in EN and PT.                                                                           |

## Links and assets

| ID          | Requirement                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REQ-LINK-01 | Every in-page link (`#id`) points at an existing section. Following a nav link brings that section into view and marks the link as current.            |
| REQ-LINK-02 | External links go to the expected destinations (`tests/data/links.ts`), open in a new tab, and use `rel="noopener"`. No external link uses plain http. |
| REQ-LINK-03 | Every resume link downloads a real PDF (HTTP 200, `application/pdf`, starts with `%PDF`).                                                              |
| REQ-LINK-04 | Every icon declared with `<link rel="icon">` loads (HTTP 200) with the content type it declares. An SVG icon must be a valid `<svg>` document.         |
| REQ-LINK-05 | The contact email link and the email in the JSON-LD data are the same address.                                                                         |
| REQ-LINK-06 | External destinations are actually reachable (nightly, real network). _Planned: phase 9._                                                              |

## Navigation

| ID         | Requirement                                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| REQ-NAV-01 | While scrolling, the nav marks the section currently being read as current (`aria-current`), down to the last section at the bottom of the page. |
| REQ-NAV-02 | On the mobile tab bar, the current tab is scrolled into view.                                                                                    |
| REQ-NAV-03 | The footer shows the current year.                                                                                                               |

## Visual

| ID         | Requirement                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| REQ-VIS-01 | The page looks as approved (screenshot baselines) on every project in both themes. _Planned: phase 5._ |

## The site's own QA report → requirements

The page's "Checks run on this site" panel makes seven claims. This is where each one is proven:

| Claim on the site                                                                        | Proven by                                                        |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| axe-core scan, WCAG 2.2 AA + best practices, 0 violations, dark and light                | REQ-A11Y-01, REQ-THEME-04                                        |
| Layout at 375 / 768 / 1280 px: no horizontal overflow                                    | REQ-RESP-01                                                      |
| Every mobile nav tab ≥ 44 px tall                                                        | REQ-RESP-02                                                      |
| EN / PT-BR: every string translated, nav fits in both languages                          | REQ-I18N-01, REQ-I18N-07, REQ-RESP-04                            |
| Active section correct to the last one; header hide/show, keyboard focus, reduced motion | REQ-NAV-01, REQ-RESP-03, REQ-A11Y-02, REQ-A11Y-03                |
| Links and assets resolve (resume PDF, icon); no console errors                           | REQ-LINK-01…05, REQ-HEALTH-02                                    |
| Content: claims checked against the resume; scan for internal jargon                     | Not automated: this is an editorial review, not a page behavior. |
