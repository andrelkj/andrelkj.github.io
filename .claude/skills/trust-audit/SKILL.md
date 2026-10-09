---
name: trust-audit
description: Audit how far this repo's (andrelkj.github.io) test suite can be trusted. Run and interpret the coverage gate, the mutation suite, flake checks and self-tests, explain every survivor or gap, propose the missing tests, and refresh docs/TRUST.md through the reviewed CI flow. Use whenever the user asks "can I trust the tests?", "how good is the suite?", wants the mutation score, the weekly Mutation run failed or reported survivors, TRUST.md looks stale, or before a release or a demo of the project.
---

# Audit trust in the suite

A green run is only worth something if the suite would have gone red for real defects. This audit measures that with four independent signals and turns every gap into a concrete next step.

## Workflow

### 1. Fast gates (seconds to minutes)

```bash
npm run check
npm run coverage:check                       # every requirement has a test, every test a requirement
npx playwright test --project=self-test      # helpers, locator contract, coverage + mutation logic, catalog
```

### 2. Mutation score

- **Full, official**: Linux is required (the 3 visual mutants need the Linux baselines). Use the latest weekly Mutation run, or start one:
  ```bash
  gh run list --workflow mutation.yml --limit 3
  gh workflow run mutation.yml                 # full run, ~23 min
  gh workflow run mutation.yml -f only=M-I18N-01,M-NAV-02
  gh run download <run-id> -n trust-scorecard  # TRUST.md from a full run
  ```
- **Local, quick**: `npm run mutate` (~8 min on macOS, visual mutants skipped) or `npm run mutate -- --only <IDs>`.

Interpret each non-caught status:

| Status             | Meaning                                           | Next step                                                                                                                              |
| ------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `survived`         | No test failed: a real gap                        | Strengthen or add a test for the requirement (`pw-write-test`). Don't delete the mutant.                                               |
| `caught-elsewhere` | Only tests for other requirements failed          | Either the catching test lacks the right `req(...)`, or `expectedReqs` is wrong. Fix the one that's actually wrong, and explain which. |
| `not-applicable`   | The mutant's target text is gone from the site    | The site changed: update the snippet to the new markup so the same defect is still exercised.                                          |
| `error`            | The run itself broke (no tests ran, server error) | Investigate the run; never count it as caught.                                                                                         |
| `skipped`          | Needs Linux                                       | Use the CI run.                                                                                                                        |

### 3. Flakiness

```bash
gh workflow run tests.yml -f repeat_each=10 -f grep=@visual   # or another tag
npx playwright test tests/specs/<area>.spec.ts --repeat-each=10
```

Any flaky test is a trust gap: diagnose with `pw-heal` (find the raced state; no sleeps or retries).

### 4. Gaps the tools can't see

Look for these by reading, briefly:

- Requirements in `docs/REQUIREMENTS.md` marked planned for a long time.
- Requirements with a single test on a single project when the behavior differs by viewport or language.
- Areas of the site with no mutant at all (compare `scripts/mutate/mutants.ts` areas with REQUIREMENTS areas).
- Site claims in the "Checks run on this site" panel that no requirement maps to.

### 5. Refresh TRUST.md (only from a full Linux run)

Download the `trust-scorecard` artifact, read it (every row caught? commit SHA real? nothing rendered as raw HTML?), copy it to `docs/TRUST.md` and commit it alone:

```
docs: refresh the trust scorecard

What: docs/TRUST.md from Mutation run <id> at <sha>: <score>.
Verified (review): <rows checked, anything notable>.
```

CI never commits it; a person reviewing it is part of the guarantee.

## Report

```markdown
## Trust audit (<date>, <sha>)

| Signal     | Result                              |
| ---------- | ----------------------------------- |
| Coverage   | <n of m requirements, gate ✅/❌>   |
| Mutation   | <caught/scored> (<run id or local>) |
| Flakiness  | <repeat run result>                 |
| Self-tests | <n passed>                          |

**Gaps:** <each with the concrete next step and skill to use>
**Recommendation:** <trust as-is | fix X before relying on Y>
```
