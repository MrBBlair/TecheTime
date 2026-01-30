/**
 * Firebase Admin SDK Initialization
 * Supports both service account key and Application Default Credentials (gcloud)
 */

import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      // Use service account key if provided
      try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase Admin initialized with service account key');
      } catch (parseError) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError);
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
      }
    } else {
      // Use Application Default Credentials (gcloud auth)
      // This works when you run: gcloud auth application-default login
      try {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'tech-etime-21021',
        });
        console.log('✅ Firebase Admin initialized with Application Default Credentials (gcloud)');
      } catch (initError: any) {
        console.error('❌ Firebase Admin initialization failed:', initError.message);
        console.error('\n📋 To fix this, run one of the following:');
        console.error('   1. gcloud auth application-default login');
        console.error('   2. Or set FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
        console.error('\n   For gcloud: Make sure you\'re authenticated and have access to the project.');
        throw initError;
      }
    }
  } catch (error: any) {
    console.error('❌ Critical: Firebase Admin setup failed:', error.message);
    // Don't throw here - let it fail at runtime so we get better error messages
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
