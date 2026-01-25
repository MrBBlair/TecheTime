import { test, expect } from '@playwright/test';

test.describe('Debug Onboarding Flow', () => {
  test('Inspect actual page structure', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Get full HTML structure
    const html = await page.content();
    console.log('=== FULL HTML ===');
    console.log(html.substring(0, 2000));
    
    // Check for specific elements
    const welcomeElement = await page.locator('h1:has-text("Welcome to Tech eTime")').count();
    const landingText = await page.locator('text=Time, looped into payroll').count();
    const skipButton = await page.locator('button:has-text("Skip")').count();
    const getStartedButtons = await page.locator('button:has-text("Get Started")').count();
    
    console.log('\n=== ELEMENT COUNTS ===');
    console.log('Welcome h1:', welcomeElement);
    console.log('Landing text:', landingText);
    console.log('Skip buttons:', skipButton);
    console.log('Get Started buttons:', getStartedButtons);
    
    // Check visibility of each
    const welcomeVisible = await page.locator('h1:has-text("Welcome to Tech eTime")').isVisible().catch(() => false);
    const landingVisible = await page.locator('text=Time, looped into payroll').isVisible().catch(() => false);
    
    console.log('\n=== VISIBILITY ===');
    console.log('Welcome visible:', welcomeVisible);
    console.log('Landing visible:', landingVisible);
    
    // Check computed styles
    const welcomeStyle = await page.locator('h1:has-text("Welcome to Tech eTime")').evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        zIndex: style.zIndex,
      };
    }).catch(() => null);
    
    const landingStyle = await page.locator('text=Time, looped into payroll').evaluate(el => {
      const style = window.getComputedStyle(el.parentElement || el);
      return {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        zIndex: style.zIndex,
      };
    }).catch(() => null);
    
    console.log('\n=== COMPUTED STYLES ===');
    console.log('Welcome styles:', welcomeStyle);
    console.log('Landing styles:', landingStyle);
    
    // Check React component tree (if possible)
    const reactRoot = await page.evaluate(() => {
      // Try to find React root
      const root = document.querySelector('#root');
      return root ? root.innerHTML.substring(0, 1000) : 'No root found';
    });
    
    console.log('\n=== ROOT CONTENT ===');
    console.log(reactRoot);
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'test-results/debug-onboarding.png', fullPage: true });
    console.log('\n=== Screenshot saved to test-results/debug-onboarding.png ===');
  });
});
