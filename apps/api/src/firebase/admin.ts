import admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables if not already loaded
if (!process.env.USE_FIREBASE_EMULATOR) {
  config();
}

/**
 * Initialize Firebase Admin SDK with Application Default Credentials (ADC) or service account.
 * 
 * Priority order:
 * 1. FIREBASE_SERVICE_ACCOUNT (if provided in .env)
 * 2. Application Default Credentials (ADC) - recommended for local dev and production
 * 
 * For ADC setup, see: apps/api/src/scripts/setup-adc.md
 */
if (!admin.apps.length) {
  const useEmulator = process.env.USE_FIREBASE_EMULATOR === 'true';
  const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-project';
  
  let credential;
  let authMethod: string;
  
  // Try to get credentials - prefer service account if provided, otherwise use ADC
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
      authMethod = 'service account JSON';
    } catch (error) {
      throw new Error(
        'Failed to parse FIREBASE_SERVICE_ACCOUNT. Please check the JSON format.\n' +
        'See apps/api/src/scripts/get-service-account.md for instructions.\n' +
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  } else {
    // Use Application Default Credentials (ADC)
    try {
      credential = admin.credential.applicationDefault();
      authMethod = 'Application Default Credentials (ADC)';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        'Firebase Admin SDK authentication failed. No credentials found.\n\n' +
        'You have two options:\n\n' +
        'Option 1 (Recommended): Use Application Default Credentials (ADC)\n' +
        '  1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install\n' +
        '  2. Run: gcloud auth application-default login\n' +
        '  3. Select your Google account with Firebase access\n' +
        '  See apps/api/src/scripts/setup-adc.md for detailed instructions\n\n' +
        'Option 2: Use Service Account JSON\n' +
        '  1. Set FIREBASE_SERVICE_ACCOUNT in apps/api/.env\n' +
        '  2. Get it from: Firebase Console → Project Settings → Service Accounts\n' +
        '  See apps/api/src/scripts/get-service-account.md for instructions\n\n' +
        `Error: ${errorMessage}`
      );
    }
  }
  
  if (useEmulator) {
    // Set emulator environment variables BEFORE initializing
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    
    console.log(`[Firebase Admin] Using ${authMethod} with emulators`);
    
    admin.initializeApp({
      credential,
      projectId,
    });
  } else {
    // Use real Firebase
    console.log(`[Firebase Admin] Using ${authMethod} with project: ${projectId}`);
    
    admin.initializeApp({
      credential,
      projectId: projectId || undefined,
    });
  }
  
  // Verify credentials work by attempting to access Firestore
  try {
    const db = admin.firestore();
    // This will fail fast if credentials are invalid
    db.settings({ ignoreUndefinedProperties: true });
    console.log('[Firebase Admin] Successfully initialized and verified');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Firebase Admin SDK initialized but credentials verification failed.\n` +
      `This usually means your credentials don't have the necessary permissions.\n` +
      `Make sure you're authenticated with an account that has access to project: ${projectId}\n` +
      `Error: ${errorMessage}`
    );
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
