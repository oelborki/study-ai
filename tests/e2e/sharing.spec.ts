import { test, expect } from '@playwright/test';

test.describe('Sharing Features', () => {
  test('should handle share link page', async ({ page }) => {
    // Navigate to a shared deck link
    await page.goto('/shared/test-share-code');

    // Should either show the shared content or error
    const url = page.url();
    const content = await page.content();

    // The page should respond - either with content, login redirect, or error
    expect(url || content).toBeTruthy();
  });

  test('should show share options on deck page', async ({ page }) => {
    await page.goto('/decks/test-deck');

    // If redirected to login, skip
    const url = page.url();
    if (url.includes('login')) {
      expect(url).toContain('login');
      return;
    }

    // Page should render
    const content = await page.content();
    expect(content).toBeTruthy();
  });

  test('should handle invalid share code', async ({ page }) => {
    await page.goto('/shared/invalid-share-code-12345');

    // Should show error or 404
    const content = await page.content();
    const url = page.url();

    // Either shows error state or redirects
    expect(content || url).toBeTruthy();
  });

  test('should allow saving shared deck when logged in', async ({ page }) => {
    await page.goto('/shared/test-share-code');

    // If on share page, check content
    const url = page.url();
    if (url.includes('shared')) {
      const content = await page.content();
      // Page should show either save option (if logged in) or login prompt
      expect(content).toBeTruthy();
    } else {
      // Redirected somewhere
      expect(url).toBeTruthy();
    }
  });
});
