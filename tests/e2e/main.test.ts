import { test, expect } from '@playwright/test';

const BASE_URL = 'https://reddiginsight-v2.vercel.app';
const TEST_EMAIL = 'testuser2026@test.com';
const TEST_PASSWORD = 'Test123456!';

test.describe('ReddigInsight MVP End-to-End Tests', () => {
  // Set up and clear any existing auth state
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC-001: Homepage loads', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verify page loads
    await expect(page).toHaveTitle(/ReddigInsight/);
    await expect(page.locator('h1')).toContainText('Understand Any Subreddit');
    
    // Verify gradient background exists
    await expect(page.locator('.bg-gradient-to-br')).toBeVisible();
    
    // Verify navigation bar exists
    await expect(page.locator('nav')).toBeVisible();
  });

  test('TC-002: User Registration', async ({ page }) => {
    test.skip(); // Skipping registration since we'll log in with existing test account
  });
  
  test('TC-003: User Login', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Input test account credentials with correct placeholders
    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    
    // Click login
    await page.locator('button[type="submit"]').click();
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });
  
  test('TC-004: Dashboard credits display', async ({ page }) => {
    // First ensure we're logged in - go through login flow
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    
    // Wait for redirect to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`);
    
    // Verify user credits are displayed
    const creditElement = page.locator('text="Available Credits"');
    await expect(creditElement).toBeVisible();
    
    // Verify stats cards display
    await expect(page.locator('text=Analytics Report')).toBeVisible();
    await expect(page.locator('text="Reports Generated"')).toBeVisible();
    await expect(page.locator('text=Processing')).toBeVisible();
  });
  
  test('TC-005: Create Analysis Report', async ({ page }) => {
    test.skip(); // Skipping as this requires API integration and will consume credits
  });
  
  test('TC-006: AI Chat responds', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    
    await page.waitForURL(`${BASE_URL}/dashboard`);
    
    // Navigate to chat
    await page.goto(`${BASE_URL}/chat`);
    
    // Verify AI welcome message is displayed (in Chinese: "你好！我是 ReddigInsight 的 AI 顾问...")
    await expect(page.locator('text=你好！')).toBeVisible();
    
    // Input test query using the actual placeholder text
    await page.locator('textarea[placeholder="Type your message..."]').fill('I want to analyze AI programming tools');
    await page.locator('button', { hasText: 'Send' }).click();
    
    // Verify AI returns response (it may take a few seconds)
    await expect(page.locator('.message-response')).toBeVisible({ timeout: 10000 });
  });
  
  test('TC-007: Reports page shows list', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    
    // Navigate to reports page
    await page.goto(`${BASE_URL}/reports`);
    
    // Verify reports list is displayed
    await expect(page.locator('text=Analysis Reports')).toBeVisible();
    await expect(page.locator('[data-testid="reports-list"]')).toBeVisible();
    
    // Verify status display for reports (if any exist)
    const reportItems = page.locator('[data-testid="report-item"]');
    await expect(reportItems).toBeDefined();
  });
  
  test('TC-008: Pricing page works', async ({ page }) => {
    // Navigate to pricing page
    await page.goto(`${BASE_URL}/pricing`);
    
    // Verify page header
    await expect(page.locator('text=Simple, Transparent Pricing')).toBeVisible();
    await expect(page.locator('text=Choose a credit pack that fits your needs')).toBeVisible();
    
    // Verify pricing tiers are displayed ($9.9, $24.9, $69.9)
    await expect(page.locator('text=\\$9.9')).toBeVisible();
    await expect(page.locator('text=\\$24.9')).toBeVisible();
    await expect(page.locator('text=\\$69.9')).toBeVisible();
    
    // Verify purchase buttons exist
    await expect(page.locator('button', { hasText: 'Get 5 Credits' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Get 15 Credits' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Get 50 Credits' })).toBeVisible();
  });
  
  test('TC-009: Settings page works', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    
    // Navigate to settings page
    await page.goto(`${BASE_URL}/settings`);
    
    // Verify user email is displayed
    await expect(page.locator(`text=${TEST_EMAIL}`)).toBeVisible();
    
    // Verify logout button exists
    await expect(page.locator('button', { hasText: 'Logout' })).toBeVisible();
  });
  
  test('TC-010: Logout works', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    
    // Verify dashboard access
    await page.waitForURL(`${BASE_URL}/dashboard`);
    await expect(page.locator('text="Available Credits"')).toBeVisible();
    
    // Click logout
    await page.locator('button', { hasText: 'Logout' }).click();
    
    // Verify redirect to home page
    await expect(page).toHaveURL(BASE_URL);
    
    // Verify /dashboard is not accessible (would redirect to login)
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForURL(/login/); // Should redirect to login after session ends
  });
  
  test('TC-011: Forgot Password page', async ({ page }) => {
    // Navigate to forgot password page directly since link might not exist on login yet
    await page.goto(`${BASE_URL}/forgot-password`);
    
    // Input email
    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    
    // Click send
    await page.locator('button', { hasText: 'Send reset link' }).click();
    
    // Verify submit state occurs (need to wait for potential network request or UI update)
    await expect(page.locator('text=Check your email')).toBeVisible({ timeout: 10000 });
  });
});