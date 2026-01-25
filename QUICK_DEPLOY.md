# Quick Deployment Guide

## ✅ Pre-Deployment Checklist

- [x] Build successful (`npm run build`)
- [x] Dependencies installed
- [x] TypeScript errors fixed
- [x] Vercel configuration ready

## 🚀 Deploy Now

### Quick Deploy (Recommended)

1. **Push to Git** (if not already)
   ```bash
   git init
   git add .
   git commit -m "Ready for production"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy via Vercel Dashboard**
   - Go to https://vercel.com/new
   - Import your Git repository
   - **Important Settings**:
     - Root Directory: Leave empty (use root)
     - Build Command: `npm run build --workspace=apps/web`
     - Output Directory: `apps/web/dist`
     - Install Command: `npm install`
   - Add environment variables (see below)
   - Click "Deploy"

3. **Set Environment Variables** in Vercel Dashboard:
   ```
   VITE_FIREBASE_API_KEY=your-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   VITE_USE_EMULATOR=false
   ```

### Or Use CLI

```bash
# Install Vercel CLI (if needed)
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## 📦 Build Output

- **Frontend**: `apps/web/dist/` ✅
- **API**: `apps/api/dist/` ✅

## ⚠️ Important Notes

1. **API Deployment**: The API must be deployed separately (see `DEPLOYMENT_GUIDE.md`)
2. **Environment Variables**: Must be set in Vercel dashboard before first deploy
3. **Firebase**: Ensure Firebase project is configured and authorized domains are set
4. **CORS**: Update API CORS settings after frontend deployment

## 🔗 Next Steps

After frontend deployment:
1. Deploy API (separate Vercel project or Railway/Render)
2. Update API `FRONTEND_URL` environment variable
3. Update Firebase authorized domains
4. Test production deployment

See `DEPLOYMENT_GUIDE.md` for detailed instructions.
