# Setup Seed Script - Firebase Service Account

## 🔑 Required: Firebase Service Account

The seed script needs a Firebase Service Account to create users and data. Here's how to get it:

### Step 1: Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **tech-etime-21021**
3. Click the gear icon ⚙️ → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. A JSON file will download

### Step 2: Add to Environment File

1. Open the downloaded JSON file
2. Copy the entire JSON content
3. Open `apps/api/.env`
4. Paste the JSON as a **single line** in `FIREBASE_SERVICE_ACCOUNT`:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"tech-etime-21021","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Important:** The entire JSON must be on one line with escaped quotes.

### Step 3: Run Seed Script

```bash
npm run seed
```

## ✅ Alternative: Use Emulators (No Service Account Needed)

If you prefer to test locally without a service account:

1. **Update `apps/api/.env`**:
   ```env
   USE_FIREBASE_EMULATOR=true
   FIREBASE_PROJECT_ID=demo-project
   ```

2. **Start emulators** (in separate terminal):
   ```bash
   npm run emulators:start
   ```

3. **Run seed script**:
   ```bash
   npm run seed
   ```

## 📋 After Running Seed

You'll have test credentials:
- **Email:** `admin@techetime.demo`
- **Password:** `demo1234`

Sign in at `/admin` to test the application!
