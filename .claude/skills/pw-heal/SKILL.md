---
name: pw-heal
description: Triage and repair a failing or flaky Playwright test in this repo (andrelkj.github.io). Classify it as product bug, locator drift, test bug, flake or environment, and propose an evidence-backed fix for human approval that may change HOW elements are found but never WHAT is expected. Use whenever a test fails, CI is red, a test is flaky, a locator broke after a site change, the user says "fix the test", "heal", "why is this failing", or pastes a Playwright error, trace or CI log.
---

# Heal a failing test

A red test is a signal before it is a problem. Most "self-healing" tools make the signal go away; this skill makes sure that when a test turns green again, it's because the **site** is right, not because the test stopped looking.

## The rule

**Healing may change how an element is found. It never changes what is expected.**

| Allowed as a heal                                                                              | Not a heal: needs the user's explicit decision                         |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| A locator in `tests/pages/portfolio.page.ts` that no longer matches (same element, new markup) | Expected text, URL, count or attribute in a spec or `tests/data/`      |
| Waiting for the real state the test raced (resize handler, animation, smooth scroll)           | Adding entries to allowlists, `axe-exceptions.ts`, `allowedPageErrors` |
| Fixing a test bug that made it check the wrong thing, with the stronger check kept             | `test.skip`, `test.fixme`, `.only`, raising timeouts or retries        |
|                                                                                                | Updating visual baselines or COPY because "the site changed"           |

Playwright's stock `playwright-test-healer` agent is deliberately **not** used in this repo: it edits expected values, marks tests `fixme` and never asks. Use its MCP tools (`test_debug`, `browser_snapshot`, `browser_generate_locator`) under this skill's rules instead.

## Workflow

### 1. Collect the evidence

- The error message and the failing step.
- `test-results/<test>/error-context.md`: the page's aria snapshot at the failure. It's usually the fastest way to see what changed.
- The trace: `npx playwright show-trace test-results/<test>/trace.zip`.
- From CI: `gh run download <run-id> -n test-results` (uploaded on failure) or `-n playwright-report`.
- What changed: `git log -p --since=<last green> -- index.html script.js styles.css tests`.

### 2. Reproduce

```bash
npx playwright test <file>:<line> --project=<project> --repeat-each=5
```

Fails 5/5 → deterministic. Fails sometimes → flake (go to step 3, "flake"). Passes locally but fails in CI → environment, or Linux-only (visual).

### 3. Classify

| Class                    | Signs                                                                                      | What to do                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product bug**          | The site misbehaves for a visitor: missing translation, broken link, contrast, wrong state | **Don't touch the test.** Write a bug report (below). The test stays red until the site is fixed.                                              |
| **Intended site change** | The site changed on purpose (new copy, new link) and the test expects the old value        | Not a heal. Show the user the old/new values and ask; on approval update `tests/data/` (and baselines via the CI flow) in a separate commit.   |
| **Locator drift**        | Same element and behavior, different markup; the locator contract self-test fails too      | Heal (step 4).                                                                                                                                 |
| **Test bug**             | The test checks the wrong thing, or relies on an accident                                  | Fix so it checks the right thing at least as strictly; prove with a mutant.                                                                    |
| **Flake**                | Passes on retry; diff images or timing vary                                                | Find the raced state and wait for it (the tablet full-page flake was a resize handler marking "Contact" current between shots). Never a sleep. |
| **Environment**          | Fonts didn't load, network to a third party, CI image drift                                | Fix the environment or the stub; the version-drift guard in tests.yml covers image drift.                                                      |

### 4. Heal locator drift

1. Find the new element: `browser_snapshot` / `browser_generate_locator` (MCP), or the aria snapshot in `error-context.md`.
2. Pick the most stable locator: role + accessible name, language-independent (see `../pw-write-test/references/conventions.md`). Change it **only** in `tests/pages/portfolio.page.ts`.
3. Verify:
   ```bash
   npx playwright test --project=self-test tests/self-test/page-object.spec.ts   # contract, EN + PT
   npx playwright test <file> --repeat-each=5
   npm run mutate -- --only <mutants for this area>
   ```
   Mutants must still be caught: a healed locator that matches too much (e.g. the brand link inside the nav) would weaken the tests.

### 5. Propose, don't merge

Present a heal report and wait for approval before committing:

```markdown
## Heal report: <test title>

**Class:** locator drift
**Evidence:** <error line> · aria snapshot before/after: `link "About"` → `link "Sobre nós"`
**Root cause:** <site commit or change>
**Change:** tests/pages/portfolio.page.ts:41 `<old>` → `<new>`
**What is expected is unchanged:** yes, no spec or tests/data edits
**Verified:** contract ✅ EN+PT · spec ×5 ✅ · mutants M-NAV-01, M-LINK-01 caught ✅
```

For a product bug:

```markdown
## Bug: <what a visitor experiences>

**Found by:** <test> (REQ-…) on <projects>
**Steps / expected / actual:** …
**Evidence:** <message, screenshot path, diff>
**Likely cause:** <file:line in the site>
```

Commit an approved heal as `fix(test): …` with the report in the body.
