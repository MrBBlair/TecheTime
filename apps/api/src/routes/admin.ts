import { Router } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../firebase/admin.js';
import {
  createLocationSchema,
  updateLocationSchema,
  createUserSchema,
  updateUserSchema,
  setPinSchema,
  enableKioskSchema,
  updateTimeEntrySchema,
} from '@techetime/shared';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';

export const adminRouter = Router();

// Locations
adminRouter.get('/locations', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    if (!req.businessId) {
      return res.status(400).json({ 
        error: 'Business ID required',
        message: 'No business ID found. Please ensure you have access to a business.'
      });
    }
    
    const locations = await db
      .collection('businesses')
      .doc(req.businessId)
      .collection('locations')
      .get();
    res.json(locations.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error('[Admin] Error fetching locations:', error);
    next(error);
  }
});

adminRouter.post('/locations', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = createLocationSchema.parse(req.body);
    const locationRef = db
      .collection('businesses')
      .doc(req.businessId!)
      .collection('locations')
      .doc();
    await locationRef.set({
      ...data,
      businessId: req.businessId!,
      isActive: true,
    });
    res.status(201).json({ id: locationRef.id, ...data });
  } catch (error) {
    next(error);
  }
});

// Users/Workers
adminRouter.get('/users', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    if (!req.businessId) {
      return res.status(400).json({ 
        error: 'Business ID required',
        message: 'No business ID found. Please ensure you have access to a business.'
      });
    }
    
    // Support both old (businessId) and new (businessIds) formats
    const usersSnapshot = await db
      .collection('users')
      .where('businessId', '==', req.businessId)
      .get();
    
    // Also check for users with businessIds array containing this business
    const usersWithArraySnapshot = await db
      .collection('users')
      .where('businessIds', 'array-contains', req.businessId)
      .get();
    
    // Combine results, avoiding duplicates
    const userMap = new Map();
    usersSnapshot.docs.forEach(doc => {
      userMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
    usersWithArraySnapshot.docs.forEach(doc => {
      if (!userMap.has(doc.id)) {
        userMap.set(doc.id, { id: doc.id, ...doc.data() });
      }
    });
    
    res.json(Array.from(userMap.values()));
  } catch (error) {
    console.error('[Admin] Error fetching users:', error);
    next(error);
  }
});

adminRouter.post('/users', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);
    const userRef = db.collection('users').doc();
    
    // Extract last 4 digits of phone number for PIN if phoneNumber is provided
    let pinHash = null;
    let pinEnabled = false;
    let initialPin = null;
    
    if (data.phoneNumber && data.role === 'WORKER') {
      // Extract digits only and get last 4
      const digitsOnly = data.phoneNumber.replace(/\D/g, '');
      if (digitsOnly.length >= 4) {
        const lastFourDigits = digitsOnly.slice(-4);
        pinHash = await bcrypt.hash(lastFourDigits, 10);
        pinEnabled = true;
        initialPin = lastFourDigits;
      }
    }
    
    await userRef.set({
      ...data,
      workerId: data.workerId && data.workerId.trim() ? data.workerId.trim() : null,
      businessId: req.businessId!,
      pinHash,
      pinEnabled,
      isActive: true,
      createdAt: new Date(),
    });
    if (data.hourlyRate) {
      await db.collection('businesses').doc(req.businessId!).collection('payRates').add({
        businessId: req.businessId!,
        userId: userRef.id,
        hourlyRate: Math.round(data.hourlyRate * 100), // Convert to cents
        effectiveFrom: new Date(),
      });
    }
    
    const responseData: any = { id: userRef.id, ...data };
    if (initialPin) {
      responseData.initialPin = initialPin;
    }
    
    res.status(201).json(responseData);
  } catch (error) {
    next(error);
  }
});

// PIN Management
adminRouter.post('/users/:id/pin/reset', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    const pinHash = await bcrypt.hash(newPin, 10);
    await db.collection('users').doc(req.params.id).update({
      pinHash,
      pinEnabled: true,
    });
    res.json({ pin: newPin });
  } catch (error) {
    next(error);
  }
});

// Kiosk
adminRouter.post('/kiosk/enable', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = enableKioskSchema.parse(req.body);
    const userDoc = await db.collection('users').doc(req.userId!).get();
    const adminEmail = userDoc.exists ? (userDoc.data()!.email as string) || null : null;
    const sessionRef = db
      .collection('businesses')
      .doc(req.businessId!)
      .collection('deviceSessions')
      .doc();
    const now = new Date();
    await sessionRef.set({
      businessId: req.businessId!,
      userId: req.userId!,
      adminEmail,
      sessionType: 'KIOSK',
      deviceName: data.deviceName,
      defaultLocationId: data.defaultLocationId || null,
      createdAt: now,
      lastSeenAt: now,
      revokedAt: null,
    });
    res.status(201).json({ id: sessionRef.id });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/kiosk/disable', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const sessionId = req.body.sessionId;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const sessionDoc = await db
      .collection('businesses')
      .doc(req.businessId!)
      .collection('deviceSessions')
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await sessionDoc.ref.update({ revokedAt: new Date() });
    res.json({ message: 'Kiosk disabled' });
  } catch (error) {
    next(error);
  }
});

// Update location
adminRouter.patch('/locations/:id', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = updateLocationSchema.parse(req.body);
    const locationRef = db
      .collection('businesses')
      .doc(req.businessId!)
      .collection('locations')
      .doc(req.params.id);

    const locationDoc = await locationRef.get();
    if (!locationDoc.exists) {
      return res.status(404).json({ error: 'Location not found' });
    }

    await locationRef.update(data);
    const updated = await locationRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    next(error);
  }
});

// Update user
adminRouter.patch('/users/:id', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const userRef = db.collection('users').doc(req.params.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists || userDoc.data()!.businessId !== req.businessId) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data()!;
    const updateData: any = {};
    const changes: string[] = [];
    
    // Track changes
    if (data.firstName !== undefined && data.firstName !== userData.firstName) {
      updateData.firstName = data.firstName;
      changes.push(`First name: ${userData.firstName} → ${data.firstName}`);
    }
    if (data.lastName !== undefined && data.lastName !== userData.lastName) {
      updateData.lastName = data.lastName;
      changes.push(`Last name: ${userData.lastName} → ${data.lastName}`);
    }
    if (data.workerId !== undefined) {
      const oldWorkerId = userData.workerId || null;
      const newWorkerId = data.workerId && data.workerId.trim() ? data.workerId.trim() : null;
      if (oldWorkerId !== newWorkerId) {
        updateData.workerId = newWorkerId;
        changes.push(`ID#: ${oldWorkerId || 'Not set'} → ${newWorkerId || 'Not set'}`);
      }
    }
    if (data.role !== undefined && data.role !== userData.role) {
      updateData.role = data.role;
      changes.push(`Role: ${userData.role} → ${data.role}`);
    }
    if (data.isActive !== undefined && data.isActive !== userData.isActive) {
      updateData.isActive = data.isActive;
      changes.push(`Status: ${userData.isActive ? 'Active' : 'Inactive'} → ${data.isActive ? 'Active' : 'Inactive'}`);
    }
    
    let updatedPin: string | null = null;
    
    // If phone number is provided, check if it actually changed
    if (data.phoneNumber !== undefined) {
      const oldPhoneNumber = userData.phoneNumber || '';
      const newPhoneNumber = data.phoneNumber || '';
      
      // Normalize phone numbers for comparison (remove non-digits)
      const oldDigits = oldPhoneNumber.replace(/\D/g, '');
      const newDigits = newPhoneNumber.replace(/\D/g, '');
      
      if (oldDigits !== newDigits) {
        // Phone number changed
        updateData.phoneNumber = data.phoneNumber;
        changes.push(`Phone number: ${oldPhoneNumber || 'Not set'} → ${newPhoneNumber}`);
        
        // Only update PIN if user is a WORKER and phone number changed
        if (userData.role === 'WORKER' && newDigits.length >= 4) {
          const lastFourDigits = newDigits.slice(-4);
          updateData.pinHash = await bcrypt.hash(lastFourDigits, 10);
          updateData.pinEnabled = true;
          updatedPin = lastFourDigits;
          changes.push(`PIN updated to: ${lastFourDigits}`);
        }
      } else if (oldPhoneNumber !== newPhoneNumber) {
        // Phone number format changed but digits are the same (e.g., formatting)
        updateData.phoneNumber = data.phoneNumber;
        changes.push(`Phone number format updated: ${oldPhoneNumber} → ${newPhoneNumber}`);
      }
      // If phone number is exactly the same, don't update anything
    }

    await userRef.update(updateData);

    if (data.hourlyRate !== undefined) {
      await db.collection('businesses').doc(req.businessId!).collection('payRates').add({
        businessId: req.businessId!,
        userId: req.params.id,
        hourlyRate: Math.round(data.hourlyRate * 100),
        effectiveFrom: new Date(),
      });
    }

    const updated = await userRef.get();
    const responseData: any = { id: updated.id, ...updated.data() };
    if (updatedPin) {
      responseData.updatedPin = updatedPin;
    }
    if (changes.length > 0) {
      responseData.changes = changes;
    }
    res.json(responseData);
  } catch (error) {
    next(error);
  }
});

// Get time entries for a user (configurable window: default 14 days, support 21+ for activity)
adminRouter.get('/users/:id/time-entries', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.id;
    const daysParam = req.query.days;
    const days = daysParam != null
      ? Math.min(365, Math.max(1, parseInt(String(daysParam), 10) || 14))
      : 14;

    // Verify user belongs to business
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists || userDoc.data()!.businessId !== req.businessId) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Fetch all time entries for user (single-field index only), then filter by date client-side
    let entriesSnapshot;
    try {
      entriesSnapshot = await db
        .collection('businesses')
        .doc(req.businessId!)
        .collection('timeEntries')
        .where('userId', '==', userId)
        .get();
    } catch (error: any) {
      console.error('Failed to fetch time entries:', error);
      return res.status(500).json({
        error: 'Failed to fetch time entries',
        message: error.message,
      });
    }

    function toDate(val: unknown): Date | null {
      if (!val) return null;
      if (typeof (val as any).toDate === 'function') return (val as any).toDate();
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      const d = new Date(val as string | number);
      return isNaN(d.getTime()) ? null : d;
    }

    const filteredDocs = entriesSnapshot.docs
      .filter((doc) => {
        const clockIn = toDate(doc.data().clockInAt);
        if (!clockIn) return false;
        return clockIn >= startDate && clockIn <= endDate;
      })
      .sort((a, b) => {
        const aTime = toDate(a.data().clockInAt)?.getTime() ?? 0;
        const bTime = toDate(b.data().clockInAt)?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, 150);

    const locationIds = new Set<string>();
    filteredDocs.forEach((doc) => {
      const lid = doc.data().locationId;
      if (lid) locationIds.add(lid);
    });

    const locationsMap = new Map<string, string>();
    for (const locId of locationIds) {
      const locDoc = await db
        .collection('businesses')
        .doc(req.businessId!)
        .collection('locations')
        .doc(locId)
        .get();
      if (locDoc.exists) {
        locationsMap.set(locId, (locDoc.data()!.name as string) || 'Unknown');
      }
    }

    const entries = filteredDocs.map((doc) => {
      const data = doc.data();
      const clockIn = toDate(data.clockInAt);
      const clockOut = toDate(data.clockOutAt);
      const created = toDate(data.createdAt);
      return {
        id: doc.id,
        ...data,
        clockInAt: clockIn ? clockIn.toISOString() : null,
        clockOutAt: clockOut ? clockOut.toISOString() : null,
        createdAt: created ? created.toISOString() : null,
        locationName: locationsMap.get(data.locationId) || 'Unknown Location',
      };
    });

    res.json({
      entries,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update a time entry (admin only)
adminRouter.patch('/time-entries/:id', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = updateTimeEntrySchema.parse(req.body);
    const ref = db
      .collection('businesses')
      .doc(req.businessId!)
      .collection('timeEntries')
      .doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    const update: Record<string, unknown> = {};
    if (data.clockInAt !== undefined) update.clockInAt = new Date(data.clockInAt);
    if (data.clockOutAt !== undefined) update.clockOutAt = data.clockOutAt === null ? null : new Date(data.clockOutAt);
    if (data.notes !== undefined) update.notes = data.notes;
    if (data.locationId !== undefined) update.locationId = data.locationId;
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    await ref.update(update);
    const updated = await ref.get();
    const d = updated.data()!;
    const locationIds = new Set<string>();
    if (d.locationId) locationIds.add(d.locationId);
    const locationsMap = new Map<string, string>();
    for (const locId of locationIds) {
      const locSnap = await db
        .collection('businesses')
        .doc(req.businessId!)
        .collection('locations')
        .doc(locId)
        .get();
      if (locSnap.exists) locationsMap.set(locId, locSnap.data()!.name as string);
    }
    const toIso = (v: unknown): string | null => {
      if (!v) return null;
      if (typeof (v as any).toDate === 'function') return (v as any).toDate().toISOString();
      if (v instanceof Date) return v.toISOString();
      return typeof v === 'string' ? v : null;
    };
    res.json({
      id: updated.id,
      ...d,
      clockInAt: toIso(d.clockInAt) ?? d.clockInAt,
      clockOutAt: d.clockOutAt == null ? null : (toIso(d.clockOutAt) ?? d.clockOutAt),
      locationName: locationsMap.get(d.locationId) || 'Unknown Location',
    });
  } catch (error) {
    next(error);
  }
});

// Delete a time entry (admin only)
adminRouter.delete('/time-entries/:id', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const ref = db
      .collection('businesses')
      .doc(req.businessId!)
      .collection('timeEntries')
      .doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    await ref.delete();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
