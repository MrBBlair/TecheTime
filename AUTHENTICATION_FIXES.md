# Authentication & Permission Fixes

This document describes the fixes applied to resolve Firebase authentication and Firestore permission errors.

## Issues Identified

1. **400 Bad Request on Login**: Invalid credentials or authentication configuration issue
2. **Missing or Insufficient Permissions**: Firestore security rules not properly handling SUPERADMIN users

## Fixes Applied

### 1. Updated Firestore Security Rules

**File**: `firestore.rules`

**Changes**:
- Added `isSuperAdmin()` helper function to check if a user has SUPERADMIN role
- Updated user document read rules to allow SUPERADMIN to read any user document
- Updated business write rules to allow SUPERADMIN to write to any business
- Updated subcollection rules (locations, timeEntries, deviceSessions, payRates) to explicitly allow SUPERADMIN access

**Key Updates**:
```javascript
function isSuperAdmin() {
  return request.auth != null && 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'SUPERADMIN';
}

// Users can read their own document, SUPERADMIN can read any user document
allow read: if request.auth != null && 
               (request.auth.uid == userId || 
                (request.auth.uid != userId && isSuperAdmin()));
```

### 2. Improved Error Handling in AuthContext

**File**: `apps/web/src/contexts/AuthContext.tsx`

**Changes**:
- Enhanced `login()` function with better error messages for different Firebase Auth error codes
- Improved `loadUserData()` function to handle permission errors gracefully
- Added try-catch blocks with specific error handling
- Updated `setSelectedBusinessId()` to allow SUPERADMIN to select any business

**Error Messages Added**:
- Invalid credentials: "Invalid email or password. Please check your credentials and try again."
- Invalid email: "Invalid email address format."
- Disabled account: "This account has been disabled. Please contact support."
- Too many requests: "Too many failed login attempts. Please try again later."
- Permission denied: "Permission denied. Please contact support if this issue persists."

### 3. SUPERADMIN Business Selection

**Changes**:
- SUPERADMIN users can now select any business ID, even if they're not a member
- Business loading logic updated to handle SUPERADMIN users without assigned businesses
- Improved handling of users without business assignments (normal for SUPERADMIN)

## Deployment Steps

### 1. Deploy Firestore Rules

The updated Firestore rules must be deployed to Firebase:

```bash
firebase deploy --only firestore:rules
```

Or deploy via Firebase Console:
1. Go to Firebase Console → Firestore Database → Rules
2. Copy the updated rules from `firestore.rules`
3. Click "Publish"

### 2. Verify User Documents

Ensure SUPERADMIN users have proper user documents in Firestore:

```bash
cd apps/api
npm run create-superadmin
```

This will verify/create user documents for:
- `bccquedog@gmail.com` (UID: VgW2Z2bt41b5wFSTmuKUnFZPdIa2)
- `bblair@techephi.com` (UID: rmpX8ifRRnebMGSVaS4hi60M6hw2)

### 3. Test Authentication

1. Try logging in with SUPERADMIN credentials
2. Verify user data loads correctly
3. Check browser console for any remaining errors
4. Verify SUPERADMIN can access admin features

## Troubleshooting

### If Login Still Fails with 400 Bad Request

1. **Verify Firebase Auth User Exists**:
   - Check Firebase Console → Authentication → Users
   - Ensure the user email exists
   - Verify the user is not disabled

2. **Check Credentials**:
   - Ensure email and password are correct
   - Try resetting password if needed

3. **Verify Firebase Configuration**:
   - Check `.env.local` has correct Firebase API keys
   - Verify `VITE_FIREBASE_API_KEY` matches Firebase project

### If Permission Errors Persist

1. **Verify Firestore Rules Deployed**:
   - Check Firebase Console → Firestore → Rules
   - Ensure rules match `firestore.rules` file
   - Rules should show `isSuperAdmin()` function

2. **Check User Document**:
   - Verify user document exists in Firestore: `users/{userId}`
   - Check `role` field is set to `"SUPERADMIN"`
   - Verify `isActive` is `true`

3. **Check Browser Console**:
   - Look for specific error codes
   - Check network tab for failed requests
   - Verify Firebase Auth token is being generated

## Testing Checklist

- [ ] Firestore rules deployed successfully
- [ ] SUPERADMIN user documents exist and have correct role
- [ ] Login works with SUPERADMIN credentials
- [ ] User data loads without permission errors
- [ ] SUPERADMIN can access admin settings
- [ ] SUPERADMIN can access super admin guide
- [ ] No console errors after login

## Additional Notes

- SUPERADMIN users don't need to belong to a business to access the system
- SUPERADMIN can access any business by specifying the business ID
- All SUPERADMIN actions should be logged for security auditing
- Regular users (OWNER, MANAGER, WORKER) are not affected by these changes
