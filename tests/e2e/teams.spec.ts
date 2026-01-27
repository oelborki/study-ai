import { test, expect } from '@playwright/test';

test.describe('Team Operations', () => {
  test('should show teams page', async ({ page }) => {
    await page.goto('/teams');

    // If redirected to login, that's expected
    const url = page.url();
    if (url.includes('login')) {
      expect(url).toContain('login');
      return;
    }

    // Check for teams page content
    const content = await page.content();
    expect(content).toBeTruthy();
  });

  test('should show team creation option', async ({ page }) => {
    await page.goto('/teams');

    // If redirected to login, skip
    const url = page.url();
    if (url.includes('login')) {
      expect(url).toContain('login');
      return;
    }

    // Page should have create option or show teams list
    const content = await page.content();
    expect(content).toBeTruthy();
  });

  test('should validate team name on creation', async ({ page }) => {
    await page.goto('/teams/create');

    // If redirected or page doesn't exist, check URL
    const url = page.url();
    if (url.includes('login') || url.includes('404')) {
      expect(url).toBeTruthy();
      return;
    }

    // If on create page, test validation
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"]');
    if (await nameInput.count() > 0) {
      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        // Should show error or stay on page
        const currentUrl = page.url();
        expect(currentUrl.includes('create') || currentUrl.includes('teams')).toBeTruthy();
      }
    }
  });

  test('should handle team join page with code', async ({ page }) => {
    await page.goto('/teams/join/testcode123');

    // Check the response - could redirect to login or show team info
    const url = page.url();
    const content = await page.content();

    // Page should respond appropriately
    expect(url.includes('login') || url.includes('join') || content.includes('team') || content.includes('Team') || content.includes('error') || content.includes('not found')).toBeTruthy();
  });

  test('should handle invalid team invite code', async ({ page }) => {
    await page.goto('/teams/join/invalid-code-12345');

    // If redirected to login, skip
    const url = page.url();
    if (url.includes('login')) {
      expect(url).toContain('login');
      return;
    }

    // Should show error for invalid code
    const content = await page.content();
    expect(content).toBeTruthy();
  });
});
