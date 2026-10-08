import { expect, req, test } from '../fixtures/test';

test.describe('page health', () => {
  test(
    'home page loads with its title and main landmark',
    {
      tag: '@smoke',
      annotation: req('REQ-HEALTH-01'),
    },
    async ({ page, portfolio }) => {
      await portfolio.goto();

      await expect(page).toHaveTitle('André Kreutzer — Sr. QA Engineer / SDET');
      await expect(portfolio.main).toBeVisible();
      await expect(portfolio.heading).toHaveText(/André Kreutzer/);
    },
  );
});
