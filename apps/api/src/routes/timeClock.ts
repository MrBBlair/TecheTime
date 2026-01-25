import { Router } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../firebase/admin.js';
import { pinToggleSchema, clockInSchema, kioskExitSchema } from '@techetime/shared';
import { requireAdmin, requireDeviceSession, AuthRequest } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

export const timeClockRouter = Router();

const pinRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many PIN attempts',
});

// Admin clock in - uses transaction to prevent race conditions
timeClockRouter.post('/clock-in', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = clockInSchema.parse(req.body);
    const now = new Date();
    
    await db.runTransaction(async (transaction) => {
      // Verify user belongs to business
      const userRef = db.collection('users').doc(data.userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists || userDoc.data()!.businessId !== req.businessId) {
        throw new Error('User not found');
      }

      // Check for existing open shift atomically
      const openShiftsQuery = db
        .collection('businesses')
        .doc(req.businessId!)
        .collection('timeEntries')
        .where('userId', '==', data.userId)
        .where('clockOutAt', '==', null);
      
      const openShifts = await transaction.get(openShiftsQuery);

      if (!openShifts.empty) {
        throw new Error('User already has an open shift');
      }

      // Verify location belongs to business
      const locationRef = db
        .collection('businesses')
        .doc(req.businessId!)
        .collection('locations')
        .doc(data.locationId);
      
      const locationDoc = await transaction.get(locationRef);
      
      if (!locationDoc.exists) {
        throw new Error('Location not found');
      }

      // Create time entry atomically
      const entryRef = db
        .collection('businesses')
        .doc(req.businessId!)
        .collection('timeEntries')
        .doc();
      
      transaction.set(entryRef, {
        businessId: req.businessId!,
        userId: data.userId,
        locationId: data.locationId,
        clockInAt: now,
        clockOutAt: null,
        notes: data.notes || null,
        createdAt: now,
      });
    });

    res.status(201).json({ id: 'created' });
  } catch (error: any) {
    // Handle transaction conflicts
    if (error.code === 10) { // ABORTED
      return res.status(409).json({ error: 'Conflict: Please try again' });
    }
    // Handle custom errors
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.message === 'User already has an open shift') {
      return res.status(400).json({ error: 'User already has an open shift' });
    }
    if (error.message === 'Location not found') {
      return res.status(404).json({ error: 'Location not found' });
    }
    next(error);
  }
});

// Admin clock out - uses transaction to prevent race conditions
timeClockRouter.post('/clock-out', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const now = new Date();
    
    await db.runTransaction(async (transaction) => {
      // Find open shift atomically
      const openShiftsQuery = db
        .collection('businesses')
        .doc(req.businessId!)
        .collection('timeEntries')
        .where('userId', '==', userId)
        .where('clockOutAt', '==', null);
      
      const openShifts = await transaction.get(openShiftsQuery);

      if (openShifts.empty) {
        throw new Error('No open shift found');
      }

      const shift = openShifts.docs[0];
      transaction.update(shift.ref, { clockOutAt: now });
    });

    res.json({ id: 'updated', clockOutAt: now });
  } catch (error: any) {
    // Handle transaction conflicts
    if (error.code === 10) { // ABORTED
      return res.status(409).json({ error: 'Conflict: Please try again' });
    }
    // Handle custom errors
    if (error.message === 'No open shift found') {
      return res.status(404).json({ error: 'No open shift found' });
    }
    next(error);
  }
});

// Get locations for kiosk mode
timeClockRouter.get('/kiosk/locations', requireDeviceSession, async (req: AuthRequest, res, next) => {
  try {
    const locations = await db
      .collection('businesses')
      .doc(req.businessId!)
      .collection('locations')
      .where('isActive', '==', true)
      .get();
    res.json(locations.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    next(error);
  }
});

// Exit kiosk mode: verify admin email+password via Firebase, then revoke session
timeClockRouter.post('/kiosk/exit', requireDeviceSession, async (req: AuthRequest, res, next) => {
  try {
    const data = kioskExitSchema.parse(req.body);
    // Check for FIREBASE_WEB_API_KEY first, then fallback to VITE_FIREBASE_API_KEY (for compatibility)
    const apiKey = process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) {
      console.error('FIREBASE_WEB_API_KEY not set. Please set FIREBASE_WEB_API_KEY in your API environment variables.');
      return res.status(503).json({ 
        error: 'Kiosk exit unavailable',
        message: 'FIREBASE_WEB_API_KEY environment variable is not configured. Please set it in your API environment variables (same value as VITE_FIREBASE_API_KEY).'
      });
    }
    const session = req.deviceSession!;
    const adminEmail = session.adminEmail;
    if (!adminEmail) {
      return res.status(403).json({ error: 'Kiosk exit requires admin email; session was created before this feature.' });
    }
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const firebaseRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password, returnSecureToken: true }),
    });
    const firebaseJson = await firebaseRes.json() as { error?: { message?: string }; email?: string };
    if (!firebaseRes.ok) {
      const msg = firebaseJson?.error?.message || 'Invalid credentials';
      return res.status(401).json({ error: msg });
    }
    const signedInEmail = (firebaseJson.email || '').trim().toLowerCase();
    const expectedEmail = (adminEmail as string).trim().toLowerCase();
    if (signedInEmail !== expectedEmail) {
      return res.status(403).json({ error: 'Credentials do not match the admin who enabled Kiosk mode.' });
    }
    const sessionId = req.headers['x-device-session-id'] as string;
    const businessesSnapshot = await db.collection('businesses').get();
    for (const businessDoc of businessesSnapshot.docs) {
      const ref = businessDoc.ref.collection('deviceSessions').doc(sessionId);
      const snap = await ref.get();
      if (snap.exists) {
        await ref.update({ revokedAt: new Date() });
        break;
      }
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Find worker by PIN - optimized with parallel bcrypt comparisons
 * This significantly improves performance for businesses with many workers
 */
async function findWorkerByPin(
  businessId: string,
  pin: string
): Promise<{ id: string; firstName: string; lastName: string } | null> {
  // Fetch all active workers with PINs enabled
  const workers = await db
    .collection('users')
    .where('businessId', '==', businessId)
    .where('role', '==', 'WORKER')
    .where('pinEnabled', '==', true)
    .where('isActive', '==', true)
    .get();

  if (workers.empty) {
    return null;
  }

  // Compare PINs in parallel for better performance
  // This reduces latency from O(n) sequential comparisons to O(1) parallel batch
  const comparisonPromises = workers.docs.map(async (doc) => {
    const worker = doc.data();
    if (!worker.pinHash) {
      return null;
    }
    const valid = await bcrypt.compare(pin, worker.pinHash);
    if (valid) {
      return {
        id: doc.id,
        firstName: worker.firstName || '',
        lastName: worker.lastName || '',
      };
    }
    return null;
  });

  const results = await Promise.all(comparisonPromises);
  
  // Return first match (should only be one)
  return results.find((r) => r !== null) || null;
}

// Verify PIN for kiosk mode (doesn't clock in/out, just verifies and returns user info)
timeClockRouter.post('/kiosk/verify-pin', requireDeviceSession, pinRateLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { pin } = req.body;
    
    if (!pin || pin.length !== 4) {
      return res.status(400).json({ error: 'PIN required' });
    }

    const matchedWorker = await findWorkerByPin(req.businessId!, pin);

    if (!matchedWorker) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    res.json({
      user: {
        id: matchedWorker.id,
        firstName: matchedWorker.firstName,
        lastName: matchedWorker.lastName,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get pay period summary for kiosk mode (no admin auth required)
timeClockRouter.get('/kiosk/pay-period-summary/:userId', requireDeviceSession, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.params;
    
    if (!req.businessId) {
      return res.status(400).json({ error: 'Business ID required' });
    }
    
    // Verify user belongs to business
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data()!;
    if (userData.businessId !== req.businessId) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate current pay period (last 14 days - biweekly)
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 14);
    startDate.setHours(0, 0, 0, 0);

    // Get time entries for this user
    let entriesSnapshot;
    try {
      entriesSnapshot = await db
        .collection('businesses')
        .doc(req.businessId)
        .collection('timeEntries')
        .where('userId', '==', userId)
        .get();
    } catch (error: any) {
      console.error('Failed to fetch time entries:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch time entries',
        message: error.message 
      });
    }

    // Group entries by date and format
    const entriesByDate = new Map<string, any[]>();
    
    entriesSnapshot.docs.forEach(doc => {
      const entry = doc.data();
      if (!entry.clockInAt) return;
      
      // Convert Firestore Timestamp to Date
      let clockIn: Date;
      if (entry.clockInAt && typeof entry.clockInAt.toDate === 'function') {
        clockIn = entry.clockInAt.toDate();
      } else if (entry.clockInAt instanceof Date) {
        clockIn = entry.clockInAt;
      } else if (entry.clockInAt?._seconds) {
        clockIn = new Date(entry.clockInAt._seconds * 1000);
      } else {
        clockIn = new Date(entry.clockInAt);
      }

      // Filter by date range
      if (clockIn < startDate || clockIn > endDate) {
        return;
      }

      const dateKey = clockIn.toISOString().split('T')[0];
      if (!entriesByDate.has(dateKey)) {
        entriesByDate.set(dateKey, []);
      }

      let clockOut: Date | null = null;
      if (entry.clockOutAt) {
        if (entry.clockOutAt && typeof entry.clockOutAt.toDate === 'function') {
          clockOut = entry.clockOutAt.toDate();
        } else if (entry.clockOutAt instanceof Date) {
          clockOut = entry.clockOutAt;
        } else if (entry.clockOutAt?._seconds) {
          clockOut = new Date(entry.clockOutAt._seconds * 1000);
        } else {
          clockOut = new Date(entry.clockOutAt);
        }
      }

      const hours = clockOut ? (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60) : null;

      entriesByDate.get(dateKey)!.push({
        id: doc.id,
        clockInAt: clockIn.toISOString(),
        clockOutAt: clockOut ? clockOut.toISOString() : null,
        hours,
        locationId: entry.locationId,
      });
    });

    // Build summary
    const summary = Array.from(entriesByDate.entries())
      .map(([date, entries]) => {
        const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0);
        return {
          date,
          entries,
          totalHours,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const totalHours = summary.reduce((sum, day) => sum + day.totalHours, 0);

    res.json({
      payPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary,
      totalHours,
    });
  } catch (error) {
    next(error);
  }
});

timeClockRouter.post('/pin-toggle', requireDeviceSession, pinRateLimiter, async (req: AuthRequest, res, next) => {
  try {
    const data = pinToggleSchema.parse(req.body);
    const locationId = data.locationId || req.deviceSession?.defaultLocationId;
    
    if (!locationId) {
      return res.status(400).json({ error: 'Location required' });
    }

    // Find worker by PIN using optimized lookup
    const matchedWorker = await findWorkerByPin(req.businessId!, data.pin);

    if (!matchedWorker) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    const now = new Date();
    
    // Use transaction to prevent race conditions
    await db.runTransaction(async (transaction) => {
      // Check for open shift atomically
      const openShiftsQuery = db
        .collection('businesses')
        .doc(req.businessId!)
        .collection('timeEntries')
        .where('userId', '==', matchedWorker.id)
        .where('clockOutAt', '==', null);
      
      const openShifts = await transaction.get(openShiftsQuery);

      if (!openShifts.empty) {
        // Clock out - atomic operation
        const shift = openShifts.docs[0];
        const shiftData = shift.data();
        
        // Calculate hours worked
        let clockInTime: Date;
        if (shiftData.clockInAt && typeof shiftData.clockInAt.toDate === 'function') {
          clockInTime = shiftData.clockInAt.toDate();
        } else if (shiftData.clockInAt instanceof Date) {
          clockInTime = shiftData.clockInAt;
        } else {
          clockInTime = new Date(shiftData.clockInAt);
        }
        
        const hoursWorked = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
        const messageType = hoursWorked < 5 ? 'break' : 'end-of-day';
        
        transaction.update(shift.ref, { clockOutAt: now });
        
        res.json({ 
          action: 'clock-out', 
          timeEntry: { id: shift.id, ...shiftData, clockOutAt: now },
          hoursWorked,
          messageType,
          user: {
            id: matchedWorker.id,
            firstName: matchedWorker.firstName,
            lastName: matchedWorker.lastName,
          }
        });
      } else {
        // Clock in - verify no open shift exists (double-check in transaction)
        // Check if this is the first entry today (initial clock in)
        let isInitialClockIn = false;
        try {
          const todayStart = new Date(now);
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date(now);
          todayEnd.setHours(23, 59, 59, 999);
          
          // Query for today's entries (for initial clock-in check)
          const todayEntriesQuery = db
            .collection('businesses')
            .doc(req.businessId!)
            .collection('timeEntries')
            .where('userId', '==', matchedWorker.id);
          
          const todayEntriesSnapshot = await transaction.get(todayEntriesQuery);
          
          // Filter client-side for today's entries
          const todayEntriesFiltered = todayEntriesSnapshot.docs.filter(doc => {
            const entry = doc.data();
            let clockIn: Date;
            if (entry.clockInAt && typeof entry.clockInAt.toDate === 'function') {
              clockIn = entry.clockInAt.toDate();
            } else if (entry.clockInAt instanceof Date) {
              clockIn = entry.clockInAt;
            } else {
              clockIn = new Date(entry.clockInAt);
            }
            return clockIn >= todayStart && clockIn <= todayEnd;
          });
          
          isInitialClockIn = todayEntriesFiltered.length === 0;
        } catch (error) {
          console.error('Error checking for initial clock in:', error);
          isInitialClockIn = false;
        }
        
        // Verify location exists
        const locationRef = db
          .collection('businesses')
          .doc(req.businessId!)
          .collection('locations')
          .doc(locationId);
        const locationDoc = await transaction.get(locationRef);
        
        if (!locationDoc.exists) {
          throw new Error('Location not found');
        }
        
        // Create new time entry atomically
        const entryRef = db
          .collection('businesses')
          .doc(req.businessId!)
          .collection('timeEntries')
          .doc();
        
        transaction.set(entryRef, {
          businessId: req.businessId!,
          userId: matchedWorker.id,
          locationId,
          clockInAt: now,
          clockOutAt: null,
          notes: data.notes || null,
          createdAt: now,
        });
        
        res.json({ 
          action: 'clock-in', 
          timeEntry: { id: entryRef.id },
          isInitialClockIn,
          user: {
            id: matchedWorker.id,
            firstName: matchedWorker.firstName,
            lastName: matchedWorker.lastName,
          }
        });
      }
    });
  } catch (error: any) {
    // Handle transaction conflicts
    if (error.code === 10) { // ABORTED
      return res.status(409).json({ error: 'Conflict: Please try again' });
    }
    next(error);
  }
});

// Get current pay period summary for a user
timeClockRouter.get('/pay-period-summary/:userId', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.params;
    
    if (!req.businessId) {
      return res.status(400).json({ error: 'Business ID required' });
    }
    
    // Verify user belongs to business
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data()!;
    if (userData.businessId !== req.businessId) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate current pay period (last 14 days - biweekly)
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 14);
    startDate.setHours(0, 0, 0, 0);

    // Get time entries for this user in the pay period
    // Firestore accepts Date objects directly, but we'll filter client-side for safety
    let entriesSnapshot;
    try {
      entriesSnapshot = await db
        .collection('businesses')
        .doc(req.businessId)
        .collection('timeEntries')
        .where('userId', '==', userId)
        .get();
    } catch (error: any) {
      console.error('Failed to fetch time entries:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch time entries',
        message: error.message 
      });
    }

    // Group entries by date and format
    const entriesByDate = new Map<string, any[]>();
    
    entriesSnapshot.docs.forEach(doc => {
      try {
        const entry = doc.data();
        if (!entry.clockInAt) return;
        
        // Handle Firestore Timestamp - convert to Date
        let clockIn: Date;
        if (entry.clockInAt && typeof entry.clockInAt.toDate === 'function') {
          clockIn = entry.clockInAt.toDate();
        } else if (entry.clockInAt instanceof Date) {
          clockIn = entry.clockInAt;
        } else if (entry.clockInAt._seconds) {
          // Firestore Timestamp format
          clockIn = new Date(entry.clockInAt._seconds * 1000);
        } else {
          clockIn = new Date(entry.clockInAt);
        }
        
        // Validate date
        if (isNaN(clockIn.getTime())) {
          console.warn('Invalid clockInAt date for entry:', doc.id);
          return;
        }
        
        // Filter by date range
        if (clockIn < startDate || clockIn > endDate) {
          return;
        }
        
        const dateKey = clockIn.toISOString().split('T')[0];
        if (!entriesByDate.has(dateKey)) {
          entriesByDate.set(dateKey, []);
        }
        
        // Handle clock out timestamp
        let clockOut: Date | null = null;
        if (entry.clockOutAt) {
          if (entry.clockOutAt && typeof entry.clockOutAt.toDate === 'function') {
            clockOut = entry.clockOutAt.toDate();
          } else if (entry.clockOutAt instanceof Date) {
            clockOut = entry.clockOutAt;
          } else if (entry.clockOutAt._seconds) {
            // Firestore Timestamp format
            clockOut = new Date(entry.clockOutAt._seconds * 1000);
          } else {
            clockOut = new Date(entry.clockOutAt);
          }
          
          // Validate date
          if (clockOut && isNaN(clockOut.getTime())) {
            console.warn('Invalid clockOutAt date for entry:', doc.id);
            clockOut = null;
          }
        }
        
        const hours = clockOut 
          ? ((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60))
          : null;
        
        entriesByDate.get(dateKey)!.push({
          id: doc.id,
          clockInAt: clockIn.toISOString(),
          clockOutAt: clockOut ? clockOut.toISOString() : null,
          hours: hours ? parseFloat(hours.toFixed(2)) : null,
          locationId: entry.locationId || null,
        });
      } catch (err) {
        console.error('Error processing entry:', doc.id, err);
        // Skip malformed entries
      }
    });

    // Convert map to array sorted by date (newest first)
    const summary = Array.from(entriesByDate.entries())
      .map(([date, entries]) => ({
        date,
        entries: entries.sort((a, b) => 
          new Date(b.clockInAt).getTime() - new Date(a.clockInAt).getTime()
        ),
        totalHours: entries.reduce((sum, e) => sum + (e.hours || 0), 0),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    res.json({
      payPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary,
      totalHours: summary.reduce((sum, day) => sum + day.totalHours, 0),
    });
  } catch (error: any) {
    console.error('Pay period summary error:', error);
    res.status(500).json({ 
      error: 'Failed to load pay period summary',
      message: error.message 
    });
  }
});
