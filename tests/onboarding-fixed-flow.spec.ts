import { test, expect } from '@playwright/test';

/**
 * Tests for the FIXED onboarding flow:
 * 1. Landing page shows first
 * 2. User clicks "Get Started" 
 * 3. Navigates to /onboarding route
 * 4. Onboarding flow starts
 */
test.describe('Fixed Onboarding Flow', () => {
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

  test('FIXED: Landing page shows first for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should see Landing page, NOT onboarding
    await expect(page.locator('text=Time, looped into payroll')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Get Started")')).toBeVisible();
    
    // Should NOT see onboarding elements
    await expect(page.locator('h1:has-text("Welcome to Tech eTime")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Skip")')).not.toBeVisible();
    
    // Should see Landing page footer
    await expect(page.locator('footer')).toBeVisible();
    
    console.log('✓ Landing page shows first');
  });

  test('FIXED: Clicking Get Started navigates to onboarding', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on landing page
    await expect(page.locator('text=Time, looped into payroll')).toBeVisible({ timeout: 10000 });
    
    // Click Get Started button
    await page.click('button:has-text("Get Started")');
    
    // Should navigate to /onboarding route
    await expect(page).toHaveURL(/.*\/onboarding/, { timeout: 5000 });
    
    // Should now see onboarding Step 1
    await expect(page.locator('h1:has-text("Welcome to Tech eTime")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Skip")')).toBeVisible();
    
    console.log('✓ Get Started navigates to onboarding');
  });

  test('FIXED: Onboarding flow progresses correctly', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    
    // Step 1: Welcome
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
    await expect(page.locator('input[name="businessName"]')).toBeVisible();
    console.log('✓ Sign Up form visible');
  });

  test('FIXED: Skip button redirects to landing page', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    
    // Should see onboarding
    await expect(page.locator('h1:has-text("Welcome to Tech eTime")')).toBeVisible({ timeout: 10000 });
    
    // Click Skip
    await page.click('button:has-text("Skip")');
    
    // Should redirect to landing page
    await expect(page).toHaveURL(/.*\/$/, { timeout: 5000 });
    await expect(page.locator('text=Time, looped into payroll')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h1:has-text("Welcome to Tech eTime")')).not.toBeVisible();
    
    console.log('✓ Skip redirects to landing page');
  });

  test('FIXED: Landing page shows after onboarding is skipped', async ({ page }) => {
    // First, skip onboarding
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Skip")');
    await expect(page).toHaveURL(/.*\/$/, { timeout: 5000 });
    
    // Reload page - should still show landing page (not onboarding)
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('text=Time, looped into payroll')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h1:has-text("Welcome to Tech eTime")')).not.toBeVisible();
    
    console.log('✓ Landing page persists after skip');
  });

  test('FIXED: Direct /onboarding access shows onboarding if conditions met', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    
    // Should see onboarding (not completed, not skipped, not authenticated)
    await expect(page.locator('h1:has-text("Welcome to Tech eTime")')).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Direct /onboarding access works');
  });

  test('FIXED: Direct /onboarding redirects if onboarding already completed', async ({ page }) => {
    // Mark onboarding as completed
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('techetime_onboarding_completed', 'true');
    });
    
    // Try to access /onboarding
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to landing page
    await expect(page).toHaveURL(/.*\/$/, { timeout: 5000 });
    await expect(page.locator('text=Time, looped into payroll')).toBeVisible({ timeout: 5000 });
    
    console.log('✓ Completed onboarding redirects correctly');
  });

  test('FIXED: Full flow - Landing → Get Started → Onboarding → Complete', async ({ page }) => {
    // Step 1: Landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Time, looped into payroll')).toBeVisible({ timeout: 10000 });
    console.log('✓ Step 1: Landing page visible');
    
    // Step 2: Click Get Started
    await page.click('button:has-text("Get Started")');
    await expect(page).toHaveURL(/.*\/onboarding/, { timeout: 5000 });
    await expect(page.locator('h1:has-text("Welcome to Tech eTime")')).toBeVisible({ timeout: 10000 });
    console.log('✓ Step 2: Navigated to onboarding');
    
    // Step 3: Progress through onboarding steps
    await page.locator('button:has-text("Get Started")').first().click();
    await expect(
      page.locator('h2:has-text("Sign In"), h2:has-text("Create Your Account")')
    ).toBeVisible({ timeout: 10000 });
    console.log('✓ Step 3: Auth step visible');
    
    // Can navigate back
    await page.click('button:has-text("Back")');
    await expect(page.locator('h1:has-text("Welcome to Tech eTime")')).toBeVisible({ timeout: 5000 });
    console.log('✓ Step 4: Back navigation works');
  });
});
