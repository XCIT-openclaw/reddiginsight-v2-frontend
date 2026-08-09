const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Test 1: Navigate to Dashboard with URL params
  console.log('Test 1: Navigate to Dashboard with URL params');
  await page.goto('https://reddiginsight-v2.vercel.app/dashboard?subreddit=programming&keywords=AI%20tools&timeRange=month', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  // Check if redirected to login
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  if (currentUrl.includes('/login')) {
    console.log('⚠️ Redirected to login - need authentication');
    
    // Test login
    console.log('\nTest 2: Login with test account');
    await page.fill('input[type="email"]', 'test-20260424@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    console.log('Logged in, current URL:', page.url());
    
    // Navigate to dashboard with params
    console.log('\nTest 3: Navigate to Dashboard with params after login');
    await page.goto('https://reddiginsight-v2.vercel.app/dashboard?subreddit=programming&keywords=AI%20tools&timeRange=month', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
  }
  
  // Wait for page to load
  await page.waitForTimeout(5000);
  
  // Check for parameters notification
  const notificationVisible = await page.isVisible('text=Parameters loaded from AI conversation').catch(() => false);
  console.log('Parameters notification visible:', notificationVisible);
  
  // Check input values
  const subredditValue = await page.inputValue('input[id="subreddits"]').catch(() => 'NOT FOUND');
  const keywordsValue = await page.inputValue('input[id="keywords"]').catch(() => 'NOT FOUND');
  
  console.log('Subreddit input value:', subredditValue);
  console.log('Keywords input value:', keywordsValue);
  
  // Take screenshot
  await page.screenshot({ path: '/home/ubuntu/AItools-project/ReddigInsight/reddiginsight-v2/test-result.png' });
  console.log('\nScreenshot saved to test-result.png');
  
  // Summary
  console.log('\n=== Test Summary ===');
  console.log('Notification visible:', notificationVisible ? '✅' : '❌');
  console.log('Subreddit filled:', subredditValue ? '✅ (' + subredditValue + ')' : '❌');
  console.log('Keywords filled:', keywordsValue ? '✅ (' + keywordsValue + ')' : '❌');
  
  await browser.close();
})();
