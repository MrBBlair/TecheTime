# Production Environment Setup Guide

## ✅ Current Status

You have Firebase credentials in `apps/web/.env.local`. For production, these need to be set in your deployment platform (Vercel).

## 🚀 Quick Setup Options

### Option 1: Use Deployment Script (Recommended)

The deployment scripts automatically read from `.env.local` and set variables in Vercel:

```bash
# Node.js script (cross-platform)
npm run deploy

# OR Bash script (Unix/macOS/Linux)
./deploy-vercel.sh
```

The script will:
- ✅ Read variables from `apps/web/.env.local`
- ✅ Automatically set them in Vercel for production, preview, and development
- ✅ Handle the deployment process

### Option 2: Manual Setup via Vercel CLI

If you prefer to set variables manually:

```bash
# Frontend variables (from apps/web/.env.local)
vercel env add VITE_FIREBASE_API_KEY production
# Enter: AIzaSyCRvtWuroG9BlURk-qlt7PcEHgRr2tmYXU

vercel env add VITE_FIREBASE_AUTH_DOMAIN production
# Enter: tech-etime-21021.firebaseapp.com

vercel env add VITE_FIREBASE_PROJECT_ID production
# Enter: tech-etime-21021

vercel env add VITE_FIREBASE_STORAGE_BUCKET production
# Enter: tech-etime-21021.firebasestorage.app

vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
# Enter: 36647801711

vercel env add VITE_FIREBASE_APP_ID production
# Enter: 1:36647801711:web:36de74bda9426d1b71ce9a

vercel env add VITE_USE_EMULATOR production
# Enter: false
```

### Option 3: Via Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: `VITE_FIREBASE_API_KEY`
   - **Value**: `AIzaSyCRvtWuroG9BlURk-qlt7PcEHgRr2tmYXU`
   - **Environment**: Select `Production`, `Preview`, and `Development`
4. Repeat for all variables listed above

## 🔧 API Configuration

For the API server, ensure these are set in your API deployment:

### Required Variables:
```bash
NODE_ENV=production
FIREBASE_PROJECT_ID=tech-etime-21021
USE_FIREBASE_EMULATOR=false
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Firebase Authentication (Choose One):

**Option A: Application Default Credentials (Recommended)**
- No additional env vars needed
- Set up via: `gcloud auth application-default login`
- See: `apps/api/src/scripts/setup-adc.md`

**Option B: Service Account JSON**
```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"tech-etime-21021",...}
```
- Get from: Firebase Console → Project Settings → Service Accounts
- See: `apps/api/src/scripts/get-service-account.md`

## ✅ Verification Checklist

After setting up, verify:

- [ ] Frontend variables set in Vercel (all `VITE_*` variables)
- [ ] `VITE_USE_EMULATOR=false` in production
- [ ] API has `NODE_ENV=production`
- [ ] API has `FIREBASE_PROJECT_ID` set
- [ ] API has `USE_FIREBASE_EMULATOR=false`
- [ ] API has Firebase credentials (ADC or service account)
- [ ] Firebase authorized domains include your Vercel domain
- [ ] CORS settings allow your frontend domain

## 🔍 Verify Current Setup

Check if variables are set in Vercel:
```bash
vercel env ls
```

## 📝 Important Notes

1. **`.env.local` is for local development only** - it's gitignored and won't be deployed
2. **Production requires variables in Vercel** - set via dashboard, CLI, or deployment script
3. **API needs `NODE_ENV=production`** - this automatically disables auth bypass
4. **Firebase authorized domains** - add your Vercel domain in Firebase Console → Authentication → Settings → Authorized domains

## 🚨 Security Reminders

- ✅ Never commit `.env.local` to git (it's already in `.gitignore`)
- ✅ Use different Firebase projects for dev/staging/production if possible
- ✅ Rotate API keys if they've been exposed
- ✅ Use environment-specific credentials
