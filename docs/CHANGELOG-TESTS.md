# Test suite changelog

One entry per merged phase. Each PR lists its commits, and each commit says what changed, why, and how it was verified.

| Phase              | PR                                                          | What it added                                                                                                                                                                                              |
| ------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 · Scaffold       | [#1](https://github.com/andrelkj/andrelkj.github.io/pull/1) | Pinned tooling, strict TypeScript, ESLint guards, Playwright config (375 / 768 / 1280), first smoke test, CI in the Playwright container.                                                                  |
| 2 · Infrastructure | _this PR_                                                   | `test` fixture with theme/lang seeding and a page error guard, page object with a locator contract, plus helpers for axe, overflow, i18n parity and links. Each helper has self-tests showing it can fail. |
