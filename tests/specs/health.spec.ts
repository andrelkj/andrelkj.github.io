import { expect, test } from '../fixtures/test';

test.describe('page health', () => {
  test(
    'home page loads with its title and main landmark',
    {
      tag: '@smoke',
      annotation: { type: 'req', description: 'REQ-HEALTH-01' },
    },
    async ({ page }) => {
      await page.goto('/');

      await expect(page).toHaveTitle('André Kreutzer — Sr. QA Engineer / SDET');
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(/André Kreutzer/);
    },
  );
});
