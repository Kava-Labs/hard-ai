import { test, expect } from '@playwright/test';

test('renders the page with correct displayed & meta title', async ({
  page,
}) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState();

  await expect(page).toHaveTitle(/Hard AI/);

  //  Welcome text and top left icon
  const hardAILogos = page.getByRole('img', { name: 'Hard AI logo' });
  const welcomeText = page.getByText('How can I help you with Web3?');

  await expect(hardAILogos.nth(0)).toBeVisible();
  await expect(hardAILogos.nth(0)).toBeVisible();
  await expect(welcomeText).toBeVisible();
});
