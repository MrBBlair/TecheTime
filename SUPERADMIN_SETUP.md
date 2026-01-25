# SUPERADMIN Role Setup

This document describes the SUPERADMIN role implementation and setup.

## Overview

The SUPERADMIN role has been added to Tech eTime to provide system-wide administrative access. SUPERADMIN users have elevated privileges compared to regular OWNER and MANAGER roles.

## SUPERADMIN Privileges

1. **Cross-Business Access**: SUPERADMIN users can access any business in the system, bypassing normal business membership checks
2. **Admin Access**: SUPERADMIN has all the same privileges as OWNER and MANAGER roles
3. **System-Wide Operations**: Can perform administrative operations across all businesses

## Created SUPERADMIN Users

The following users have been assigned the SUPERADMIN role:

1. **bccquedog@gmail.com** (UID: `VgW2Z2bt41b5wFSTmuKUnFZPdIa2`)
2. **bblair@techephi.com** (UID: `rmpX8ifRRnebMGSVaS4hi60M6hw2`)

## Changes Made

### Backend Changes

1. **Type Definitions** (`packages/shared/src/types.ts`)
   - Added `'SUPERADMIN'` to `UserRole` type

2. **Schemas** (`packages/shared/src/schemas.ts`)
   - Updated `createUserSchema` to allow `'SUPERADMIN'` role
   - Updated `updateUserSchema` to allow `'SUPERADMIN'` role

3. **Authentication Middleware** (`apps/api/src/middleware/auth.ts`)
   - Updated `requireAuth()` to bypass business access checks for SUPERADMIN
   - Updated `requireAdmin()` to allow SUPERADMIN access

4. **Script** (`apps/api/src/scripts/create-superadmin.ts`)
   - Created script to assign SUPERADMIN role to specified users
   - Script handles both Firebase Auth and Firestore user documents

### Frontend Changes

1. **App Routes** (`apps/web/src/App.tsx`)
   - Updated admin route guards to include SUPERADMIN

2. **Admin Pages**
   - `AdminSettings.tsx`: Updated access check to include SUPERADMIN
   - `AdminGuide.tsx`: Updated access check and documentation to include SUPERADMIN

3. **Layout Component** (`apps/web/src/components/Layout.tsx`)
   - Updated admin menu visibility to include SUPERADMIN

## Running the Script

To create or update SUPERADMIN users, run:

```bash
cd apps/api
npm run create-superadmin
```

The script will:
- Check if Firebase Auth users exist (create if missing)
- Create or update Firestore user documents with SUPERADMIN role
- Set `isActive: true` for all SUPERADMIN users

## Script Configuration

To add more SUPERADMIN users, edit `apps/api/src/scripts/create-superadmin.ts` and add entries to the `SUPERADMIN_USERS` array:

```typescript
const SUPERADMIN_USERS = [
  {
    uid: 'YOUR_FIREBASE_UID',
    email: 'your-email@example.com',
  },
  // Add more users here
];
```

## Security Considerations

1. **Limited Access**: Only specific Firebase UIDs are granted SUPERADMIN role
2. **No Business Requirement**: SUPERADMIN users don't need to belong to a business
3. **Audit Trail**: All SUPERADMIN operations should be logged for security auditing
4. **Regular Review**: Periodically review SUPERADMIN users and remove access when no longer needed

## Testing

To verify SUPERADMIN access:

1. Log in as a SUPERADMIN user
2. Verify access to Admin Settings and Admin Guide pages
3. Verify ability to access multiple businesses (if applicable)
4. Verify all admin operations work correctly

## Future Enhancements

Potential improvements:
- Add SUPERADMIN-specific dashboard
- Add audit logging for SUPERADMIN actions
- Add SUPERADMIN management interface
- Add SUPERADMIN-specific permissions/restrictions
