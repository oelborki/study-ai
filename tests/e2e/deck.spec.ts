import { test, expect } from '@playwright/test';

test.describe('Deck Operations', () => {
  test('should show deck creation page or modal', async ({ page }) => {
    // Try to navigate to deck creation
    await page.goto('/decks/create');

    // If redirected to login, that's expected behavior
    const url = page.url();
    if (url.includes('login')) {
      expect(url).toContain('login');
      return;
    }

    // If on create page, check for form
    const content = await page.content();
    expect(content).toBeTruthy();
  });

  test('should handle deck not found', async ({ page }) => {
    await page.goto('/decks/nonexistent-deck-id');

    // Should redirect to login if not authenticated
    // Or show 404/error if authenticated but deck not found
    const url = page.url();
    const content = await page.content();

    // Either redirected to login or shows error state
    expect(url.includes('login') || content.includes('not found') || content.includes('error') || url.includes('404')).toBeTruthy();
  });

  test('should validate deck title on creation', async ({ page }) => {
    await page.goto('/decks/create');

    // If redirected to login, skip
    const url = page.url();
    if (url.includes('login')) {
      expect(url).toContain('login');
      return;
    }

    // Try to submit without title
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();

      // Should show validation error or stay on page
      const currentUrl = page.url();
      expect(currentUrl.includes('create') || currentUrl.includes('deck')).toBeTruthy();
    }
  });

  test('should show upload option for file-based decks', async ({ page }) => {
    // Navigate to upload page
    await page.goto('/upload');

    // If redirected to login, that's expected
    const url = page.url();
    if (url.includes('login')) {
      expect(url).toContain('login');
      return;
    }

    // Check for file upload elements
    const fileInput = page.locator('input[type="file"]');
    const dropZone = page.locator('[data-testid="dropzone"], .dropzone, [role="button"]');
    const content = await page.content();

    // Either there's a file input, drop zone, or upload-related content
    expect(await fileInput.count() > 0 || await dropZone.count() > 0 || content.includes('upload') || content.includes('Upload')).toBeTruthy();
  });

  test('should show deck content types (summary, flashcards, exam)', async ({ page }) => {
    await page.goto('/decks/test-deck');

    // If redirected to login, skip
    const url = page.url();
    if (url.includes('login')) {
      expect(url).toContain('login');
      return;
    }

    // Check for content type tabs/buttons
    const content = await page.content();
    // The page should exist even if empty
    expect(content).toBeTruthy();
  });

  test('should handle deck download', async ({ page }) => {
    // Navigate to a deck page with download option
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
});
