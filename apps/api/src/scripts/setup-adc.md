# Setup Application Default Credentials (ADC) for Firebase

## What are Application Default Credentials?

Application Default Credentials (ADC) is a strategy used by Google Cloud client libraries to automatically find credentials. Instead of downloading and managing service account JSON keys, ADC uses credentials from your environment, making it:

- **More secure** - No JSON keys to manage or accidentally commit
- **Easier** - Works seamlessly with Google Cloud SDK
- **Organization-friendly** - Bypasses restrictions on service account key creation
- **Production-ready** - Works on Vercel and other platforms with proper configuration

## Prerequisites

- A Google account with access to your Firebase project
- Google Cloud SDK (gcloud CLI) installed

## Step 1: Install Google Cloud SDK

If you don't have `gcloud` installed:

### macOS
```bash
# Using Homebrew (recommended)
brew install --cask google-cloud-sdk

# Or download from:
# https://cloud.google.com/sdk/docs/install
```

### Linux
```bash
# Download and install from:
# https://cloud.google.com/sdk/docs/install
```

### Windows
Download and install from: https://cloud.google.com/sdk/docs/install

## Step 2: Authenticate with Application Default Credentials

Run this command in your terminal:

```bash
gcloud auth application-default login
```

This will:
1. Open your browser
2. Ask you to sign in with your Google account
3. Request permissions to access Google Cloud services
4. Save credentials locally

**Important:** Use the same Google account that has access to your Firebase project.

## Step 3: Set Your Firebase Project (Optional but Recommended)

To ensure you're using the correct project:

```bash
gcloud config set project YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with your Firebase project ID (e.g., `tech-etime-21021`).

## Step 4: Verify Setup

You can verify ADC is working by checking:

```bash
# Check current application default credentials
gcloud auth application-default print-access-token
```

If this returns a token, ADC is configured correctly.

## Step 5: Configure Your App

In `apps/api/.env`, make sure you have:

```env
FIREBASE_PROJECT_ID=your-project-id
# DO NOT set FIREBASE_SERVICE_ACCOUNT - ADC will be used automatically
USE_FIREBASE_EMULATOR=false
```

The Firebase Admin SDK will automatically detect and use ADC when `FIREBASE_SERVICE_ACCOUNT` is not set.

## Troubleshooting

### Error: "Could not load the default credentials"

**Solution:** Make sure you've run `gcloud auth application-default login` and selected the correct Google account.

### Error: "The caller does not have permission"

**Solution:** 
1. Verify you're using the correct Google account
2. Check that your account has access to the Firebase project
3. Try running `gcloud auth application-default login` again

### Error: "Project not found"

**Solution:**
1. Set the project explicitly: `gcloud config set project YOUR_PROJECT_ID`
2. Verify the project ID in your `.env` file matches your Firebase project

### Credentials Expired

ADC credentials can expire. If you see authentication errors:

```bash
# Re-authenticate
gcloud auth application-default login
```

### Using Multiple Google Accounts

If you need to switch between accounts:

```bash
# List all authenticated accounts
gcloud auth list

# Set a different account as default
gcloud config set account YOUR_EMAIL@example.com

# Re-authenticate with ADC
gcloud auth application-default login
```

## For Production (Vercel)

On Vercel, ADC works automatically if you:
1. Connect your Vercel project to your Google Cloud project
2. Enable the necessary APIs
3. Vercel will use its own service account automatically

Alternatively, you can set `GOOGLE_APPLICATION_CREDENTIALS` environment variable in Vercel pointing to a service account JSON (if key creation is allowed).

## Benefits Over Service Account Keys

- ✅ No need to download JSON keys
- ✅ No risk of committing keys to git
- ✅ Works with organization policies that block key creation
- ✅ Automatic credential refresh
- ✅ Easier to manage across multiple projects

## Additional Resources

- [Google Cloud ADC Documentation](https://cloud.google.com/docs/authentication/application-default-credentials)
- [Firebase Admin SDK Authentication](https://firebase.google.com/docs/admin/setup#initialize-sdk)
- [gcloud CLI Documentation](https://cloud.google.com/sdk/gcloud/reference/auth/application-default)
