import { test, expect } from '@playwright/test';

test('renders the page with correct displayed & meta title', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState();

  await expect(page).toHaveTitle(/Hard AI/);

  const heading = await page.getByText('Hard AI');

  await expect(heading).toBeVisible();
});
