#!/bin/bash
# Tech eTime - Vercel Deployment Script with Environment Variables
# This script builds the project, sets environment variables in Vercel, and deploys

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Tech eTime - Vercel Deployment${NC}"
echo "======================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if user is logged in to Vercel
echo -e "${BLUE}🔐 Checking Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel. Please login:${NC}"
    vercel login
fi

# Get current user
VERCEL_USER=$(vercel whoami)
echo -e "${GREEN}✅ Logged in as: ${VERCEL_USER}${NC}"
echo ""

# Build the project first
echo -e "${BLUE}📦 Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Please fix errors before deploying.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"
echo ""

# Function to set environment variable in Vercel
set_env_var() {
    local key=$1
    local value=$2
    local env_type=${3:-production}  # Default to production
    
    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  Skipping ${key} (empty value)${NC}"
        return
    fi
    
    echo -e "${BLUE}📝 Setting ${key}...${NC}"
    echo "$value" | vercel env add "$key" "$env_type" --yes 2>&1 | grep -v "Already exists" || true
}

# Function to read environment variable from file
read_env_from_file() {
    local file=$1
    local key=$2
    
    if [ ! -f "$file" ]; then
        return 1
    fi
    
    # Extract value from .env file (handles quoted and unquoted values)
    grep "^${key}=" "$file" | cut -d '=' -f2- | sed 's/^"//' | sed 's/"$//' | sed "s/^'//" | sed "s/'$//"
}

# Check for environment files
ENV_WEB_FILE="apps/web/.env"
ENV_WEB_LOCAL_FILE="apps/web/.env.local"
ENV_API_FILE="apps/api/.env"
ENV_API_LOCAL_FILE="apps/api/.env.local"
ENV_ROOT_FILE=".env"
ENV_ROOT_LOCAL_FILE=".env.local"

# Determine which env file to use (priority: .env.local > .env)
WEB_ENV_FILE=""
API_ENV_FILE=""

if [ -f "$ENV_WEB_LOCAL_FILE" ]; then
    WEB_ENV_FILE="$ENV_WEB_LOCAL_FILE"
elif [ -f "$ENV_WEB_FILE" ]; then
    WEB_ENV_FILE="$ENV_WEB_FILE"
fi

if [ -f "$ENV_API_LOCAL_FILE" ]; then
    API_ENV_FILE="$ENV_API_LOCAL_FILE"
elif [ -f "$ENV_API_FILE" ]; then
    API_ENV_FILE="$ENV_API_FILE"
fi

# Check for root .env file (for shared variables)
if [ -f "$ENV_ROOT_LOCAL_FILE" ]; then
    ROOT_ENV_FILE="$ENV_ROOT_LOCAL_FILE"
elif [ -f "$ENV_ROOT_FILE" ]; then
    ROOT_ENV_FILE="$ENV_ROOT_FILE"
fi

echo -e "${BLUE}📋 Setting Frontend Environment Variables...${NC}"
echo ""

# Frontend environment variables (VITE_*)
FRONTEND_VARS=(
    "VITE_FIREBASE_API_KEY"
    "VITE_FIREBASE_AUTH_DOMAIN"
    "VITE_FIREBASE_PROJECT_ID"
    "VITE_FIREBASE_STORAGE_BUCKET"
    "VITE_FIREBASE_MESSAGING_SENDER_ID"
    "VITE_FIREBASE_APP_ID"
    "VITE_USE_EMULATOR"
)

for var in "${FRONTEND_VARS[@]}"; do
    value=""
    
    # Try to read from web env file first
    if [ -n "$WEB_ENV_FILE" ]; then
        value=$(read_env_from_file "$WEB_ENV_FILE" "$var")
    fi
    
    # If not found, try root env file
    if [ -z "$value" ] && [ -n "$ROOT_ENV_FILE" ]; then
        value=$(read_env_from_file "$ROOT_ENV_FILE" "$var")
    fi
    
    # If still not found, try environment variable
    if [ -z "$value" ]; then
        value="${!var}"
    fi
    
    # Set default for VITE_USE_EMULATOR if not set
    if [ "$var" == "VITE_USE_EMULATOR" ] && [ -z "$value" ]; then
        value="false"
    fi
    
    if [ -n "$value" ]; then
        set_env_var "$var" "$value" "production"
        set_env_var "$var" "$value" "preview"
        set_env_var "$var" "$value" "development"
    else
        echo -e "${YELLOW}⚠️  ${var} not found. You may need to set it manually in Vercel dashboard.${NC}"
    fi
done

echo ""
echo -e "${BLUE}📋 Setting API Environment Variables (if deploying API)...${NC}"
echo ""

# API environment variables (optional - only if deploying API to Vercel)
API_VARS=(
    "PORT"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_SERVICE_ACCOUNT"
    "USE_FIREBASE_EMULATOR"
    "POSTMARK_API_TOKEN"
    "POSTMARK_FROM_EMAIL"
    "GOOGLE_AI_API_KEY"
    "FRONTEND_URL"
)

# Ask if deploying API
read -p "Are you deploying the API to Vercel as well? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    for var in "${API_VARS[@]}"; do
        value=""
        
        # Try to read from API env file first
        if [ -n "$API_ENV_FILE" ]; then
            value=$(read_env_from_file "$API_ENV_FILE" "$var")
        fi
        
        # If not found, try root env file
        if [ -z "$value" ] && [ -n "$ROOT_ENV_FILE" ]; then
            value=$(read_env_from_file "$ROOT_ENV_FILE" "$var")
        fi
        
        # If still not found, try environment variable
        if [ -z "$value" ]; then
            value="${!var}"
        fi
        
        # Set defaults
        if [ "$var" == "PORT" ] && [ -z "$value" ]; then
            value="3001"
        fi
        if [ "$var" == "USE_FIREBASE_EMULATOR" ] && [ -z "$value" ]; then
            value="false"
        fi
        
        if [ -n "$value" ]; then
            set_env_var "$var" "$value" "production"
            set_env_var "$var" "$value" "preview"
            set_env_var "$var" "$value" "development"
        else
            echo -e "${YELLOW}⚠️  ${var} not found. Skipping...${NC}"
        fi
    done
fi

echo ""
echo -e "${BLUE}🌐 Deploying to Vercel...${NC}"
echo ""

# Ask for deployment type
read -p "Deploy to production? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    DEPLOY_CMD="vercel --prod --yes"
    echo -e "${GREEN}🚀 Deploying to production...${NC}"
else
    DEPLOY_CMD="vercel --yes"
    echo -e "${BLUE}🚀 Deploying to preview...${NC}"
fi

# Deploy
eval $DEPLOY_CMD

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "1. Verify deployment in Vercel dashboard"
    echo "2. Test the deployed application"
    echo "3. Deploy API separately if needed (see DEPLOYMENT_GUIDE.md)"
    echo "4. Update Firebase authorized domains"
    echo "5. Update API CORS settings if deploying API separately"
else
    echo ""
    echo -e "${RED}❌ Deployment failed. Check the error messages above.${NC}"
    exit 1
fi
