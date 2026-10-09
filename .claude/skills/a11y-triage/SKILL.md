---
name: a11y-triage
description: Triage accessibility failures in this repo (andrelkj.github.io). Turn axe-core violations, contrast failures, keyboard/focus problems or screen-reader label issues into WCAG success criteria, impact, root cause in styles.css/index.html/script.js and a concrete fix, and decide (rarely) whether a scoped, expiring exception is justified. Use whenever an @a11y or contrast test fails, the user pastes axe output or axe-results.json, asks about WCAG, color contrast, focus, ARIA or screen readers on this site, or wants to add an axe exception.
---

# Triage accessibility failures

An axe failure here usually means a real visitor can't read or operate something, in one theme, one language, or one viewport. Fix the site; exceptions are a last resort that the suite makes deliberately uncomfortable (scoped, owned, expiring).

## Workflow

### 1. Get the full picture

- The failing tests print one line per violation: `rule [impact] help → selectors`. The full axe JSON is attached to each test as `axe-results.json` (HTML report, or `gh run download <id> -n test-results` from CI).
- Note **where** it fails: which theme × language (from the describe title), which projects. A failure only in light theme points at the light tokens; only in PT points at longer text or a missing translated label; only on mobile points at the ≤820px CSS.
- Reproduce one combination:
  ```bash
  npx playwright test tests/specs/a11y.spec.ts --project=desktop -g "light theme, EN"
  ```

### 2. Map each violation

For each rule, fill one row:

| Rule | Impact | WCAG SC | Where (theme/lang/project) | Elements | Root cause | Fix |
| ---- | ------ | ------- | -------------------------- | -------- | ---------- | --- |

WCAG mapping from axe tags: `wcag143` → 1.4.3 Contrast (Minimum), `wcag111` → 1.1.1 Non-text Content, `wcag412` → 4.1.2 Name, Role, Value, `wcag241` → 2.4.1 Bypass Blocks, `wcag247` → 2.4.7 Focus Visible, `wcag258` → 2.5.8 Target Size (Minimum). `best-practice` rules have no SC: say so.

### 3. Find the root cause in the site

- **Contrast**: colors come from tokens in `styles.css` (`:root` = dark, `:root[data-theme="light"]` = light). Compute, don't guess:
  ```bash
  node .claude/skills/a11y-triage/scripts/contrast.mjs '#5b6b65' '#f6f8f7'
  node .claude/skills/a11y-triage/scripts/contrast.mjs --tokens styles.css
  ```
  Normal text needs 4.5:1; large text (≥24px, or ≥18.66px bold) needs 3:1. Fix the **token**, not one element, so every use improves, then rerun `--tokens` to check no other pair broke.
- **Names/labels**: icon buttons and landmarks need an accessible name; PT needs a translated one (`data-i18n-label` + PT value in `script.js`, see REQ-I18N-07).
- **Focus/keyboard**: axe can't see these. REQ-A11Y-02/03 cover the skip link, focus order and outline. A removed outline was caught only by the keyboard test, not axe.

### 4. Fix and verify

```bash
npx playwright test tests/specs/a11y.spec.ts tests/specs/theme.spec.ts
npm run mutate -- --only M-A11Y-01,M-A11Y-02,M-A11Y-03
```

If the fix is visible, the visual baselines change: regenerate them in CI (Tests workflow, `update_snapshots`) and review the images before committing.

### 5. Only if a fix is truly impossible: an exception

Valid reasons are rare (e.g. third-party embed you don't control). Add to `tests/data/axe-exceptions.ts`:

```ts
{
  rule: 'color-contrast',
  selector: '.exact .selector',
  reason: 'why it cannot be fixed now',
  owner: 'André',
  expires: 'YYYY-MM-DD',
}
```

The selector must be as narrow as possible, the expiry at most ~90 days out, and the user must approve it explicitly. It hides only that rule on that selector (not all rules), and an expired entry fails every a11y test. Never disable a rule globally, and never add an exception to make a red build green without that approval.

## Report

```markdown
## Accessibility triage

<table from step 2>
**Fix applied / proposed:** <token or markup change with before→after ratios>
**Verified:** a11y + theme specs ✅ · mutants M-A11Y-… caught ✅ · tokens report: no new failures
**Exceptions:** none | <entry, with the user's approval>
```
