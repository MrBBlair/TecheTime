# Actual Onboarding Flow (Verified with Playwright Tests)

## ⚠️ CRITICAL: Actual Behavior Discovered

Playwright tests reveal the **actual** onboarding flow differs from the expected flow.

## Actual Flow for New Unauthenticated Users

### Entry Point: User visits `/` (root path)

1. **OnboardingGuard intercepts immediately**
   - Checks localStorage:
     - `techetime_onboarding_completed` = null/false
     - `techetime_onboarding_skipped` = null/false
   - Checks auth state: `user` = null (not authenticated)
   - **Result**: Immediately shows `<OnboardingFlow />`
   - **Landing page NEVER renders** when onboarding should show

2. **Step 1: Welcome Screen (Shows Immediately)**
   - User sees onboarding Step 1 directly (no landing page first)
   - Contains:
     - Logo
     - "Welcome to Tech eTime" heading
     - "Time, looped into payroll" tagline (same text as Landing page!)
     - Feature highlights:
       - Track Time Easily
       - Generate Reports  
       - Secure & Simple
     - "Get Started" button
   - **Skip button** visible (top-right)

3. **Step 2: Authentication**
   - User clicks "Get Started" on Step 1
   - Shows Sign In/Sign Up toggle tabs
   - **Sign Up form** includes:
     - Business Name (required)
     - First Name (required)
     - Last Name (required)
     - Email (required)
     - Password (required, min 8 chars)
   - **Sign In form** includes:
     - Email (required)
     - Password (required)
     - Remember Me checkbox
   - After successful auth, automatically proceeds to Step 3

4. **Step 3: Profile (Optional)**
   - Avatar upload (optional)
   - Username (optional, defaults to first name)
   - "Continue" button

5. **Step 4: Tour**
   - "You're All Set!" message
   - Feature overview cards
   - Notification permission checkbox (optional)
   - "Get Started" button completes onboarding

6. **Completion**
   - Sets `techetime_onboarding_completed = 'true'`
   - If user authenticated → navigates to `/dashboard`
   - If user not authenticated → navigates to `/` (now shows Landing page)

## Key Discovery

### ❌ Expected Flow (Incorrect):
```
Landing Page → [Get Started Button] → Onboarding Step 1
```

### ✅ Actual Flow (Correct):
```
/ → OnboardingGuard → Onboarding Step 1 (immediately, no Landing page)
```

## OnboardingGuard Logic

```typescript
// From apps/web/src/App.tsx
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isCompleted, isSkipped } = useOnboarding();
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Show onboarding if not completed and not skipped, and user is not logged in
  if (!isCompleted && !isSkipped && !user) {
    return <OnboardingFlow />; // ← Intercepts and shows onboarding immediately
  }

  return <>{children}</>; // ← Only renders Landing page if onboarding done/skipped
}
```

## Landing Page Behavior

- **Landing page (`/`) only renders when:**
  - Onboarding is completed (`techetime_onboarding_completed = 'true'`), OR
  - Onboarding is skipped (`techetime_onboarding_skipped = 'true'`), OR
  - User is authenticated

- **Landing page's "Get Started" button:**
  - Calls `resetOnboarding()` which clears completed/skipped flags
  - Navigates to `/` which triggers onboarding to show again
  - This allows users to restart onboarding if needed

## Skip Functionality

- "Skip" button appears on all onboarding steps (top-right corner)
- Clicking Skip:
  - Sets `techetime_onboarding_skipped = 'true'` in localStorage
  - Navigates to `/` (now shows Landing page)
  - Onboarding won't show again until reset

## Test Results Summary

✅ **Verified Working:**
- Onboarding shows immediately for unauthenticated users (no Landing page first)
- Step progression works correctly (Step 1 → Step 2 → Step 3 → Step 4)
- Skip button works and persists across page reloads
- Back navigation works between steps
- Sign Up/Sign In forms toggle correctly
- Form validation works
- Progress bar and step indicators display correctly

⚠️ **Potential UX Issues:**
- Landing page never shows for new users (may be confusing)
- "Time, looped into payroll" appears in onboarding Step 1 (same as Landing page tagline)
- No way to see Landing page before starting onboarding without skipping
- Landing page's "Get Started" resets onboarding (may restart flow unintentionally)

## Recommendations

1. **Option A: Keep Current Behavior**
   - Document that onboarding is the entry point
   - Remove or modify Landing page "Get Started" button text
   - Make it clearer that onboarding is the primary flow

2. **Option B: Show Landing Page First**
   - Modify OnboardingGuard to show Landing page first
   - Only show onboarding after clicking "Get Started" on Landing page
   - Requires code changes to OnboardingGuard logic

3. **Option C: Hybrid Approach**
   - Show Landing page briefly with "Get Started" button
   - After click, show onboarding
   - Allows users to see branding before starting flow

## Files Involved

- `apps/web/src/App.tsx` - OnboardingGuard logic
- `apps/web/src/components/Onboarding/OnboardingFlow.tsx` - Main onboarding component
- `apps/web/src/components/Onboarding/Step1Welcome.tsx` - Step 1 (contains "Time, looped into payroll")
- `apps/web/src/pages/Landing.tsx` - Landing page (only shows after onboarding)
- `apps/web/src/contexts/OnboardingContext.tsx` - Onboarding state management
