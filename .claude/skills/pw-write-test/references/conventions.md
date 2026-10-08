# Test conventions (andrelkj.github.io)

The single reference for how tests in this repo are written. `pw-write-test` follows it, `pw-review` checks against it, `pw-heal` must not break it.

## Contents

1. Where things live
2. The `test` fixture
3. The page object
4. Locator policy
5. Assertions and waiting
6. Tags, requirements and titles
7. Data and exceptions
8. Viewport-specific tests
9. Helpers you should reuse
10. Self-tests
11. TypeScript and JavaScript rules

## 1. Where things live

| Path                            | Holds                                                                                | Raw selectors allowed?      |
| ------------------------------- | ------------------------------------------------------------------------------------ | --------------------------- |
| `tests/specs/*.spec.ts`         | One spec per area (a11y, theme, i18n, responsive, links, navigation, health, visual) | No (lint enforces)          |
| `tests/pages/portfolio.page.ts` | `PortfolioPage` + `TopBar`: the only file that knows the page structure              | Yes                         |
| `tests/fixtures/test.ts`        | The project's `test`, `expect`, `req()`                                              | n/a                         |
| `tests/support/*.ts`            | Reusable checks (axe, overflow, i18n, links, keyboard, metadata…)                    | Yes, inside `page.evaluate` |
| `tests/data/*.ts`               | Expected values and approved exceptions, each with a reason                          | n/a                         |
| `tests/self-test/*.spec.ts`     | Tests for the helpers, the locator contract, coverage and mutation logic             | Yes                         |
| `docs/REQUIREMENTS.md`          | What is validated, by REQ-ID                                                         | n/a                         |

## 2. The `test` fixture

Always `import { expect, req, test } from '../fixtures/test';`, never from `@playwright/test` in specs.

| Name                | Kind                                | Use                                                                                                           |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `portfolio`         | fixture                             | `PortfolioPage` for the current page. Call `await portfolio.goto()` first.                                    |
| `theme`             | option, `'dark' \| 'light' \| null` | `test.use({ theme: 'light' })` seeds `localStorage` once via storageState. `null` = site default.             |
| `lang`              | option, `'en' \| 'pt' \| null`      | Same for language. `null` lets the site auto-detect from `locale`.                                            |
| `allowedPageErrors` | option, `RegExp \| null`            | Narrow pattern of page errors a test expects. A single RegExp: `test.use` reads arrays as `[value, options]`. |
| `pageErrorGuard`    | auto fixture                        | Fails any test that logged `console.error`, threw, or had a same-origin request fail.                         |

Theme/lang are seeded with storageState (once per context), not `addInitScript`, so reloads keep what the site saved. Don't change that without a reason: it would hide persistence bugs.

## 3. The page object

`portfolio.goto()` waits for script.js init and for finite intro animations. Never add a sleep after it.

Members: `html` (carries `data-theme`, `lang`), `main`, `heading` (h1), `sectionHeadings`, `skipLink`, `footer`, `footerYear`, `section(id)`, `linksTo(href)`, and the methods `scrollTo(y)`, `scrollToSection(id)`, `scrollToBottom()`, `switchLanguage(lang)`, `toggleTheme()`, `waitForIntroAnimations()`, `webFontsLoaded()`, `expandViewportToFullPage()`.
`topBar`: `root`, `nav`, `navLinks`, `currentNavLink`, `navLink(section)`, `languageSwitch`, `languageButton(lang)`, `themeToggle`, `themeIcon('sun' | 'moon')`.
Constants: `NAV_SECTIONS`, `SECTIONS`, `COMPACT_MAX_WIDTH` (820).

New locator → add it to the page object **and** to the locator contract in `tests/self-test/page-object.spec.ts` (it must match exactly one element in EN and PT).

## 4. Locator policy

1. `getByRole` / `getByLabel` / `getByText`: preferred. Role locators double as accessibility checks.
2. Language-independent where the page is bilingual: match the target (`a[href="#about"]`) or an EN|PT pattern (`/^(Language|Idioma)$/`), not one language's text.
3. `[data-i18n="…"]` only inside i18n helpers (it is the contract they test).
4. In specs: no CSS classes, XPath, `nth()/first()/last()`, `page.$`, `force: true`. ESLint (`playwright/no-raw-locators`, `no-nth-methods`, `no-force-option`) fails the build.

## 5. Assertions and waiting

- Web-first assertions (`await expect(locator).toHaveText(…)`), which retry. Never `expect(await locator.textContent())`.
- No `waitForTimeout`, no `networkidle`. Wait for an observable state instead (`waitFor`, `toBeInViewport`, `expect.poll`).
- Group multi-stage tests with `test.step('what a visitor does / sees', …)` so the report reads like a script.
- Assert what a visitor sees or a screen reader hears (attributes, accessible names, viewport position), not implementation details (class names, internal variables).
- Third parties are stubbed (`context.route`) so their outages can't fail the suite; real reachability is the nightly REQ-LINK-06 job.

## 6. Tags, requirements and titles

- Every test sits inside a `test.describe` (lint) whose tag names the area: `@a11y @theme @i18n @responsive @links @nav @smoke @visual`. The mutation runner selects tests by these tags.
- Every test has `annotation: req('REQ-AREA-NN')`. `npm run coverage:check` fails on an untagged test or an unknown ID.
- Titles describe behavior in plain language: `'the chosen theme survives a reload and is applied before the page renders'`.
- Generate per-variant tests with loops over typed data (`THEME_LANG_MATRIX`, `LANGS`), with the variant in the describe title.

## 7. Data and exceptions

Expected values live in `tests/data/` so changes show up as reviewable diffs:
`copy.ts` (exact strings), `links.ts` (external destinations), `i18n-same-in-both.ts`, `i18n-fixed-text.ts`, `axe-exceptions.ts`.
Every exception entry has a reason; axe exceptions are scoped to rule **and** selector and expire. Stale entries fail the suite. Never widen an exception to make a test pass without a reason a reviewer would accept.

## 8. Viewport-specific tests

Use a describe-level skip with a reason, so the report says why:

```ts
test.skip(
  ({ viewport }) => (viewport?.width ?? 0) > COMPACT_MAX_WIDTH,
  'tab bar exists only at ≤ 820 px',
);
```

Visual tests skip off Linux (baselines are Linux-only).

## 9. Helpers you should reuse

| Need                                | Helper                                                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| axe scan → readable lines           | `scanA11y(page, testInfo, { rules? })` (support/axe.ts)                                                                                |
| Content cut off / sideways scroll   | `findHorizontalOverflow(page)` (support/layout.ts)                                                                                     |
| EN/PT parity                        | `readTranslations`, `findTranslationGaps`, `readAuthoredTranslations`, `readUnkeyedTexts`, `findUntranslatedUnkeyed` (support/i18n.ts) |
| Links                               | `collectLinks`, `findUnsafeLinks`, `findBrokenAnchors`, `collectIcons`, `svgRootName` (support/links.ts)                               |
| Keyboard                            | `collectFocusStops(page, n, tabKey(browserName))` (support/keyboard.ts)                                                                |
| Head metadata / JSON-LD             | `readMetadata`, `sameAsUrls` (support/metadata.ts)                                                                                     |
| Horizontal visibility in a scroller | `isFullyVisibleInScroller` (support/nav.ts)                                                                                            |
| Themes / languages                  | `THEMES`, `LANGS`, `HTML_LANG`, `THEME_LANG_MATRIX` (support/types.ts)                                                                 |

A new helper needs a self-test with one passing and one failing fixture page: a helper that can't fail proves nothing.

## 10. Self-tests

`tests/self-test/` runs in the `self-test` project (Desktop Chrome). Use `page.setContent(...)` for fixture pages. Pure logic (coverage, mutation) uses plain `@playwright/test` with no page.

## 11. TypeScript and JavaScript rules

Enforced by `tsc --strict` + typescript-eslint `strictTypeChecked`:

- no `any`, no non-null `!`, `import type` for types, named exports, `readonly` data;
- every promise awaited (no floating promises);
- `const` by default, `===`;
- JSDoc on exported helpers explaining **why**;
- comments explain decisions, not what the code does.
