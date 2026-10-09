---
name: pw-write-test
description: Write or extend Playwright tests in this repo (andrelkj.github.io) from requirement IDs, following its fixtures, page object, locator policy and requirement tagging, and prove each new test can fail with a catalog mutant. Use whenever the user asks to add, generate, automate, cover or extend a test or spec, mentions a REQ-ID that needs a test, changes the site and needs coverage for it, or asks "is this covered?" and the answer is no, even if they don't say "Playwright".
---

# Write a test

A test here is done when it is **readable, tagged with the requirement it proves, stable, and shown to fail** when the defect it guards against happens. Passing on a healthy site is the easy half; the mutant proves it's worth keeping.

Read `references/conventions.md` before writing code. It has the fixture API, page object members, locator policy and the helpers to reuse.

## Workflow

### 1. Start from a requirement

Find the REQ-ID in `docs/REQUIREMENTS.md`. If there isn't one, run the `qa-plan` skill first (or add the row yourself, with the next free number in the right area, if it's a one-liner the user already described). A test without a requirement fails `npm run coverage:check`, and a requirement without a test does too.

### 2. Look before you write

Check what the page really does before asserting anything:

- Read the relevant part of `index.html` / `script.js` / `styles.css`.
- If the Playwright test MCP server is available (`.mcp.json`), use `browser_snapshot` to see roles and accessible names, and `browser_generate_locator` for a candidate locator. Otherwise write a throwaway probe spec in `tests/specs/zz-probe.spec.ts` that logs what you need. Delete it afterwards; it must never be committed.
- Check both languages and the relevant viewports. Many surprises in this repo were viewport- or language-specific (e.g. the PT tab bar overflows at 320px, EN doesn't).

### 3. Write it

Put the test in the area's spec file, inside its tagged `describe`:

```ts
import { expect, req, test } from '../fixtures/test';

test.describe('theme', { tag: '@theme' }, () => {
  test(
    'the chosen theme survives a reload',
    { annotation: req('REQ-THEME-03') },
    async ({ page, portfolio }) => {
      await portfolio.goto();
      await portfolio.toggleTheme();

      await page.reload();

      await expect(portfolio.html).toHaveAttribute('data-theme', 'light');
    },
  );
});
```

- New element → add the locator to `tests/pages/portfolio.page.ts` and to the locator contract (`tests/self-test/page-object.spec.ts`).
- New expected value (copy, URL, allowlist entry) → put it in `tests/data/` with a reason.
- New reusable check → a helper in `tests/support/` with a self-test that shows it failing on a bad fixture page.

### 4. Make it stable

```bash
npm run check
npx playwright test tests/specs/<file>.spec.ts --repeat-each=5
```

Zero flaky runs. If it flakes, find the state you're racing (animation, resize handler, smooth scroll) and wait for that state. Never add a sleep or raise a timeout. Visual tests only run on Linux: confirm them with the Tests workflow (`repeat_each`, `grep=@visual`).

### 5. Prove it can fail

Add the defect this test guards against to `scripts/mutate/mutants.ts`:

```ts
{
  id: 'M-THEME-06',
  description: 'What a visitor would experience',
  file: 'script.js',
  mutate: replaceOnce('exact snippet that appears once', 'broken version'),
  expectedReqs: ['REQ-THEME-03'],
  grep: '@theme',
  projects: ['desktop'], // optional; the viewports where the defect shows
},
```

Then:

```bash
npm run mutate -- --only M-THEME-06
```

It must print `caught`. If it says `survived`, the test is too weak: strengthen it, don't delete the mutant. If `caught-elsewhere`, either the test isn't tagged with the requirement or `expectedReqs` is wrong. Fix whichever is actually wrong.

### 6. Update the traceability

```bash
npm run coverage   # regenerates docs/COVERAGE.md
npm run coverage:check
```

### 7. Commit

One concern per commit; generated files (COVERAGE.md, baselines) in their own commit. The commit body states **What**, **Why** (REQ-IDs), **Verified** (commands + counts, and the mutant that proved it), **Look at** (the 1–3 lines most worth a reviewer's time).

## Things that look helpful but aren't

- Asserting a CSS class or internal variable: tests the implementation, not what a visitor sees. Assert attributes, accessible names, text, viewport position.
- `expect(await x.textContent()).toBe(…)`: no retry, so it flakes. Use web-first matchers.
- Copying a locator from DevTools: brittle. Use role + accessible name, or the target `href`.
- Testing only EN or only desktop when the behavior differs by language or width.
- Loosening `tests/data/` (exceptions, allowlists) so a new test passes: hides a real problem. If a site issue blocks the test, report it instead.
