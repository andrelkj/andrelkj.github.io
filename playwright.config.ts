import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
const LOCAL_PORT = 4173;

/**
 * Tests run against a local static server by default. Set BASE_URL to run the same
 * specs against a deployed copy, e.g. `BASE_URL=https://andrelkj.github.io npm run test:smoke`.
 */
const baseURL = process.env.BASE_URL ?? `http://localhost:${LOCAL_PORT}`;
const useLocalServer = process.env.BASE_URL === undefined;

export default defineConfig({
  testDir: './tests',
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
    toHaveScreenshot: { animations: 'disabled', caret: 'hide' },
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Viewports match the widths the site's own QA report claims: 375 / 768 / 1280.
  projects: [
    { name: 'mobile', use: { ...devices['iPhone SE (3rd gen)'] } },
    { name: 'tablet', use: { ...devices['iPad Mini'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  ...(useLocalServer
    ? {
        webServer: {
          command: `npx http-server . -p ${LOCAL_PORT} -s -c-1`,
          url: baseURL,
          reuseExistingServer: !isCI,
        },
      }
    : {}),
});
