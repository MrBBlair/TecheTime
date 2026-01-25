# Create Test Account - Step by Step

## 🎯 Quick Setup (2 Options)

### Option A: Using Real Firebase (You Already Have This Set Up)

Since you mentioned you already have environment variables established:

1. **Verify your API environment** (`apps/api/.env` exists with):
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   USE_FIREBASE_EMULATOR=false
   ```

2. **Run the seed script**:
   ```bash
   npm run seed
   ```

3. **Sign in with test credentials**:
   - Email: `admin@techetime.demo`
   - Password: `demo1234`

### Option B: Using Firebase Emulators (For Local Testing)

1. **Create `apps/api/.env`**:
   ```env
   USE_FIREBASE_EMULATOR=true
   FIREBASE_PROJECT_ID=demo-project
   PORT=3001
   ```

2. **Start emulators** (in a separate terminal):
   ```bash
   npm run emulators:start
   ```

3. **Run seed script** (in another terminal):
   ```bash
   npm run seed
   ```

## 📋 Test Account Details

After running the seed script, you'll have:

### Admin Account
- **Email:** `admin@techetime.demo`
- **Password:** `demo1234`
- **Role:** Owner
- **Business:** Tech eTime Demo Business

### Pre-Created Workers (for Kiosk Mode)
| Name | PIN | Hourly Rate |
|------|-----|-------------|
| John Doe | 1234 | $20.00/hr |
| Jane Smith | 5678 | $22.50/hr |
| Bob Johnson | 9012 | $18.00/hr |
| Alice Williams | 3456 | $25.00/hr |
| Charlie Brown | 7890 | $19.50/hr |

### Pre-Created Locations
- Main Office (123 Tech Street, San Francisco, CA)
- Warehouse (456 Industrial Blvd, Oakland, CA)

## 🧪 Testing Workflow

1. **Start the app**:
   ```bash
   npm run dev
   ```

2. **Sign in**:
   - Go to `http://localhost:5173`
   - Click "Get Started" (or go to `/admin`)
   - Use: `admin@techetime.demo` / `demo1234`

3. **Test features**:
   - ✅ Dashboard - View and manage locations/workers
   - ✅ Time Clock - Clock workers in/out
   - ✅ Payroll Reports - Generate reports with filters
   - ✅ Kiosk Mode - Test PIN-based clock in/out

## 💡 Test Credentials Helper

In development mode, a "Test Account" button appears on the login page showing the credentials for easy access.

## 🔄 Re-seeding

The seed script is safe to run multiple times:
- If the user exists, it uses the existing user
- If data exists, it may update it
- Run `npm run seed` anytime to refresh test data

## ⚠️ Troubleshooting

### "Unable to detect a Project Id"
- Make sure `apps/api/.env` exists with `FIREBASE_PROJECT_ID`
- Or set `USE_FIREBASE_EMULATOR=true` for local testing

### "Email already exists"
- This is normal - the script will use the existing user
- You can still sign in with the same credentials

### Seed script completes but can't sign in
- Check that Firebase Auth is enabled in your Firebase Console
- Verify the email domain is authorized
- Check browser console for errors

## 📝 Next Steps

After creating the test account:
1. Sign in and explore the Dashboard
2. Test adding new locations
3. Test adding new workers
4. Test time clock functionality
5. Generate a payroll report
6. Test kiosk mode with worker PINs

Happy testing! 🎉
