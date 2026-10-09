# Review checklist

Each item says what to look for and why it matters. Severity guide: **blocker** = can make a green run lie, or breaks CI/trust gates; **major** = flakiness, wrong coverage, maintainability debt that will bite soon; **minor** = readability, conventions; **nit** = taste.

## Contents

1. Trust (read first)
2. Playwright practices
3. Locators and the page object
4. TypeScript
5. JavaScript / async
6. Data, docs and traceability
7. CI and workflows
8. Site changes

## 1. Trust (read first)

These are the changes that can make a green run lie. Look for them in every diff.

- **Weakened assertion** (blocker): an assertion removed, `toEqual` → `toContain`/`toBeTruthy`, exact text → regex, count check dropped, `.not` added. Ask: would the mutants for this requirement still be caught? Run `npm run mutate -- --only <IDs for that area>`.
- **Expected value changed in `tests/data/`** (blocker unless justified): copy, links, allowlists, axe exceptions. Legit when the site changed on purpose; then the site diff must be in the same PR. Otherwise it's hiding a defect.
- **Exception without reason, owner or expiry** (blocker): axe exceptions must be rule+selector scoped and expire; same-in-both / fixed-text entries need a reason.
- **New skip / fixme / only** (blocker if unconditional): `test.skip(...)` must be conditional with a reason (viewport/platform). `.only` is blocked by `forbidOnly` in CI but shouldn't reach a PR.
- **Timeout raised or retries added to make a test pass** (major): masks a race; find the state to wait for instead.
- **`allowedPageErrors` widened** (major): a broad pattern hides real console errors. It must be narrow and explained next to the `test.use`.
- **Visual baselines changed** (blocker unless reviewed): PNG changes need a stated reason and must come from the Linux container (Tests workflow `update_snapshots`), in their own commit.
- **Mutant catalog weakened** (blocker): a mutant removed, its `expectedReqs` widened, or `grep`/`projects` narrowed so it "passes".

## 2. Playwright practices

Source: https://playwright.dev/docs/best-practices

- Tests isolated: no shared state between tests, no order dependence; each test calls `portfolio.goto()`.
- Test user-visible behavior: roles, accessible names, text, viewport position. Not CSS classes or JS internals.
- Web-first assertions only (`await expect(locator).toX()`); no `expect(await locator.x())` (no retry, so it flakes).
- No `waitForTimeout`, `networkidle`, `page.$`, element handles, `force: true` (lint catches most; flag disable comments).
- Third-party dependencies stubbed with `route` (external links already are).
- `test.step` used for multi-stage tests; titles read as behavior.
- Soft assertions only where listing every failure helps (e.g. locator contract).

## 3. Locators and the page object

- Raw selectors only in `tests/pages/` and inside `page.evaluate` in helpers.
- Locator priority: role/label/text → target attribute (href) → `data-i18n` (i18n helpers only).
- Language-independent: works in EN and PT (match `href` or an EN|PT pattern).
- New page-object locator added to the locator contract (`tests/self-test/page-object.spec.ts`).
- No positional locators (`nth`, `first`, `last`) in specs.

## 4. TypeScript

Source: https://www.typescriptlang.org/docs/handbook/ (and tsconfig `strict`)

- No `any`, no non-null `!`, no `as unknown as`; narrow with type guards.
- `import type` for type-only imports (verbatimModuleSyntax).
- `readonly` for data and props that shouldn't change; `as const` for literal tables.
- Exported functions have explicit return types (lint) and JSDoc that says why.
- Union types over boolean flags when there are more than two states.
- No new `eslint-disable` / `@ts-expect-error` without a comment explaining why.

## 5. JavaScript / async

Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises

- Every promise awaited or returned (lint: no-floating-promises). Watch `forEach(async …)`: it doesn't wait; use `for…of`.
- Event listeners registered before the action that triggers them (`waitForEvent` promise created before `click`).
- `const` by default, `===`, optional chaining over `&&` chains.
- No mutation of shared module-level state from tests.

## 6. Data, docs and traceability

- Every new test has `annotation: req(...)` and an area tag; `npm run coverage:check` passes.
- New requirement rows are observable and specific (see `qa-plan`).
- `docs/COVERAGE.md` regenerated in its own commit.
- New defect class → new mutant in `scripts/mutate/mutants.ts`, caught.
- README / REQUIREMENTS updated when behavior or commands change.
- Commit messages: What / Why (REQ) / Verified (commands + counts + mutant) / Look at.

## 7. CI and workflows

- Action versions pinned to a major; container image matches `@playwright/test` version (a drift guard exists in tests.yml).
- Inputs passed through `env:`, not inlined into `run:` (script injection).
- `permissions:` minimal (`contents: read`).
- Nothing in CI commits files (baselines, TRUST.md, COVERAGE.md are committed by a person).

## 8. Site changes

When index.html / script.js / styles.css change in the same PR:

- New visible text has a `data-i18n` key and a PT value, or is added to `i18n-fixed-text.ts` with a reason.
- New `aria-label` has `data-i18n-label` + PT value.
- Mutant catalog still applies (`tests/self-test/mutation.spec.ts` catalog check).
- Visual baselines regenerated if the change is visible, and reviewed.
