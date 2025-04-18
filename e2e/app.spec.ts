import { test, expect } from '@playwright/test';

test('renders the page with correct displayed & meta title', async ({
  page,
}) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState();

  await expect(page).toHaveTitle(/Kava Web3 AI/);

  //  Welcome text and top left icon
  const kavaAISidebarLogo = page.getByTestId('kava-ai-sidebar-logo');
  const kavaAILandingContentLogo = page.getByTestId('kava-ai-logo');

  const welcomeText = page.getByText('How can I help you with Web3?');

  await expect(kavaAISidebarLogo).toBeVisible();
  await expect(kavaAILandingContentLogo).toBeVisible();
  await expect(welcomeText).toBeVisible();
});
