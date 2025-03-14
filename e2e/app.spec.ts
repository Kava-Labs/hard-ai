import { test, expect } from '@playwright/test';

test('renders the page with correct displayed & meta title', async ({
  page,
}) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState();

  await expect(page).toHaveTitle(/Hard AI/);

  const diamondLogo = page.getByRole('img', { name: 'Hard Diamond logo' });
  const hardAILogo = page.getByRole('img', { name: 'Hard AI logo' });

  await expect(diamondLogo).toBeVisible();
  await expect(hardAILogo).toBeVisible();
});
