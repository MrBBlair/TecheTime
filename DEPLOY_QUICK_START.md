# Quick Deploy Guide

## 🚀 One-Command Deployment

```bash
npm run deploy
```

That's it! The script will:
1. ✅ Build your project
2. ✅ Read environment variables from `.env` files
3. ✅ Set them in Vercel (production, preview, development)
4. ✅ Deploy to Vercel

## 📋 Prerequisites

1. **Vercel CLI installed** (script will install if missing)
   ```bash
   npm install -g vercel
   ```

2. **Logged into Vercel** (script will prompt if needed)
   ```bash
   vercel login
   ```

3. **Environment variables set** in one of these files:
   - `apps/web/.env.local` (recommended)
   - `apps/web/.env`
   - `.env.local`
   - `.env`

## 📝 Environment Variables Needed

Create `apps/web/.env.local` with:

```env
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_USE_EMULATOR=false
```

## 🎯 What Happens During Deployment

1. **Build Check**: Verifies project builds successfully
2. **Environment Detection**: Reads variables from `.env` files
3. **Vercel Setup**: Sets variables in Vercel for all environments
4. **Deployment**: Deploys to Vercel (production or preview)

## 💡 Tips

- Use `.env.local` files (they're gitignored, safe for secrets)
- Script sets variables for production, preview, AND development
- You can run `npm run deploy` multiple times safely
- Variables already set in Vercel won't be overwritten

## 🆘 Troubleshooting

**"Vercel CLI not found"**
```bash
npm install -g vercel
```

**"Not logged in"**
```bash
vercel login
```

**"Build failed"**
```bash
npm install
npm run build
```

**"Environment variables not found"**
- Check file location: `apps/web/.env.local`
- Verify variable names start with `VITE_`
- Ensure no extra spaces or quotes

## 📚 More Info

See `DEPLOYMENT_SCRIPT_README.md` for detailed documentation.
