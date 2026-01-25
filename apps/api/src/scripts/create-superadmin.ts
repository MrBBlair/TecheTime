/**
 * Script to create SUPERADMIN users
 * 
 * This script assigns SUPERADMIN role to specified Firebase UIDs.
 * Run with: npm run create-superadmin (or tsx src/scripts/create-superadmin.ts)
 */

import { config } from 'dotenv';
import { db, auth } from '../firebase/admin.js';

// Load environment variables from .env file
config();

const SUPERADMIN_USERS = [
  {
    uid: 'VgW2Z2bt41b5wFSTmuKUnFZPdIa2',
    email: 'bccquedog@gmail.com',
  },
  {
    uid: 'rmpX8ifRRnebMGSVaS4hi60M6hw2',
    email: 'bblair@techephi.com',
  },
];

async function createSuperAdmins() {
  console.log('🔐 Creating SUPERADMIN users...\n');

  for (const { uid, email } of SUPERADMIN_USERS) {
    try {
      // Check if Firebase Auth user exists
      let userRecord;
      try {
        userRecord = await auth.getUser(uid);
        console.log(`✓ Found Firebase Auth user: ${email} (${uid})`);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          console.log(`⚠️  Firebase Auth user not found for ${email} (${uid})`);
          console.log(`   Creating Firebase Auth user...`);
          
          // Create Firebase Auth user if it doesn't exist
          userRecord = await auth.createUser({
            uid,
            email,
            emailVerified: false,
          });
          console.log(`✓ Created Firebase Auth user: ${email}`);
        } else {
          throw error;
        }
      }

      // Check if Firestore user document exists
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data()!;
        const currentRole = userData.role || 'N/A';
        
        if (userData.role === 'SUPERADMIN') {
          console.log(`✓ User ${email} already has SUPERADMIN role`);
        } else {
          // Update existing user to SUPERADMIN
          await db.collection('users').doc(uid).update({
            role: 'SUPERADMIN',
            isActive: true,
          });
          console.log(`✓ Updated ${email} from ${currentRole} to SUPERADMIN`);
        }
      } else {
        // Create new user document with SUPERADMIN role
        await db.collection('users').doc(uid).set({
          email,
          role: 'SUPERADMIN',
          firstName: email.split('@')[0] || 'Super',
          lastName: 'Admin',
          businessId: null, // SUPERADMIN doesn't need a business
          businessIds: [],
          pinHash: null,
          pinEnabled: false,
          isActive: true,
          createdAt: new Date(),
        });
        console.log(`✓ Created Firestore user document for ${email} with SUPERADMIN role`);
      }
      
      console.log('');
    } catch (error: any) {
      console.error(`❌ Error processing ${email} (${uid}):`, error.message);
      console.error('');
    }
  }

  console.log('✅ SUPERADMIN creation complete!\n');
  console.log('SuperAdmin users:');
  for (const { uid, email } of SUPERADMIN_USERS) {
    console.log(`   - ${email} (${uid})`);
  }
}

// Run the script
createSuperAdmins()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
