import { test, expect } from '@playwright/test';

/**
 * Tests to verify the ACTUAL onboarding flow behavior
 * Based on test failures, it appears onboarding shows immediately without needing to click "Get Started"
 */
test.describe('Actual Onboarding Flow Behavior', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all storage before each test
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('ACTUAL: Onboarding shows immediately when visiting root path', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check what's actually rendered
    const bodyText = await page.locator('body').textContent();
    console.log('Body text:', bodyText?.substring(0, 500));
    
    // Check for onboarding elements
    const hasWelcome = await page.locator('h1:has-text("Welcome to Tech eTime")').isVisible().catch(() => false);
    const hasLanding = await page.locator('text=Time, looped into payroll').isVisible().catch(() => false);
    const hasSkipButton = await page.locator('button:has-text("Skip")').isVisible().catch(() => false);
    const hasGetStarted = await page.locator('button:has-text("Get Started")').isVisible().catch(() => false);
    
    console.log('What is visible:');
    console.log('  Welcome (onboarding):', hasWelcome);
    console.log('  Landing page text:', hasLanding);
    console.log('  Skip button:', hasSkipButton);
    console.log('  Get Started button:', hasGetStarted);
    
    // The actual behavior: OnboardingGuard intercepts and shows onboarding immediately
    // Landing page never renders when onboarding should show
    expect(hasWelcome).toBe(true);
    expect(hasSkipButton).toBe(true);
  });

  test('ACTUAL: Onboarding step 1 shows Welcome screen directly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should see Step 1 Welcome screen immediately
    await expect(page.locator('h1:has-text("Welcome to Tech eTime")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Track Time Easily')).toBeVisible();
    
    // Should see Get Started button on Step 1
    const getStartedButtons = page.locator('button:has-text("Get Started")');
    const count = await getStartedButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('ACTUAL: Clicking Get Started on Step 1 progresses to Step 2', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for Step 1
    await expect(page.locator('h1:has-text("Welcome to Tech eTime")')).toBeVisible({ timeout: 10000 });
    
    // Click Get Started button (should be the one in Step 1, not landing page)
    await page.locator('button:has-text("Get Started")').first().click();
    
    // Should progress to Step 2 (Auth)
    await expect(
      page.locator('h2:has-text("Sign In"), h2:has-text("Create Your Account")')
    ).toBeVisible({ timeout: 10000 });
  });

  test('ACTUAL: Landing page only shows if onboarding is completed or skipped', async ({ page }) => {
    // Set onboarding as completed
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('techetime_onboarding_completed', 'true');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Now should see landing page
    const hasLanding = await page.locator('text=Time, looped into payroll').isVisible().catch(() => false);
    const hasWelcome = await page.locator('h1:has-text("Welcome to Tech eTime")').isVisible().catch(() => false);
    
    console.log('After marking completed:');
    console.log('  Has Landing:', hasLanding);
    console.log('  Has Welcome:', hasWelcome);
    
    expect(hasLanding).toBe(true);
    expect(hasWelcome).toBe(false);
  });

  test('ACTUAL: Full onboarding flow progression', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Step 1: Welcome (should be visible immediately)
    await expect(page.locator('h1:has-text("Welcome to Tech eTime")')).toBeVisible({ timeout: 10000 });
    console.log('✓ Step 1: Welcome visible');
    
    // Click Get Started to go to Step 2
    await page.locator('button:has-text("Get Started")').first().click();
    await expect(
      page.locator('h2:has-text("Sign In"), h2:has-text("Create Your Account")')
    ).toBeVisible({ timeout: 10000 });
    console.log('✓ Step 2: Auth visible');
    
    // Select Sign Up tab
    await page.click('button:has-text("Sign Up")');
    await expect(page.locator('h2:has-text("Create Your Account")')).toBeVisible();
    console.log('✓ Sign Up form visible');
    
    // Check for form fields
    await expect(page.locator('input[name="businessName"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    console.log('✓ All Sign Up fields visible');
    
    // Click Back button
    await page.click('button:has-text("Back")');
    await expect(page.locator('h1:has-text("Welcome to Tech eTime")')).toBeVisible({ timeout: 5000 });
    console.log('✓ Back navigation works');
  });

  test('ACTUAL: Skip button behavior', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should see Skip button
    await expect(page.locator('button:has-text("Skip")')).toBeVisible({ timeout: 10000 });
    
    // Click Skip
    await page.click('button:has-text("Skip")');
    
    // Should return to landing page
    await expect(page.locator('text=Time, looped into payroll')).toBeVisible({ timeout: 10000 });
    
    // Reload - should NOT show onboarding again
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Time, looped into payroll')).toBeVisible();
    await expect(page.locator('h1:has-text("Welcome to Tech eTime")')).not.toBeVisible();
    console.log('✓ Skip persists across reload');
  });

  test('ACTUAL: Check OnboardingGuard logic flow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check localStorage state
    const onboardingState = await page.evaluate(() => {
      return {
        completed: localStorage.getItem('techetime_onboarding_completed'),
        skipped: localStorage.getItem('techetime_onboarding_skipped'),
      };
    });
    
    console.log('Onboarding state:', onboardingState);
    
    // Check what component is rendered
    const url = page.url();
    const hasOnboarding = await page.locator('h1:has-text("Welcome to Tech eTime")').isVisible().catch(() => false);
    const hasSkipButton = await page.locator('button:has-text("Skip")').isVisible().catch(() => false);
    // Check for Landing page specific elements (not just text that appears in both)
    const hasLandingGetStarted = await page.locator('button:has-text("Get Started"):not([aria-label*="onboarding"])').isVisible().catch(() => false);
    const hasLandingFooter = await page.locator('footer').isVisible().catch(() => false);
    
    console.log('Rendered components:');
    console.log('  URL:', url);
    console.log('  Has Onboarding Welcome:', hasOnboarding);
    console.log('  Has Skip Button:', hasSkipButton);
    console.log('  Has Landing Get Started:', hasLandingGetStarted);
    console.log('  Has Footer:', hasLandingFooter);
    
    // Based on OnboardingGuard logic:
    // if (!isCompleted && !isSkipped && !user) -> show OnboardingFlow
    // else -> show children (Landing page)
    
    if (!onboardingState.completed && !onboardingState.skipped) {
      // Should show onboarding (has Skip button, has Welcome heading)
      expect(hasOnboarding).toBe(true);
      expect(hasSkipButton).toBe(true);
      // Landing page elements should NOT be visible
      expect(hasLandingFooter).toBe(false);
    } else {
      // Should show landing page (has footer, no Skip button)
      expect(hasLandingFooter).toBe(true);
      expect(hasSkipButton).toBe(false);
      expect(hasOnboarding).toBe(false);
    }
  });
});
