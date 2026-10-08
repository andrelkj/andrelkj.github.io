---
name: qa-plan
description: Turn a site change, feature idea, bug or claim into testable requirements (REQ-IDs) and a test plan for this repo (andrelkj.github.io), before any test code is written. Use whenever the user changes or plans to change index.html / script.js / styles.css, asks "what should we test?", "how do we cover this?", wants a test plan or test strategy, adds a claim to the site's QA report, or describes new behavior that has no requirement yet.
---

# Plan what to test

The suite's trust model starts here: every test proves a requirement written in plain language in `docs/REQUIREMENTS.md`, and CI fails if the two drift apart. A good plan makes the tests obvious and the mutants easy to name.

## Workflow

### 1. Understand the change

- What changed or will change? Read the diff (`git diff main -- index.html script.js styles.css`) or the user's description.
- What would a **visitor** notice: sighted, keyboard-only, screen reader, phone, PT speaker? Requirements describe that, not the implementation.
- Explore the page when behavior isn't obvious: Playwright test MCP `browser_snapshot` if available, or `npm run serve` and a probe spec. Check EN and PT, and the three widths (375 / 768 / 1280).

### 2. Check what already exists

- Read `docs/REQUIREMENTS.md` and `docs/COVERAGE.md`. Often the change is covered by an existing requirement and only needs a new test or an updated expected value in `tests/data/`.
- Check the site's "Checks run on this site" panel (in `index.html`, `ai.r1`…). If the change affects a claim there, the claims table at the end of REQUIREMENTS.md must still map that claim to requirements.

### 3. Write the requirements

Add rows to the right `##` area in `docs/REQUIREMENTS.md`, numbering on from the last ID in that area:

```markdown
| REQ-I18N-08 | Every PT text fits its container at 375 px (no clipped words). |
```

A good requirement is:

- **observable**: a visitor or assistive technology could notice it failing;
- **specific**: names the widths, languages or themes when it only holds for some;
- **one thing**: split "X and Y" if they can fail independently;
- **honest**: if it isn't automated yet, say `_Planned: <when>._` so the coverage gate allows it.

Don't invent numbers or claims the site doesn't make. If a requirement is really an editorial check (e.g. "claims match the resume"), write it down as not automated rather than faking a test.

### 4. Plan the tests and their mutants

For each requirement, list:

| REQ         | Test idea (what the test does and asserts)                                    | Projects | Tag   | Mutant (the realistic defect that must make it fail)   |
| ----------- | ----------------------------------------------------------------------------- | -------- | ----- | ------------------------------------------------------ |
| REQ-I18N-08 | Switch to PT, measure each `[data-i18n]` element's scrollWidth vs clientWidth | mobile   | @i18n | Long PT string with `white-space: nowrap` on `.status` |

The mutant column is not optional. If you can't name a realistic defect that the test would catch, the requirement is probably vague or untestable. Sharpen it.

### 5. Hand off

Present the plan in this shape, then implement with the `pw-write-test` skill:

```markdown
## Test plan: <change>

**Visitor impact:** <one paragraph>
**New / changed requirements:** <the rows>
**Tests:** <the table above>
**Out of scope:** <what you deliberately won't test, and why>
**Site claims affected:** <QA-report lines, or "none">
```

Commit the REQUIREMENTS.md change on its own (`docs: …`). `npm run coverage:check` will fail until the tests exist, unless the rows are marked planned, which is the point: the gap is visible.
