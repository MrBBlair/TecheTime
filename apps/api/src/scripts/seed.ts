import { config } from 'dotenv';
import { db, auth } from '../firebase/admin.js';
import bcrypt from 'bcrypt';

// Load environment variables from .env file
config();

async function seed() {
  console.log('🌱 Seeding Firestore with test data...\n');
  
  const useEmulator = process.env.USE_FIREBASE_EMULATOR === 'true';
  const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-project';
  
  if (useEmulator) {
    console.log('ℹ️  Using Firebase Emulators');
    console.log('   Make sure emulators are running: npm run emulators:start\n');
  } else {
    console.log(`ℹ️  Using Firebase Project: ${projectId}`);
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.warn('⚠️  Warning: FIREBASE_SERVICE_ACCOUNT not set');
      console.warn('   Trying to use application default credentials...\n');
    }
  }

  const businessId = 'demo-business';
  const now = new Date();

  // Create business
  await db.collection('businesses').doc(businessId).set({
    name: 'Tech eTime Demo Business',
    createdAt: now,
  });
  console.log('✅ Created business: Tech eTime Demo Business');

  // Create Firebase Auth user for owner
  let ownerId = 'demo-owner';
  const ownerEmail = 'admin@techetime.demo';
  const ownerPassword = 'demo1234';
  
  try {
    const userRecord = await auth.createUser({
      email: ownerEmail,
      password: ownerPassword,
      displayName: 'Demo Admin',
      emailVerified: true,
    });
    ownerId = userRecord.uid;
    console.log('✅ Created Firebase Auth user for owner');
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      // User already exists, get the existing user
      const existingUser = await auth.getUserByEmail(ownerEmail);
      ownerId = existingUser.uid;
      console.log('ℹ️  Owner user already exists, using existing user');
    } else {
      throw error;
    }
  }

  // Create user document in Firestore
  await db.collection('users').doc(ownerId).set({
    businessId,
    email: ownerEmail,
    role: 'OWNER',
    firstName: 'Demo',
    lastName: 'Admin',
    pinHash: null,
    pinEnabled: false,
    isActive: true,
    createdAt: now,
  });
  console.log('✅ Created owner user document in Firestore');

  // Create locations
  const locations = [
    { id: 'loc-main', name: 'Main Office', address: '123 Tech Street, San Francisco, CA 94105', timezone: 'America/Los_Angeles' },
    { id: 'loc-warehouse', name: 'Warehouse', address: '456 Industrial Blvd, Oakland, CA 94601', timezone: 'America/Los_Angeles' },
  ];

  for (const loc of locations) {
    await db.collection('businesses').doc(businessId).collection('locations').doc(loc.id).set({
      businessId,
      ...loc,
      isActive: true,
    });
  }

  // Create workers
  const workers = [
    { id: 'worker-1', firstName: 'John', lastName: 'Doe', pin: '1234', rate: 20.0, phoneNumber: '555-1234' },
    { id: 'worker-2', firstName: 'Jane', lastName: 'Smith', pin: '5678', rate: 22.5, phoneNumber: '555-5678' },
    { id: 'worker-3', firstName: 'Bob', lastName: 'Johnson', pin: '9012', rate: 18.0, phoneNumber: '555-9012' },
    { id: 'worker-4', firstName: 'Alice', lastName: 'Williams', pin: '3456', rate: 25.0, phoneNumber: '555-3456' },
    { id: 'worker-5', firstName: 'Charlie', lastName: 'Brown', pin: '7890', rate: 19.5, phoneNumber: '555-7890' },
  ];

  for (const worker of workers) {
    await db.collection('users').doc(worker.id).set({
      businessId,
      email: null,
      passwordHash: null,
      role: 'WORKER',
      firstName: worker.firstName,
      lastName: worker.lastName,
      pinHash: await bcrypt.hash(worker.pin, 10),
      pinEnabled: true,
      isActive: true,
      createdAt: now,
    });

    await db.collection('businesses').doc(businessId).collection('payRates').add({
      businessId,
      userId: worker.id,
      hourlyRate: Math.round(worker.rate * 100), // cents
      effectiveFrom: now,
    });
  }

  // Create sample time entries
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(9, 0, 0, 0);

  const clockOut = new Date(yesterday);
  clockOut.setHours(17, 0, 0, 0);

  await db.collection('businesses').doc(businessId).collection('timeEntries').add({
    businessId,
    userId: 'worker-1',
    locationId: 'loc-main',
    clockInAt: yesterday,
    clockOutAt: clockOut,
    notes: 'Regular shift',
    createdAt: now,
  });

  console.log('\n✅ Seed complete!\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 TEST ACCOUNT CREDENTIALS');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('🔐 Admin Sign In:');
  console.log(`   Email:    ${ownerEmail}`);
  console.log(`   Password: ${ownerPassword}\n`);
  console.log('👷 Worker PINs (for Kiosk Mode):');
  workers.forEach(w => {
    console.log(`   ${w.firstName} ${w.lastName.padEnd(10)} - Phone: ${w.phoneNumber} - PIN: ${w.pin} (Rate: $${w.rate}/hr)`);
  });
  console.log('\n📍 Locations Created:');
  locations.forEach(loc => {
    console.log(`   • ${loc.name}`);
  });
  console.log('\n💡 Test Scenarios:');
  console.log('   1. Sign in with admin credentials at /admin');
  console.log('   2. Create locations and workers in Dashboard');
  console.log('   3. Test time clock functionality');
  console.log('   4. Generate payroll reports');
  console.log('   5. Test kiosk mode with worker PINs');
  console.log('\n═══════════════════════════════════════════════════════\n');
}

seed().catch(console.error);
