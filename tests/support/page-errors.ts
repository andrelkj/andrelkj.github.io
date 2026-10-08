import type { Page } from '@playwright/test';

/**
 * Collects everything that signals a broken page while a test runs:
 * `console.error` messages, uncaught exceptions, and same-origin requests that failed
 * or returned 4xx/5xx. Cross-origin noise (e.g. Google Fonts) is ignored on purpose:
 * third-party outages must not fail the suite. The `health` @external check covers them.
 */
export interface PageErrorCollector {
  /** Human-readable description of each problem, in the order it happened. */
  readonly errors: readonly string[];
}

export function collectPageErrors(page: Page, baseURL: string): PageErrorCollector {
  const origin = new URL(baseURL).origin;
  const errors: string[] = [];
  const isSameOrigin = (url: string): boolean => url.startsWith(origin);

  page.on('console', (message) => {
    // "Failed to load resource" lines carry no URL and duplicate the network handlers below,
    // which record the URL and apply the same-origin filter.
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
      errors.push(`console.error: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    errors.push(`uncaught exception: ${error.message}`);
  });
  page.on('requestfailed', (request) => {
    if (isSameOrigin(request.url())) {
      errors.push(
        `request failed: ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`,
      );
    }
  });
  page.on('response', (response) => {
    if (isSameOrigin(response.url()) && response.status() >= 400) {
      errors.push(`HTTP ${String(response.status())}: ${response.url()}`);
    }
  });

  return { errors };
}
