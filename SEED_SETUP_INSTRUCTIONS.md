# Seed Script Setup Instructions

## ⚠️ Required: Firebase Service Account JSON

The seed script needs a Firebase Service Account JSON to create test data. Here's how to get it:

### Step 1: Get Service Account Key

1. **Go to Firebase Console**: https://console.firebase.google.com/project/tech-etime-21021/settings/serviceaccounts/adminsdk
2. **Click "Generate New Private Key"**
3. **Click "Generate Key"** in the confirmation dialog
4. **A JSON file will download** (e.g., `tech-etime-21021-xxxxx.json`)

### Step 2: Add to Environment File

1. **Open the downloaded JSON file**
2. **Copy the entire JSON content** (it should look like):
   ```json
   {
     "type": "service_account",
     "project_id": "tech-etime-21021",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "...",
     ...
   }
   ```

3. **Open `apps/api/.env`**
4. **Paste the JSON as a single line** in `FIREBASE_SERVICE_ACCOUNT`:

   ```env
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"tech-etime-21021","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
   ```

   **Important:** 
   - The entire JSON must be on **one line**
   - Keep all the `\n` characters in the private_key field
   - Escape any quotes properly

### Step 3: Update .env File

Your `apps/api/.env` should look like:

```env
PORT=3001
FIREBASE_PROJECT_ID=tech-etime-21021
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
USE_FIREBASE_EMULATOR=false
```

### Step 4: Run Seed Script

```bash
npm run seed
```

## ✅ After Running Seed

You'll have test credentials:
- **Email:** `admin@techetime.demo`
- **Password:** `demo1234`

Sign in at `/admin` to test the application!

## 🔄 Alternative: Use Emulators

If you prefer to use emulators (requires service account anyway):

1. Set `USE_FIREBASE_EMULATOR=true` in `apps/api/.env`
2. Start emulators: `npm run emulators:start`
3. Run seed: `npm run seed`
