import { test, expect } from '@playwright/test';

const BASE_URL = 'https://reddiginsight-v2.vercel.app';

test.describe('ReddigInsight E2E UI Tests', () => {
  
  test('01-首页: 检查关键元素', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // 检查标题是否完整显示
    const h1 = await page.locator('h1').first();
    const h1Text = await h1.textContent();
    console.log('首页 H1:', h1Text);
    
    // 检查是否有文字截断问题
    const h1Box = await h1.boundingBox();
    const h1Styles = await h1.evaluate(el => {
      return {
        overflow: window.getComputedStyle(el).overflow,
        height: window.getComputedStyle(el).height,
        lineHeight: window.getComputedStyle(el).lineHeight,
      };
    });
    console.log('首页 H1 样式:', h1Styles);
    
    // 检查 CTA 按钮是否可见
    const ctaButtons = await page.locator('button, a').filter({ hasText: 'Start' }).all();
    console.log('首页 CTA 按钮数量:', ctaButtons.length);
    
    // 检查按钮文字是否可见
    for (let i = 0; i < ctaButtons.length; i++) {
      const btn = ctaButtons[i];
      const btnText = await btn.textContent();
      const isVisible = await btn.isVisible();
      const color = await btn.evaluate(el => window.getComputedStyle(el).color);
      console.log(`按钮 ${i}: 文字="${btnText}", 可见=${isVisible}, 颜色=${color}`);
    }
    
    await page.screenshot({ path: 'tests/e2e-screenshots/01-homepage-checked.png', fullPage: true });
  });

  test('02-登录页: 检查表单元素', async ({ page }) => {
    // 先清除登录状态
    await page.context().clearCookies();
    
    await page.goto(`${BASE_URL}/login`);
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 检查输入框
    const emailInput = page.getByPlaceholder('name@example.com');
    const passwordInput = page.getByPlaceholder(/••••••••/);
    
    // 等待输入框出现
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    
    expect(await emailInput.isVisible()).toBe(true);
    expect(await passwordInput.isVisible()).toBe(true);
    
    // 检查按钮
    const submitBtn = page.locator('button[type="submit"]');
    const btnText = await submitBtn.textContent();
    console.log('登录按钮文字:', btnText);
    
    await page.screenshot({ path: 'tests/e2e-screenshots/02-login-checked.png', fullPage: true });
  });

  test('03-定价页: 检查价格显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    
    // 检查价格
    const starterPrice = page.locator('text=$9.9');
    const proPrice = page.locator('text=Coming Soon').first();
    
    expect(await starterPrice.isVisible()).toBe(true);
    expect(await proPrice.isVisible()).toBe(true);
    
    // 检查 Most Popular 标签
    const popularBadge = page.locator('text=Most Popular');
    if (await popularBadge.isVisible()) {
      const badgeBox = await popularBadge.boundingBox();
      console.log('Most Popular 标签尺寸:', badgeBox);
    }
    
    await page.screenshot({ path: 'tests/e2e-screenshots/04-pricing-checked.png', fullPage: true });
  });

  test('04-Dashboard: 登录后检查', async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com').fill('testuser2026@test.com');
    await page.getByPlaceholder(/password|••••••••/i).fill('Test123456!');
    await page.locator('button[type="submit"]').click();
    
    // 等待跳转
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // 检查标题
    const title = page.locator('text=Uncover Reddit Insights');
    expect(await title.isVisible()).toBe(true);
    
    // 检查 AI-Guided 和 Direct Input 区域
    const aiGuided = page.locator('text=AI-Guided');
    const directInput = page.locator('text=Direct Input');
    
    console.log('AI-Guided 可见:', await aiGuided.isVisible());
    console.log('Direct Input 可见:', await directInput.isVisible());
    
    await page.screenshot({ path: 'tests/e2e-screenshots/06-dashboard-checked.png', fullPage: true });
  });

  test('05-Chat: 登录后检查', async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('name@example.com').fill('testuser2026@test.com');
    await page.getByPlaceholder(/password|••••••••/i).fill('Test123456!');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // 导航到 Chat
    await page.goto(`${BASE_URL}/chat`);
    
    // 检查欢迎消息
    const welcomeMsg = page.locator('text=Hello');
    console.log('Chat 欢迎消息可见:', await welcomeMsg.isVisible());
    
    // 检查输入框
    const input = page.locator('textarea');
    console.log('Chat 输入框可见:', await input.isVisible());
    
    await page.screenshot({ path: 'tests/e2e-screenshots/07-chat-checked.png', fullPage: true });
  });
});