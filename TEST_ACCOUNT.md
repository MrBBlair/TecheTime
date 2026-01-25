# Test Account Credentials

## 🔐 Admin Test Account

Use these credentials to sign in and test the application:

**Email:** `admin@techetime.demo`  
**Password:** `demo1234`

### How to Use:
1. Navigate to `/admin` or click "Get Started" on the landing page
2. Enter the email and password above
3. You'll be automatically logged in and redirected to the Dashboard

## 👷 Worker PINs (Kiosk Mode)

These workers are pre-created for testing kiosk mode:

| Worker Name | PIN | Hourly Rate |
|------------|-----|-------------|
| John Doe | 1234 | $20.00/hr |
| Jane Smith | 5678 | $22.50/hr |
| Bob Johnson | 9012 | $18.00/hr |
| Alice Williams | 3456 | $25.00/hr |
| Charlie Brown | 7890 | $19.50/hr |

### How to Test Kiosk Mode:
1. Sign in as admin
2. Go to Dashboard → Kiosk Mode tab
3. Click "Enable Kiosk on This Device"
4. Navigate to `/kiosk`
5. Enter a worker PIN to clock in/out

## 📍 Pre-Created Locations

- **Main Office** - 123 Tech Street, San Francisco, CA 94105
- **Warehouse** - 456 Industrial Blvd, Oakland, CA 94601

## 🧪 Running the Seed Script

To create/update the test data, run:

```bash
npm run seed
```

This will:
- Create the test business
- Create the admin Firebase Auth user
- Create 5 test workers with PINs
- Create 2 locations
- Create sample time entries

## 📝 Test Scenarios

### 1. Admin Dashboard
- ✅ View locations and workers
- ✅ Add new locations
- ✅ Add new workers
- ✅ Set/reset worker PINs
- ✅ Enable kiosk mode

### 2. Time Clock
- ✅ Clock workers in/out manually
- ✅ Select location and worker
- ✅ View clock status

### 3. Payroll Reports
- ✅ Generate reports with date filters
- ✅ Filter by location or worker
- ✅ Export to CSV
- ✅ View AI insights (if API key configured)

### 4. Kiosk Mode
- ✅ Enable kiosk on device
- ✅ Enter PIN to clock in
- ✅ Enter PIN again to clock out
- ✅ View success/error messages

## 🔄 Resetting Test Data

To reset the test data:

1. **Clear Firestore data** (if using emulator):
   ```bash
   # Stop emulators and clear data
   firebase emulators:exec --only firestore "echo 'Clearing data...'"
   ```

2. **Re-run seed script**:
   ```bash
   npm run seed
   ```

3. **Reset onboarding** (in browser):
   - Open browser console
   - Run: `localStorage.removeItem('techetime_onboarding_completed')`
   - Refresh page

## ⚠️ Important Notes

- The test account uses a simple password for testing purposes
- In production, use strong, unique passwords
- Worker PINs are 4 digits for easy testing
- All test data is stored in Firestore under `demo-business`
- The seed script is idempotent - safe to run multiple times

## 🚀 Quick Start Testing

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Run the seed script** (if not already done):
   ```bash
   npm run seed
   ```

3. **Open the app**:
   - Navigate to `http://localhost:5173`
   - Click "Get Started" (or go through onboarding)
   - Sign in with: `admin@techetime.demo` / `demo1234`

4. **Test the features**:
   - Explore the Dashboard
   - Add a location
   - Add a worker
   - Test time clock
   - Generate a payroll report
   - Test kiosk mode

Enjoy testing! 🎉
