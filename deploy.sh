#!/bin/bash
# Production Deployment Script for Tech eTime

echo "🚀 Tech eTime - Production Deployment"
echo "======================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Check if user is logged in to Vercel
echo "🔐 Checking Vercel authentication..."
vercel whoami &> /dev/null

if [ $? -ne 0 ]; then
    echo "⚠️  Not logged in to Vercel. Please login:"
    vercel login
fi

# Deploy to Vercel
echo ""
echo "🌐 Deploying to Vercel..."
echo ""

# Deploy from web directory
cd apps/web
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Deploy API separately (see DEPLOYMENT_GUIDE.md)"
echo "3. Update API CORS settings"
echo "4. Test production deployment"
