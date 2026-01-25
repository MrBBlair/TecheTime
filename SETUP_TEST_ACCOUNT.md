# Setup Test Account - Quick Guide

## 🚀 Quick Setup

### Option 1: Using Firebase Emulators (Recommended for Testing)

1. **Set up environment variables** in `apps/api/.env`:
   ```env
   USE_FIREBASE_EMULATOR=true
   FIREBASE_PROJECT_ID=demo-project
   ```

2. **Start Firebase emulators**:
   ```bash
   npm run emulators:start
   ```
   (Keep this running in a separate terminal)

3. **Run the seed script**:
   ```bash
   npm run seed
   ```

### Option 2: Using Real Firebase

1. **Set up environment variables** in `apps/api/.env`:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   USE_FIREBASE_EMULATOR=false
   ```

2. **Run the seed script**:
   ```bash
   npm run seed
   ```

## 📋 Test Account Credentials

After running the seed script, use these credentials:

**Email:** `admin@techetime.demo`  
**Password:** `demo1234`

## 🧪 Testing Steps

1. **Start the app**:
   ```bash
   npm run dev
   ```

2. **Sign in**:
   - Go to `http://localhost:5173`
   - Click "Get Started" (or navigate to `/admin`)
   - Sign in with the credentials above

3. **Test features**:
   - Dashboard: View locations and workers
   - Time Clock: Clock workers in/out
   - Payroll: Generate reports
   - Kiosk Mode: Test PIN-based clock in/out

## 👷 Worker PINs for Kiosk Testing

- John Doe: `1234`
- Jane Smith: `5678`
- Bob Johnson: `9012`
- Alice Williams: `3456`
- Charlie Brown: `7890`

## 📝 Notes

- The seed script is idempotent - safe to run multiple times
- If a user already exists, it will use the existing user
- All test data is created under `demo-business`
- Worker PINs are hashed with bcrypt for security

For more details, see `TEST_ACCOUNT.md`.
