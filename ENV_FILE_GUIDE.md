# Environment File Guide

## Why `.env.local` Keeps Getting Overwritten

The **root** `.env.local` file is automatically managed by Vercel CLI. When you run:
- `vercel link`
- `vercel env pull`
- `vercel deploy`

Vercel CLI overwrites the root `.env.local` file with only `VERCEL_OIDC_TOKEN`. This is **expected behavior**.

## ✅ Solution: Use `apps/web/.env.local` for Firebase Config

Your Firebase configuration should be in **`apps/web/.env.local`**, not the root `.env.local`.

### File Structure:

```
TecheTime-main/
├── .env.local                    ← Vercel CLI manages this (only VERCEL_OIDC_TOKEN)
├── apps/
│   └── web/
│       └── .env.local           ← YOUR Firebase config goes here ✅
└── .gitignore                   ← Both are gitignored
```

### What Goes Where:

**Root `.env.local`** (managed by Vercel):
```env
# Created by Vercel CLI - DO NOT EDIT MANUALLY
VERCEL_OIDC_TOKEN="..."
```

**`apps/web/.env.local`** (your Firebase config):
```env
# Firebase Configuration (for local development)
VITE_FIREBASE_API_KEY=AIzaSyCRvtWuroG9BlURk-qlt7PcEHgRr2tmYXU
VITE_FIREBASE_AUTH_DOMAIN=tech-etime-21021.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tech-etime-21021
VITE_FIREBASE_STORAGE_BUCKET=tech-etime-21021.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=36647801711
VITE_FIREBASE_APP_ID=1:36647801711:web:36de74bda9426d1b71ce9a
VITE_USE_EMULATOR=false
```

## 🔧 How to Fix

1. **Create/Update `apps/web/.env.local`** with your Firebase config
2. **Ignore the root `.env.local`** - let Vercel manage it
3. **Never edit the root `.env.local`** manually - it will be overwritten

## 📝 Alternative: Use Different Filename for Vercel

If you want to prevent Vercel from overwriting `.env.local`, you can:

```bash
# Pull to a different file
vercel env pull .env.vercel

# Or specify environment
vercel env pull .env.local --environment=development
```

But the recommended approach is to use `apps/web/.env.local` for your config.

## ✅ Verification

Check that your Firebase config is in the right place:

```bash
# Check root (should only have VERCEL_OIDC_TOKEN)
cat .env.local

# Check web app (should have Firebase config)
cat apps/web/.env.local
```

## 🎯 Summary

- **Root `.env.local`**: Managed by Vercel CLI - don't edit it
- **`apps/web/.env.local`**: Your Firebase config - this is the correct location
- Vite automatically loads `apps/web/.env.local` when running `npm run dev` from `apps/web/`
