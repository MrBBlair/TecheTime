# Quick Test Account Setup

## 🚀 Fastest Way to Create Test Account

Since you already have Firebase environment variables set up, here's the quickest path:

### Step 1: Create API Environment File

Create `apps/api/.env` with your Firebase project ID:

```env
FIREBASE_PROJECT_ID=tech-etime-21021
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"tech-etime-21021",...}
USE_FIREBASE_EMULATOR=false
PORT=3001
```

**Note:** You'll need to get your Firebase Service Account JSON from Firebase Console:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Copy the JSON and paste it as a single line in `FIREBASE_SERVICE_ACCOUNT`

### Step 2: Run Seed Script

```bash
npm run seed
```

### Step 3: Sign In

Use these credentials:
- **Email:** `admin@techetime.demo`
- **Password:** `demo1234`

## 📋 What Gets Created

✅ **Business:** Tech eTime Demo Business  
✅ **Admin User:** admin@techetime.demo  
✅ **5 Workers:** With PINs for kiosk testing  
✅ **2 Locations:** Main Office & Warehouse  
✅ **Sample Time Entry:** For testing reports  

## 🧪 Test Credentials

### Admin Login
- Email: `admin@techetime.demo`
- Password: `demo1234`

### Worker PINs (Kiosk Mode)
- John Doe: `1234`
- Jane Smith: `5678`
- Bob Johnson: `9012`
- Alice Williams: `3456`
- Charlie Brown: `7890`

## 💡 Development Helper

When running in development mode, a "Test Account" button appears on the login page (`/admin`) showing these credentials for quick access.

## ⚠️ If Seed Fails

If you get "Unable to detect Project Id":
1. Make sure `apps/api/.env` exists
2. Verify `FIREBASE_PROJECT_ID` matches your Firebase project
3. Ensure `FIREBASE_SERVICE_ACCOUNT` is valid JSON (as a single line)

For more details, see `CREATE_TEST_ACCOUNT.md`.
