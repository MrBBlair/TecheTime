#!/usr/bin/env node
/**
 * Tech eTime - Vercel Deployment Script with Environment Variables
 * Node.js version for cross-platform compatibility
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options });
  } catch (error) {
    return null;
  }
}

function question(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  content.split('\n').forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=');
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '');
        env[key.trim()] = value.trim();
      }
    }
  });

  return env;
}

function setEnvVar(key, value, envType = 'production', vercelCmd = 'vercel') {
  if (!value || value === '') {
    log(`⚠️  Skipping ${key} (empty value)`, 'yellow');
    return false;
  }

  log(`📝 Setting ${key} for ${envType}...`, 'blue');
  
  try {
    // Escape special characters in value
    const escapedValue = value.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
    const result = exec(`echo "${escapedValue}" | ${vercelCmd} env add "${key}" ${envType} --yes`, {
      stdio: 'pipe',
    });
    return true;
  } catch (error) {
    // Ignore "already exists" errors
    return true;
  }
}

async function main() {
  log('🚀 Tech eTime - Vercel Deployment', 'blue');
  log('======================================\n');

  // Check if Vercel CLI is available (global or local)
  let vercelCmd = 'vercel';
  if (!exec('which vercel') && !exec('where vercel')) {
    // Try local installation
    const localVercel = path.join(process.cwd(), 'node_modules', '.bin', 'vercel');
    if (fs.existsSync(localVercel)) {
      vercelCmd = localVercel;
      log('✅ Using local Vercel CLI', 'green');
    } else {
      log('⚠️  Vercel CLI not found. Installing locally...', 'yellow');
      try {
        exec('npm install vercel --save-dev', { stdio: 'inherit' });
        vercelCmd = path.join(process.cwd(), 'node_modules', '.bin', 'vercel');
        if (!fs.existsSync(vercelCmd)) {
          throw new Error('Failed to install Vercel CLI');
        }
        log('✅ Vercel CLI installed locally', 'green');
      } catch (error) {
        log('❌ Failed to install Vercel CLI. Please install manually:', 'red');
        log('   npm install -g vercel', 'yellow');
        log('   or: npm install vercel --save-dev', 'yellow');
        process.exit(1);
      }
    }
  }

  // Check if logged in
  log('🔐 Checking Vercel authentication...', 'blue');
  const whoami = exec(`${vercelCmd} whoami`);
  if (!whoami) {
    log('⚠️  Not logged in to Vercel. Please login:', 'yellow');
    exec(`${vercelCmd} login`, { stdio: 'inherit' });
  } else {
    log(`✅ Logged in as: ${whoami.trim()}`, 'green');
  }

  log('\n📦 Building project...', 'blue');
  try {
    exec('npm run build', { stdio: 'inherit' });
    log('✅ Build successful!\n', 'green');
  } catch (error) {
    log('❌ Build failed. Please fix errors before deploying.', 'red');
    process.exit(1);
  }

  // Find environment files
  const envFiles = [
    'apps/web/.env.local',
    'apps/web/.env',
    'apps/api/.env.local',
    'apps/api/.env',
    '.env.local',
    '.env',
  ];

  const envVars = {};
  
  // Read all env files (later files override earlier ones)
  envFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      const fileEnv = readEnvFile(file);
      Object.assign(envVars, fileEnv);
    }
  });

  // Also check process.env
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith('VITE_') || key.startsWith('FIREBASE_') || 
        key === 'PORT' || key === 'POSTMARK_API_TOKEN' || 
        key === 'POSTMARK_FROM_EMAIL' || key === 'GOOGLE_AI_API_KEY' ||
        key === 'FRONTEND_URL' || key === 'USE_FIREBASE_EMULATOR') {
      if (!envVars[key]) {
        envVars[key] = process.env[key];
      }
    }
  });
  
  // Map VITE_FIREBASE_API_KEY to FIREBASE_WEB_API_KEY if needed
  if (envVars['VITE_FIREBASE_API_KEY'] && !envVars['FIREBASE_WEB_API_KEY']) {
    envVars['FIREBASE_WEB_API_KEY'] = envVars['VITE_FIREBASE_API_KEY'];
  }

  log('📋 Setting Frontend Environment Variables...\n', 'blue');

  const frontendVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_USE_EMULATOR',
  ];

  for (const varName of frontendVars) {
    let value = envVars[varName];
    
    // Set default for VITE_USE_EMULATOR
    if (varName === 'VITE_USE_EMULATOR' && !value) {
      value = 'false';
    }

    if (value) {
      setEnvVar(varName, value, 'production', vercelCmd);
      setEnvVar(varName, value, 'preview', vercelCmd);
      setEnvVar(varName, value, 'development', vercelCmd);
    } else {
      log(`⚠️  ${varName} not found. You may need to set it manually in Vercel dashboard.`, 'yellow');
    }
  }

  log('\n📋 Setting API Environment Variables (if deploying API)...\n', 'blue');
  
  const deployApi = await question('Are you deploying the API to Vercel as well? (y/n) ');
  
  if (deployApi.toLowerCase() === 'y') {
    const apiVars = [
      'PORT',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_SERVICE_ACCOUNT',
      'FIREBASE_WEB_API_KEY',
      'USE_FIREBASE_EMULATOR',
      'POSTMARK_API_TOKEN',
      'POSTMARK_FROM_EMAIL',
      'GOOGLE_AI_API_KEY',
      'FRONTEND_URL',
    ];

    for (const varName of apiVars) {
      let value = envVars[varName];
      
      // Set defaults
      if (varName === 'PORT' && !value) {
        value = '3001';
      }
      if (varName === 'USE_FIREBASE_EMULATOR' && !value) {
        value = 'false';
      }

      if (value) {
        setEnvVar(varName, value, 'production', vercelCmd);
        setEnvVar(varName, value, 'preview', vercelCmd);
        setEnvVar(varName, value, 'development', vercelCmd);
      } else {
        log(`⚠️  ${varName} not found. Skipping...`, 'yellow');
      }
    }
  }

  log('\n🌐 Deploying to Vercel...\n', 'blue');
  
  const deployProd = await question('Deploy to production? (y/n) ');
  const deployCmd = deployProd.toLowerCase() === 'y' 
    ? `${vercelCmd} --prod --yes` 
    : `${vercelCmd} --yes`;

  log(deployProd.toLowerCase() === 'y' 
    ? '🚀 Deploying to production...' 
    : '🚀 Deploying to preview...', 
    deployProd.toLowerCase() === 'y' ? 'green' : 'blue');

  try {
    // Use spawn for better output handling
    const { spawn } = require('child_process');
    const [cmd, ...args] = deployCmd.split(' ');
    const deployProcess = spawn(cmd, args, { stdio: 'inherit', shell: true });
    
    deployProcess.on('close', (code) => {
      if (code !== 0) {
        log('\n❌ Deployment failed. Check the error messages above.', 'red');
        process.exit(1);
      }
    });
    
    await new Promise((resolve, reject) => {
      deployProcess.on('close', resolve);
      deployProcess.on('error', reject);
    });
    log('\n✅ Deployment complete!\n', 'green');
    log('📋 Next steps:', 'blue');
    log('1. Verify deployment in Vercel dashboard');
    log('2. Test the deployed application');
    log('3. Deploy API separately if needed (see DEPLOYMENT_GUIDE.md)');
    log('4. Update Firebase authorized domains');
    log('5. Update API CORS settings if deploying API separately');
  } catch (error) {
    log('\n❌ Deployment failed. Check the error messages above.', 'red');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
