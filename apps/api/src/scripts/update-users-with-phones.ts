import { config } from 'dotenv';
import { db } from '../firebase/admin.js';
import bcrypt from 'bcrypt';

// Load environment variables from .env file
config();

async function updateUsersWithPhones() {
  console.log('📱 Updating users with phone numbers and PINs...\n');
  
  const useEmulator = process.env.USE_FIREBASE_EMULATOR === 'true';
  const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-project';
  
  if (useEmulator) {
    console.log('ℹ️  Using Firebase Emulators');
    console.log('   Make sure emulators are running: npm run emulators:start\n');
  } else {
    console.log(`ℹ️  Using Firebase Project: ${projectId}\n`);
  }

  const businessId = 'demo-business';

  // Map of worker IDs to phone numbers (last 4 digits will become PINs)
  const workerPhoneMap: Record<string, string> = {
    'worker-1': '(555) 123-4567', // PIN: 4567
    'worker-2': '(555) 234-5678', // PIN: 5678
    'worker-3': '(555) 345-9012', // PIN: 9012
    'worker-4': '(555) 456-3456', // PIN: 3456
    'worker-5': '(555) 567-7890', // PIN: 7890
  };

  console.log('Updating workers with phone numbers:\n');

  for (const [workerId, phoneNumber] of Object.entries(workerPhoneMap)) {
    try {
      const userRef = db.collection('users').doc(workerId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        console.log(`⚠️  Worker ${workerId} not found, skipping...`);
        continue;
      }

      const userData = userDoc.data();
      
      // Extract last 4 digits from phone number
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      if (digitsOnly.length < 4) {
        console.log(`⚠️  Invalid phone number for ${workerId}: ${phoneNumber}, skipping...`);
        continue;
      }

      const lastFourDigits = digitsOnly.slice(-4);
      const pinHash = await bcrypt.hash(lastFourDigits, 10);

      // Update user with phone number and new PIN
      await userRef.update({
        phoneNumber,
        pinHash,
        pinEnabled: true,
      });

      console.log(`✅ Updated ${userData?.firstName} ${userData?.lastName}:`);
      console.log(`   Phone: ${phoneNumber}`);
      console.log(`   PIN: ${lastFourDigits}\n`);

    } catch (error: any) {
      console.error(`❌ Error updating ${workerId}:`, error.message);
    }
  }

  // Also update any other WORKER role users that don't have phone numbers
  try {
    const allWorkersSnapshot = await db
      .collection('users')
      .where('businessId', '==', businessId)
      .where('role', '==', 'WORKER')
      .get();

    const updatedIds = new Set(Object.keys(workerPhoneMap));
    let additionalUpdated = 0;

    for (const doc of allWorkersSnapshot.docs) {
      if (!updatedIds.has(doc.id)) {
        const userData = doc.data();
        // Generate a random phone number for workers without one
        const areaCode = Math.floor(Math.random() * 200) + 200; // 200-399
        const exchange = Math.floor(Math.random() * 800) + 200; // 200-999
        const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const phoneNumber = `(${areaCode}) ${exchange}-${number}`;
        const lastFourDigits = number;
        const pinHash = await bcrypt.hash(lastFourDigits, 10);

        await doc.ref.update({
          phoneNumber,
          pinHash,
          pinEnabled: true,
        });

        console.log(`✅ Updated ${userData.firstName} ${userData.lastName}:`);
        console.log(`   Phone: ${phoneNumber}`);
        console.log(`   PIN: ${lastFourDigits}\n`);
        additionalUpdated++;
      }
    }

    if (additionalUpdated > 0) {
      console.log(`\n✅ Also updated ${additionalUpdated} additional worker(s) with generated phone numbers\n`);
    }

  } catch (error: any) {
    console.error('❌ Error updating additional workers:', error.message);
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ Update complete!');
  console.log('═══════════════════════════════════════════════════════\n');
}

updateUsersWithPhones().catch(console.error);
