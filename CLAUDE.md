# CLAUDE.md

André Kreutzer's portfolio site (plain `index.html` / `styles.css` / `script.js`, EN + PT, dark + light) and the AI-assisted Playwright + TypeScript suite that tests it. The goal is a suite whose green run can be trusted **without reading the test code**. See README.md for the full picture.

## Commands

```bash
npm test                          # full suite (local server on :4173 starts automatically)
npm run check                     # typecheck + lint + format: run before every commit
npm run coverage                  # regenerate docs/COVERAGE.md; coverage:check is the CI gate
npm run mutate -- --only <IDs>    # prove tests catch their defects (full run: npm run mutate)
npx playwright test <file> --repeat-each=5   # stability check for new/changed tests
```

## Rules that protect trust

1. **Requirements first.** Every test proves a REQ-ID in `docs/REQUIREMENTS.md` via `annotation: req(...)`; CI fails otherwise.
2. **Every test must be able to fail.** New behavior → a mutant in `scripts/mutate/mutants.ts` that the test catches.
3. **Healing changes how, never what.** Locators may be fixed in `tests/pages/`; expected values, allowlists, exceptions, skips, timeouts and baselines change only with the user's explicit decision.
4. **Generated files are reviewed and committed by a person**, in their own commit: `docs/COVERAGE.md`, `docs/TRUST.md`, visual baselines. CI never commits.
5. **No sleeps, no retries-as-fixes.** Wait for the real state.
6. **Site copy is bilingual.** New text needs a `data-i18n` key + PT value (or a reasoned entry in `tests/data/i18n-fixed-text.ts`); new `aria-label` needs `data-i18n-label`.

## Skills (`.claude/skills/`)

| Skill           | Use when                                                                         |
| --------------- | -------------------------------------------------------------------------------- |
| `qa-plan`       | A site change or idea needs requirements and a test plan                         |
| `pw-write-test` | Writing or extending tests (conventions live in its `references/conventions.md`) |
| `pw-review`     | Reviewing a diff, PR or test file                                                |
| `pw-heal`       | A test fails or flakes                                                           |
| `a11y-triage`   | An axe / contrast / keyboard / label failure                                     |
| `trust-audit`   | "Can I trust the suite?", mutation survivors, refreshing TRUST.md                |

`.mcp.json` registers Playwright's test MCP server (`browser_snapshot`, `browser_generate_locator`, `test_debug`…). Playwright's stock agents are intentionally not installed: the stock healer edits expected values and marks tests `fixme`, which breaks rule 3.

## How work is delivered

- One branch + draft PR per phase/topic; small single-purpose commits, each passing `npm run check`.
- Commit body: **What**, **Why** (REQ-IDs), **Verified** (commands, counts, mutant), **Look at** (lines worth review). End with the co-author line.
- After each commit, a short update to André; at the end of a phase, a summary, then wait for his go-ahead.

## Gotchas

- Visual baselines are **Linux-only** (Playwright container). They skip on macOS; regenerate via the Tests workflow (`update_snapshots`), review the PNGs, commit separately. This Mac has no Docker.
- macOS uses BSD `sed`: GNU forms like `0,/re/` silently do nothing. Prefer small Python/perl edits or the Edit tool, and check the diff after mutating a file.
- The repo lives in `~/Documents` (iCloud Drive). iCloud can create `* 2.*` duplicate files; if lint/tsc complain about a `… 2.ts` file, move it out (don't commit it).
- The mutation workflow takes ~23 min, so it runs weekly and on demand only. PRs rely on the fast catalog check in `tests/self-test/mutation.spec.ts`.
