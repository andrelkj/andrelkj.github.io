---
name: pw-review
description: Review test code, specs, helpers, CI workflows or site changes in this repo (andrelkj.github.io) against Playwright best practices, strict TypeScript, modern JavaScript and the repo's trust rules, and report findings by severity with file:line and a fix. Use whenever the user asks to review, check, audit or "look over" a PR, branch, diff, commit or test file, asks "is this test good?", or before a PR leaves draft, even if they don't say "code review".
---

# Review tests

The question behind every review here: **could this change make a green run lie?** Style matters, but a weakened assertion that still passes is worse than any naming issue. Review trust first, then correctness, then maintainability.

## Workflow

### 1. Scope the diff

```bash
git diff --stat main...HEAD
git diff main...HEAD -- tests scripts .github playwright.config.ts
git diff main...HEAD -- index.html script.js styles.css assets
```

For a PR: `gh pr diff <n>`. Note which areas (tags) the changed specs belong to.

### 2. Run the gates first

Facts before opinions:

```bash
npm run check                      # typecheck, lint, format
npm run coverage:check             # traceability
npx playwright test <changed spec files> --repeat-each=5
npx playwright test --project=self-test
```

If a test or assertion changed, also run the mutants for its area:

```bash
npm run mutate -- --only <mutant IDs whose grep matches the changed area>
```

Mutant IDs are in `scripts/mutate/mutants.ts`. A failing gate is a finding with evidence. Don't restate what lint already reports; point to the output.

### 3. Read against the checklist

Use `references/checklist.md` (trust, Playwright, locators, TypeScript, JavaScript/async, data/docs, CI, site changes) and `../pw-write-test/references/conventions.md` for what "correct" looks like here. Read the changed code itself. Then for each change ask:

- What requirement does this prove, and would its mutants still be caught?
- Does it hold in EN **and** PT, on mobile, tablet **and** desktop?
- Could it flake? What state could it race?

### 4. Report

Use exactly this structure, most severe first:

```markdown
## Review: <branch or PR>

**Gates:** check ✅ · coverage ✅ · changed specs ×5 ✅ (n/n) · mutants M-…: caught ✅
**Verdict:** approve | approve with nits | changes requested

| #   | Severity | Where                       | Finding                               | Why it matters                                        | Suggested fix               |
| --- | -------- | --------------------------- | ------------------------------------- | ----------------------------------------------------- | --------------------------- |
| 1   | blocker  | tests/specs/i18n.spec.ts:42 | toEqual([]) changed to toContain(...) | Untranslated text would now pass (M-I18N-07 survives) | Restore the exact assertion |

**Good:** <1–3 things done well, specifically>
```

Severity: **blocker** (can make a green run lie, or breaks a gate), **major** (flaky, wrong coverage, real maintainability debt), **minor** (convention, readability), **nit** (taste; label it as such). Every finding has a `file:line`, the concrete consequence, and a fix. "Consider improving X" without a consequence isn't a finding.

### 5. Fix only when asked

Reviewing and fixing are separate. If the user asks for fixes, fix blockers and majors first, rerun the gates, and report what changed per finding.
