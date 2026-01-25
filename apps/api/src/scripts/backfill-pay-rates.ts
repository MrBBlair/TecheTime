import { config } from 'dotenv';
import { db } from '../firebase/admin.js';

// Load environment variables from .env file
config();

async function backfillPayRates() {
  console.log('💰 Backfilling pay rates for workers...\n');
  
  const useEmulator = process.env.USE_FIREBASE_EMULATOR === 'true';
  const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-project';
  
  if (useEmulator) {
    console.log('ℹ️  Using Firebase Emulators\n');
  } else {
    console.log(`ℹ️  Using Firebase Project: ${projectId}\n`);
  }

  const businessId = 'demo-business';

  try {
    // Get all workers
    const workersSnapshot = await db
      .collection('users')
      .where('businessId', '==', businessId)
      .where('role', '==', 'WORKER')
      .get();

    console.log(`Found ${workersSnapshot.docs.length} workers\n`);

    let updated = 0;
    let skipped = 0;

    for (const workerDoc of workersSnapshot.docs) {
      const workerId = workerDoc.id;
      const workerData = workerDoc.data();

      // Check if worker already has pay rates
      const existingRates = await db
        .collection('businesses')
        .doc(businessId)
        .collection('payRates')
        .where('userId', '==', workerId)
        .get();

      if (!existingRates.empty) {
        console.log(`✓ ${workerData.firstName} ${workerData.lastName} already has pay rate(s), skipping...`);
        skipped++;
        continue;
      }

      // Check if worker has hourlyRate from seed data or manual entry
      // For seed data, use the rates from seed.ts
      const seedRates: Record<string, number> = {
        'worker-1': 20.0,
        'worker-2': 22.5,
        'worker-3': 18.0,
        'worker-4': 25.0,
        'worker-5': 19.5,
      };

      let hourlyRate: number | null = null;

      // Check seed rates first
      if (seedRates[workerId]) {
        hourlyRate = seedRates[workerId];
      }

      // If no seed rate, use a default or skip
      if (!hourlyRate) {
        console.log(`⚠️  ${workerData.firstName} ${workerData.lastName} (${workerId}) - No rate found, skipping...`);
        skipped++;
        continue;
      }

      // Create pay rate entry
      await db.collection('businesses').doc(businessId).collection('payRates').add({
        businessId,
        userId: workerId,
        hourlyRate: Math.round(hourlyRate * 100), // Convert to cents
        effectiveFrom: new Date(), // Set to now, will work for all future entries
      });

      console.log(`✅ ${workerData.firstName} ${workerData.lastName} - Set rate to $${hourlyRate.toFixed(2)}/hr`);
      updated++;
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`✅ Backfill complete!`);
    console.log(`   Updated: ${updated} workers`);
    console.log(`   Skipped: ${skipped} workers`);
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error: any) {
    console.error('❌ Error backfilling pay rates:', error.message);
    process.exit(1);
  }
}

backfillPayRates().catch(console.error);
