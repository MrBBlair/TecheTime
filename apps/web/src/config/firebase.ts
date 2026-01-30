/**
 * Firebase Client SDK Initialization
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase config
const missingVars: string[] = [];
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your-firebase-api-key') {
  missingVars.push('VITE_FIREBASE_API_KEY');
}
if (!firebaseConfig.authDomain || firebaseConfig.authDomain.includes('your-project')) {
  missingVars.push('VITE_FIREBASE_AUTH_DOMAIN');
}
if (!firebaseConfig.projectId || firebaseConfig.projectId === 'your-project-id') {
  missingVars.push('VITE_FIREBASE_PROJECT_ID');
}
if (!firebaseConfig.storageBucket || firebaseConfig.storageBucket.includes('your-project')) {
  missingVars.push('VITE_FIREBASE_STORAGE_BUCKET');
}
if (!firebaseConfig.messagingSenderId || firebaseConfig.messagingSenderId === 'your-sender-id') {
  missingVars.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
}
if (!firebaseConfig.appId || firebaseConfig.appId === 'your-app-id') {
  missingVars.push('VITE_FIREBASE_APP_ID');
}

if (missingVars.length > 0) {
  console.error(
    '⚠️ Firebase configuration is missing or incomplete.\n' +
    `Missing variables: ${missingVars.join(', ')}\n\n` +
    'Please check your .env.local file and ensure:\n' +
    '1. All variables start with VITE_\n' +
    '2. No quotes around values (unless needed)\n' +
    '3. No spaces around the = sign\n' +
    '4. You have restarted the dev server after updating .env.local\n\n' +
    'Example format:\n' +
    'VITE_FIREBASE_API_KEY=AIzaSy...\n' +
    'VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com\n\n' +
    'See .env.local.example for the complete template.'
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export config for use in other modules
export function getFirebaseConfig() {
  return firebaseConfig;
}
