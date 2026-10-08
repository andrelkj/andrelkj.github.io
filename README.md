# andrelkj.github.io

The portfolio site of **André Kreutzer**, Sr. QA Engineer / SDET, and the **AI-assisted Playwright suite that tests it**.

Live: https://andrelkj.github.io/

The site makes claims about itself: it's accessible, it works on phones, tablets and desktops, it's fully translated to Portuguese, and its links work. This repository turns those claims into automated, traceable checks, built with an AI pair (Claude Code) and designed so a green run can be trusted **without reading the test code**.

## Why trust a green run

Generated tests are only useful if you can tell they would actually fail when the site breaks. The suite is built around that:

| Practice                          | What it gives you                                                                                                                                                                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Requirements first**            | [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) states in plain language what is validated (31 IDs) and maps each claim in the site's "Checks run on this site" panel to them. Every test is tagged with the IDs it proves.                                                                              |
| **Deliberate breakage (mutants)** | For every spec, the site was broken on purpose, one change at a time (low contrast, a missing translation, a broken resume link, a theme flash…), and the intended test had to fail with a readable message. Mutants that slipped through led to stronger tests. Each commit message lists its mutants. |
| **Tests for the tests**           | Every helper (axe scan, overflow finder, translation parity, link checks) has self-tests showing it reports a known-bad page, not just that it passes on a good one.                                                                                                                                    |
| **Locator contract**              | Every page-object locator must match exactly one element in EN and in PT, so markup drift is named the moment it happens.                                                                                                                                                                               |
| **No silent errors**              | Every test fails if the page logs a console error, throws, or a same-origin request fails.                                                                                                                                                                                                              |
| **Flake gate**                    | CI fails on flaky tests (`failOnFlakyTests`). New specs are run repeatedly (`--repeat-each`) before they land.                                                                                                                                                                                          |
| **Machine-checked style**         | Strict TypeScript, typescript-eslint and eslint-plugin-playwright enforce the locator policy (no CSS/XPath or `nth()` in specs, no sleeps, no `force`) instead of leaving it to review.                                                                                                                 |

## What is tested

Every requirement runs on **mobile** (375 px, WebKit), **tablet** (768 px, WebKit) and **desktop** (1280 px, Chromium).

| Area              | Highlights                                                                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accessibility     | axe-core with WCAG 2.2 AA + best practices: zero violations in dark/light × EN/PT. Skip link, keyboard focus order, visible focus outline.                                                   |
| Theme             | Dark by default, toggle with localized label, choice remembered **and applied before first paint** (no flash), color contrast per theme.                                                     |
| Languages         | Every text translated (including screen-reader labels), English matches the authored HTML, choice remembered, PT auto-detected from the browser, exact copy for nav and headings.            |
| Responsive        | Nothing cut off or scrolling sideways, 44 px tap targets on the tab bar, header hides on scroll (but not with reduced motion or on desktop).                                                 |
| Links & assets    | In-page anchors, expected external destinations (stubbed, so third parties can't fail the run), `noopener`, the resume is a real PDF, icons load, contact email matches the structured data. |
| Navigation        | Current section highlighted while scrolling, tab bar follows on narrow phones, footer year computed.                                                                                         |
| Health (`@smoke`) | Loads cleanly, no errors while used, complete search/social metadata and JSON-LD. Also runs against the live site.                                                                           |

## Run it

Requires Node 22+.

```bash
npm ci
npx playwright install chromium webkit
```

```bash
npm test
```

| Command                                                  | What it does                                                         |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| `npm test`                                               | Full suite against a local server on `:4173` (started automatically) |
| `npm run test:smoke`                                     | `@smoke` tests only                                                  |
| `BASE_URL=https://andrelkj.github.io npm run test:smoke` | Smoke tests against the live site                                    |
| `npm run test:ui`                                        | Playwright UI mode                                                   |
| `npm run report`                                         | Open the last HTML report (traces and axe results attached)          |
| `npm run check`                                          | Typecheck, lint and format check                                     |
| `npm run serve`                                          | Serve the site locally on http://localhost:4173                      |

## Project layout

```
index.html, styles.css, script.js, assets/   the site (no build step)
docs/REQUIREMENTS.md                         what is validated, by ID
docs/CHANGELOG-TESTS.md                      how the suite grew, phase by phase
tests/specs/                                 one spec per area, tagged with REQ-IDs
tests/pages/portfolio.page.ts                the only file that knows the page structure
tests/fixtures/test.ts                       `test` with theme/lang options and the error guard
tests/support/                               helpers (axe, layout, i18n, links, keyboard…)
tests/data/                                  expected values and approved exceptions, each with a reason
tests/self-test/                             tests for the helpers and the locator contract
.github/workflows/                           tests on every PR, Pages deploy
```

## Writing a test

1. Add or find the requirement in `docs/REQUIREMENTS.md`.
2. Import `test`, `expect` and `req` from `tests/fixtures/test.ts`. Tag the test with `annotation: req('REQ-…')` and an area tag (`@a11y`, `@i18n`…).
3. Locate elements through the page object, role-first (`getByRole`, `getByLabel`). Raw selectors live only in `tests/pages/`.
4. Use web-first assertions and `test.step` for readable reports. Never use sleeps.
5. Prove it: run it with `--repeat-each=5`, then break the site the way the requirement guards against and confirm the test fails. Note the mutant in the commit message.

Exceptions are explicit data, never silent: accepted axe findings (`tests/data/axe-exceptions.ts`, scoped and expiring), texts identical in EN and PT (`i18n-same-in-both.ts`, `i18n-fixed-text.ts`). Each entry needs a reason, and stale entries fail the suite.

## Editing site content

Edit the English text in `index.html`, then add or update the matching `data-i18n` key in the `PT` dictionary in `script.js`. Screen-reader labels work the same way: an element with `aria-label` gets a `data-i18n-label` key.
Text that stays identical in both languages (names, tools, code) has no key and must be on the approved list in `tests/data/i18n-fixed-text.ts`, otherwise the i18n tests fail.

## Visual baselines

Screenshots (first screen + full page, dark and light, on every device) are compared with reviewed baselines in `tests/specs/visual.spec.ts-snapshots/`. Font rendering differs between operating systems, so baselines are **Linux-only**: they're generated and compared inside the pinned Playwright container in CI. On macOS and Windows the visual tests are skipped with a reason.

To update baselines after an intentional design change:

1. In GitHub Actions, run the **Tests** workflow on your branch with `update_snapshots` checked. (A new screenshot with no baseline is also written automatically on any run.)
2. Download the `visual-baselines` artifact and **look at every image**: a baseline is an approval.
3. Copy the PNGs into `tests/specs/visual.spec.ts-snapshots/` and commit them in their own commit.

CI never commits baselines by itself. `VISUAL_LOCAL=1 npm test` runs the visual tests locally against git-ignored, machine-specific baselines, for experiments only.

## CI and deploy

- **Every PR** runs `.github/workflows/tests.yml` inside the pinned Playwright container: typecheck, lint, format check and the full suite. The HTML report is uploaded as an artifact.
- **Every push to `main`** runs `.github/workflows/deploy.yml`, which publishes only the site files to GitHub Pages (Settings → Pages → Source: GitHub Actions).

## How it's built

The suite is developed in phases, one pull request per phase, in small commits. Each commit message says what changed, why, how it was verified and which mutants it catches. AI does the research, code and browser runs. André sets direction, makes content decisions and reviews every PR.

| Phase                                                                                                    | Status       |
| -------------------------------------------------------------------------------------------------------- | ------------ |
| 1. Scaffold: tooling, config, CI                                                                         | ✅ Done      |
| 2. Infrastructure: fixtures, page object, self-tested helpers                                            | ✅ Done      |
| 3. Requirements and specs                                                                                | ✅ Done      |
| 4. Visual baselines (screenshots per device × theme)                                                     | 🔄 In review |
| 5. Coverage matrix: CI fails if a requirement has no test, or a test has no requirement                  | Planned      |
| 6. Automated mutation runner and `docs/TRUST.md` scorecard                                               | Planned      |
| 7. Claude Code skills (`qa-plan`, `pw-write-test`, `pw-review`, `pw-heal`, `a11y-triage`, `trust-audit`) | Planned      |
| 8. Deploy gated on tests, post-deploy smoke, nightly external link check                                 | Planned      |

Planned skills follow one rule for self-healing: a fix may change **how** an element is found, never **what** is expected. Locator fixes are proposed with evidence and approved by a human, never applied silently at runtime.
