# Deployment Scripts Guide

## Available Scripts

Two deployment scripts are available for deploying to Vercel with automatic environment variable setup:

### 1. Node.js Script (Cross-platform) - **Recommended**
```bash
npm run deploy
```
or
```bash
node deploy-vercel.js
```

**Features:**
- ✅ Works on Windows, macOS, and Linux
- ✅ Reads environment variables from `.env` files
- ✅ Interactive prompts for deployment options
- ✅ Sets environment variables for production, preview, and development
- ✅ Handles build process automatically

### 2. Bash Script (Unix/macOS/Linux)
```bash
npm run deploy:bash
```
or
```bash
./deploy-vercel.sh
```

**Features:**
- ✅ Same functionality as Node.js script
- ✅ Requires bash shell
- ✅ May not work on Windows without WSL/Git Bash

## How It Works

### 1. Environment Variable Detection

The scripts automatically detect environment variables from:
- `apps/web/.env.local` (highest priority)
- `apps/web/.env`
- `apps/api/.env.local`
- `apps/api/.env`
- `.env.local`
- `.env`
- System environment variables

### 2. Frontend Variables Set

The following variables are automatically set in Vercel:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_USE_EMULATOR` (defaults to `false` if not set)

### 3. API Variables (Optional)

If you choose to deploy the API to Vercel, these variables are also set:
- `PORT` (defaults to `3001`)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT`
- `USE_FIREBASE_EMULATOR` (defaults to `false`)
- `POSTMARK_API_TOKEN` (optional)
- `POSTMARK_FROM_EMAIL` (optional)
- `GOOGLE_AI_API_KEY` (optional)
- `FRONTEND_URL`

## Usage

### Quick Start

1. **Create environment files** (if not already created):
   ```bash
   # Copy example file
   cp .env.example apps/web/.env.local
   
   # Edit with your values
   nano apps/web/.env.local  # or use your preferred editor
   ```

2. **Run deployment script**:
   ```bash
   npm run deploy
   ```

3. **Follow prompts**:
   - The script will ask if you're deploying the API
   - Choose production or preview deployment
   - Environment variables will be set automatically

### Manual Environment Variable Setup

If you prefer to set environment variables manually:

1. **Via Vercel Dashboard**:
   - Go to your project in Vercel
   - Settings → Environment Variables
   - Add each variable manually

2. **Via Vercel CLI**:
   ```bash
   vercel env add VITE_FIREBASE_API_KEY production
   # Enter value when prompted
   ```

## Environment File Format

Your `.env` or `.env.local` files should look like:

```env
# Frontend (apps/web/.env.local)
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_USE_EMULATOR=false

# API (apps/api/.env.local) - if deploying API
PORT=3001
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
USE_FIREBASE_EMULATOR=false
POSTMARK_API_TOKEN=your-token
POSTMARK_FROM_EMAIL=noreply@yourdomain.com
GOOGLE_AI_API_KEY=your-key
FRONTEND_URL=https://your-app.vercel.app
```

## Troubleshooting

### Script fails to find Vercel CLI
```bash
npm install -g vercel
```

### Environment variables not being set
- Check that your `.env` files are in the correct location
- Verify variable names match exactly (case-sensitive)
- Check that values don't have extra quotes or spaces

### Build fails
- Run `npm install` first
- Check for TypeScript errors: `npm run build`
- Verify all dependencies are installed

### Deployment fails
- Check Vercel authentication: `vercel whoami`
- Verify project is linked: `vercel link`
- Check Vercel dashboard for error logs

## Security Notes

⚠️ **Important**: 
- Never commit `.env.local` files to git (they're in `.gitignore`)
- Use `.env.local` for local development secrets
- Use Vercel dashboard for production secrets
- The script reads from `.env.local` but doesn't commit them

## Next Steps After Deployment

1. ✅ Verify deployment in Vercel dashboard
2. ✅ Test the deployed application
3. ✅ Deploy API separately if needed
4. ✅ Update Firebase authorized domains
5. ✅ Update API CORS settings
6. ✅ Test all functionality in production
