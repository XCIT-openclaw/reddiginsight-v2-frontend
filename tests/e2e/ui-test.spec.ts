import { test, expect } from '@playwright/test';

const BASE_URL = 'https://reddiginsight-v2.vercel.app';
const TEST_EMAIL = 'testuser2026@test.com';
const TEST_PASSWORD = 'Test123456!';

test.describe('ReddigInsight UI 实操测试', () => {
  
  // ==================== 页面导航测试 ====================
  
  test('UI-001: 首页加载和元素显示', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.screenshot({ path: 'tests/screenshots/001-homepage.png', fullPage: true });
    
    // 验证标题
    await expect(page).toHaveTitle(/ReddigInsight/);
    
    // 验证 Hero 区域 - 修正选择器
    await expect(page.locator('h1')).toContainText('Understand Any Subreddit');
    
    // 验证导航栏
    await expect(page.locator('nav')).toBeVisible();
    
    // 验证 CTA 按钮 - 使用实际文本
    await expect(page.locator('text=Start Free Analysis')).toBeVisible();
  });

  test('UI-002: 导航栏链接跳转', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // 点击 Pricing 链接
    await page.click('nav >> text=Pricing');
    await expect(page).toHaveURL(/pricing/);
    await page.screenshot({ path: 'tests/screenshots/002-pricing.png', fullPage: true });
    
    // 返回首页
    await page.goto(BASE_URL);
    
    // 点击 Sign in 链接
    await page.click('nav >> text=Sign in');
    await expect(page).toHaveURL(/login/);
    await page.screenshot({ path: 'tests/screenshots/002-login.png', fullPage: true });
  });

  // ==================== 按钮点击测试 ====================

  test('UI-003: 首页 Start Free Analysis 按钮', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // 点击 Start Free Analysis
    await page.click('text=Start Free Analysis');
    
    // 验证跳转到注册页
    await expect(page).toHaveURL(/signup/);
    await page.screenshot({ path: 'tests/screenshots/003-signup.png', fullPage: true });
  });

  test('UI-004: 登录表单提交', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // 填写登录表单
    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    
    await page.screenshot({ path: 'tests/screenshots/004-login-filled.png', fullPage: true });
    
    // 点击登录
    await page.click('button[type="submit"]');
    
    // 验证跳转到 Dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    await page.screenshot({ path: 'tests/screenshots/004-dashboard.png', fullPage: true });
  });

  test('UI-005: 定价页面按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    
    // 验证三个价格档位
    await expect(page.locator('text=$9.9')).toBeVisible();
    await expect(page.locator('text=$24.9')).toBeVisible();
    await expect(page.locator('text=$69.9')).toBeVisible();
    
    await page.screenshot({ path: 'tests/screenshots/005-pricing.png', fullPage: true });
    
    // 验证购买按钮存在
    const buttons = await page.locator('button').all();
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('UI-006: Dashboard 页面元素', async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // 验证积分或统计显示
    const pageContent = await page.content();
    expect(pageContent).toMatch(/Credits|Reports|Analytics/i);
    
    await page.screenshot({ path: 'tests/screenshots/006-dashboard.png', fullPage: true });
  });

  test('UI-007: Chat 页面对话', async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // 导航到 Chat
    await page.goto(`${BASE_URL}/chat`);
    
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 填写消息
    const textarea = page.locator('textarea');
    if (await textarea.isVisible()) {
      await textarea.fill('我想分析 r/programming 社区');
      await page.screenshot({ path: 'tests/screenshots/007-chat-filled.png', fullPage: true });
      
      // 发送消息
      const sendButton = page.locator('button:has-text("Send")');
      if (await sendButton.isVisible()) {
        await sendButton.click();
        await page.waitForTimeout(5000);
      }
    }
    
    await page.screenshot({ path: 'tests/screenshots/007-chat-response.png', fullPage: true });
  });

  test('UI-008: 报告列表页面', async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // 导航到报告列表
    await page.goto(`${BASE_URL}/reports`);
    
    // 验证页面加载 - 使用更精确的选择器
    await expect(page.locator('h1:has-text("Reports")')).toBeVisible();
    
    await page.screenshot({ path: 'tests/screenshots/008-reports.png', fullPage: true });
  });

  test('UI-009: 设置页面', async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // 导航到设置
    await page.goto(`${BASE_URL}/settings`);
    
    // 验证页面加载
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    
    await page.screenshot({ path: 'tests/screenshots/009-settings.png', fullPage: true });
  });

  test('UI-010: 忘记密码页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);
    
    // 验证表单
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
    
    // 填写邮箱
    await page.getByPlaceholder('name@example.com').fill('test@example.com');
    
    await page.screenshot({ path: 'tests/screenshots/010-forgot-password.png', fullPage: true });
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待响应
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/010-forgot-password-submitted.png', fullPage: true });
  });

  test('UI-011: 注册页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    
    // 验证表单元素
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
    
    await page.screenshot({ path: 'tests/screenshots/011-signup.png', fullPage: true });
    
    // 填写注册表单
    await page.getByPlaceholder('name@example.com').fill(`test${Date.now()}@example.com`);
    const passwordInputs = await page.getByPlaceholder('••••••••').all();
    await passwordInputs[0].fill('Test123456!');
    if (passwordInputs.length > 1) {
      await passwordInputs[1].fill('Test123456!');
    }
    
    await page.screenshot({ path: 'tests/screenshots/011-signup-filled.png', fullPage: true });
  });

  test('UI-012: 退出登录', async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // 导航到设置并退出
    await page.goto(`${BASE_URL}/settings`);
    
    // 点击退出按钮
    const signOutButton = page.locator('button:has-text("Sign Out")');
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'tests/screenshots/012-logout.png', fullPage: true });
  });
});