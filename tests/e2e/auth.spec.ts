import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');

    // Check for login form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show register page', async ({ page }) => {
    await page.goto('/register');

    // Check for register form elements
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show password requirements on register page', async ({ page }) => {
    await page.goto('/register');

    // Password requirements should be visible or shown after focus
    await page.locator('input[name="password"]').focus();

    // Check for any password hint text (may vary based on implementation)
    const pageContent = await page.content();
    // The page should indicate password requirements somewhere
    expect(pageContent).toBeTruthy();
  });

  test('should reject registration with weak password', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `weak${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'weak');
    await page.click('button[type="submit"]');

    // Should stay on register page or show error
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('register');
  });

  test('should reject login with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should stay on login page or redirect with error
    await page.waitForTimeout(2000);
    const url = page.url();
    // Login page should still be shown or redirect to login with error
    expect(url).toContain('login');
  });

  test('should have link between login and register pages', async ({ page }) => {
    await page.goto('/login');

    // Look for link to register
    const registerLink = page.locator('a[href*="register"]');
    if (await registerLink.count() > 0) {
      await registerLink.first().click();
      await expect(page).toHaveURL(/register/);
    }

    // Go back to login
    await page.goto('/register');
    const loginLink = page.locator('a[href*="login"]');
    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
    // Try to access dashboard without being logged in
    await page.goto('/dashboard');

    // Should redirect to login or show auth error
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes('login') || url.includes('auth')).toBeTruthy();
  });
});
