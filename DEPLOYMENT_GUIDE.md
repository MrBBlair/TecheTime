# Production Deployment Guide

## ✅ Build Status
- **Frontend Build**: ✅ Success
- **API Build**: ✅ Success
- **Output Directory**: `apps/web/dist`

## 🚀 Vercel Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub/GitLab/Bitbucket**
   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your repository
   - Configure project settings:
     - **Framework Preset**: Vite
     - **Root Directory**: Leave empty (root of repo)
     - **Build Command**: `npm run build --workspace=apps/web`
     - **Output Directory**: `apps/web/dist`
     - **Install Command**: `npm install` (from root)
     - **Node Version**: 18.x or higher

3. **Set Environment Variables** (in Vercel Dashboard)
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   VITE_USE_EMULATOR=false
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Root Directory**
   ```bash
   # From project root
   vercel --prod
   ```
   
   Or use the deployment script:
   ```bash
   ./deploy.sh
   ```

4. **Set Environment Variables** (via CLI or Dashboard)
   ```bash
   vercel env add VITE_FIREBASE_API_KEY
   vercel env add VITE_FIREBASE_AUTH_DOMAIN
   vercel env add VITE_FIREBASE_PROJECT_ID
   vercel env add VITE_FIREBASE_STORAGE_BUCKET
   vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
   vercel env add VITE_FIREBASE_APP_ID
   vercel env add VITE_USE_EMULATOR
   ```

## 🔧 API Deployment Options

The API needs to be deployed separately. Choose one:

### Option A: Deploy API as Separate Vercel Project (Recommended)

1. **Create New Vercel Project for API**
   - Root Directory: `apps/api`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Runtime: Node.js 18.x

2. **Set Environment Variables**
   ```
   PORT=3001
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   USE_FIREBASE_EMULATOR=false
   POSTMARK_API_TOKEN=your-token (optional)
   POSTMARK_FROM_EMAIL=noreply@yourdomain.com (optional)
   GOOGLE_AI_API_KEY=your-key (optional)
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

3. **Update Frontend API Calls**
   - Update API base URL in frontend to point to API Vercel URL
   - Or use Vercel rewrites (see `vercel.json`)

### Option B: Deploy API to Railway

1. **Create Railway Account** at [railway.app](https://railway.app)

2. **Create New Project**
   - Connect GitHub repository
   - Add Node.js service
   - Set root directory to `apps/api`

3. **Set Environment Variables** (same as Option A)

4. **Deploy**
   - Railway will auto-detect and deploy
   - Get the public URL (e.g., `https://your-api.railway.app`)

5. **Update Frontend**
   - Update API base URL to Railway URL
   - Or configure proxy in `vite.config.ts`

### Option C: Deploy API to Render

1. **Create Render Account** at [render.com](https://render.com)

2. **Create New Web Service**
   - Connect repository
   - Root Directory: `apps/api`
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: Node

3. **Set Environment Variables** (same as Option A)

4. **Deploy**
   - Render will build and deploy automatically
   - Get the public URL

## 📋 Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] API deployed and accessible
- [ ] Environment variables configured
- [ ] Firebase Authentication configured
- [ ] Firestore security rules set
- [ ] CORS configured in API to allow frontend domain
- [ ] Test user registration
- [ ] Test login/logout
- [ ] Test time clock functionality
- [ ] Test payroll reports
- [ ] Test kiosk mode

## 🔒 Firebase Security Rules

Update Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.businessId == resource.data.businessId;
    }
    
    // Businesses collection
    match /businesses/{businessId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.businessId == businessId;
      
      // Subcollections
      match /locations/{locationId} {
        allow read, write: if request.auth != null;
      }
      match /timeEntries/{entryId} {
        allow read, write: if request.auth != null;
      }
      match /deviceSessions/{sessionId} {
        allow read, write: if request.auth != null;
      }
      match /payRates/{rateId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify Node.js version (18+)
- Check build logs in Vercel dashboard

### API Not Accessible
- Verify CORS settings allow frontend domain
- Check API environment variables
- Verify Firebase service account JSON format

### Authentication Issues
- Verify Firebase Auth is enabled
- Check authorized domains in Firebase Console
- Verify API keys are correct

## 📞 Support

For issues, check:
- Vercel deployment logs
- Firebase Console logs
- Browser console errors
- Network tab for API calls
