import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
/** PORT and SITE_DIR let the mutation runner serve a mutated copy of the site on its own port. */
const LOCAL_PORT = Number(process.env.PORT ?? 4173);
const SITE_DIR = process.env.SITE_DIR ?? '.';

/**
 * Tests run against a local static server by default. Set BASE_URL to run the same
 * specs against a deployed copy, e.g. `BASE_URL=https://andrelkj.github.io npm run test:smoke`.
 */
const baseURL = process.env.BASE_URL ?? `http://localhost:${LOCAL_PORT}`;
const useLocalServer = process.env.BASE_URL === undefined;

export default defineConfig({
  testDir: './tests',
  // @external tests hit real third-party sites; they run nightly (RUN_EXTERNAL=1), not on every PR.
  ...(process.env.RUN_EXTERNAL ? {} : { grepInvert: /@external/ }),
  fullyParallel: true,
  forbidOnly: isCI,
  // One retry in CI surfaces flakiness in the report; failOnFlakyTests still fails the run.
  retries: isCI ? 1 : 0,
  failOnFlakyTests: isCI,
  ...(isCI ? { workers: 2 } : {}),
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', threshold: 0.05 },
  },
  use: {
    baseURL,
    // Pin the locale: the site auto-detects PT from navigator.language when nothing is saved.
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Viewports match the widths the site's own QA report claims: 375 / 768 / 1280.
  projects: [
    { name: 'mobile', testDir: './tests/specs', use: { ...devices['iPhone SE (3rd gen)'] } },
    { name: 'tablet', testDir: './tests/specs', use: { ...devices['iPad Mini'] } },
    { name: 'desktop', testDir: './tests/specs', use: { ...devices['Desktop Chrome'] } },
    // Tests for the test helpers themselves: proves each helper can fail. One browser is enough.
    { name: 'self-test', testDir: './tests/self-test', use: { ...devices['Desktop Chrome'] } },
  ],
  ...(useLocalServer
    ? {
        webServer: {
          command: `npx http-server "${SITE_DIR}" -p ${String(LOCAL_PORT)} -s -c-1`,
          url: baseURL,
          reuseExistingServer: !isCI,
        },
      }
    : {}),
});
