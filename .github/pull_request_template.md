## What and why

<!-- What changes, and which requirement(s) it serves (REQ-…). -->

## How it was verified

<!-- Commands and results: npm run check, specs ×5, mutants caught, screenshots reviewed… -->

## Trust checklist

CI checks the mechanics (types, lint, format, coverage, the suite, mutant catalog). These need a person:

- [ ] Every new or changed test proves a requirement (`req(...)`) and **was seen failing** for the defect it guards against (catalog mutant caught, `npm run mutate -- --only <ID>`).
- [ ] No assertion was weakened, and no expected value in `tests/data/` changed, unless the site changed on purpose in this PR.
- [ ] No new exception, allowlist entry, skip, timeout or retry without a reason a reviewer would accept.
- [ ] A fixed failing test changed **how** elements are found, not **what** is expected (`pw-heal` rule).
- [ ] Visual baselines (if any) come from the CI container, were looked at, and are in their own commit.
- [ ] New site text or `aria-label` has a PT translation (or a reasoned fixed-text entry).
- [ ] Generated files (`docs/COVERAGE.md`, `docs/TRUST.md`, baselines) are in their own commits.
- [ ] README / REQUIREMENTS updated if behavior or commands changed.
