/**
 * Kiosk Routes
 */

import { Router, Response } from 'express';
import { AuthRequest, requireAuth, requireKioskAuth } from '../middleware/auth';
import { db } from '../config/firebase';
import { kioskRegisterSchema } from '@shared/types';
import { hashSecret, generateSecret } from '../utils/crypto';
import { notifyOwnerKioskProvisioned } from '../services/notifications';

const router = Router();

/**
 * POST /api/kiosk/register
 * Admin endpoint to register a kiosk device
 * Returns device ID and secret (plain text - store securely)
 */
router.post('/register', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    // Validate input
    const validationResult = kioskRegisterSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { businessId, locationId, deviceName } = validationResult.data;

    // Verify user has access to this business
    if (req.user?.businessId !== businessId && req.user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Not authorized for this business' });
    }

    // Verify location belongs to business
    const locationDoc = await db.collection('locations').doc(locationId).get();
    if (!locationDoc.exists) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const locationData = locationDoc.data();
    if (locationData?.businessId !== businessId) {
      return res.status(400).json({ error: 'Location does not belong to business' });
    }

    // Generate device secret
    const plainSecret = generateSecret();
    const hashedSecret = hashSecret(plainSecret);

    // Create device session
    const now = new Date().toISOString();
    const deviceRef = db.collection('deviceSessions').doc();
    const deviceData = {
      businessId,
      locationId,
      secret: hashedSecret,
      deviceName,
      isActive: true,
      createdAt: now,
    };

    await deviceRef.set(deviceData);

    // Get business and location info for notification
    const businessDoc = await db.collection('businesses').doc(businessId).get();
    const ownerId = businessDoc.data()?.ownerId;
    const locationName = locationData?.name || 'Unknown Location';

    // Notify owner when kiosk is provisioned
    if (ownerId) {
      try {
        await notifyOwnerKioskProvisioned(ownerId, {
          deviceName,
          deviceId: deviceRef.id,
          locationName,
        });
      } catch (notifError) {
        console.error('Failed to send kiosk provisioned notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    // Return device ID and PLAIN secret (only time it's returned)
    res.status(201).json({
      deviceId: deviceRef.id,
      secret: plainSecret,
    });
  } catch (error) {
    console.error('Kiosk register error:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

/**
 * POST /api/kiosk/clock-in
 * Kiosk endpoint to clock in (requires device auth)
 */
router.post('/clock-in', requireKioskAuth, async (req: any, res: Response) => {
  try {
    const { pin } = req.body;
    const device = req.device;

    if (!pin || !/^\d{4,8}$/.test(pin)) {
      return res.status(400).json({ error: 'Invalid PIN format' });
    }

    // Find user by PIN and location
    const usersSnapshot = await db
      .collection('users')
      .where('locationId', '==', device.locationId)
      .get();

    const hashedPin = hashSecret(pin);
    let userDoc = null;

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      if (userData.pin === hashedPin) {
        userDoc = doc;
        break;
      }
    }

    if (!userDoc) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Check if user is already clocked in
    const activeEntriesSnapshot = await db
      .collection('timeEntries')
      .where('userId', '==', userDoc.id)
      .where('clockOutAt', '==', null)
      .get();

    if (!activeEntriesSnapshot.empty) {
      return res.status(400).json({ error: 'User is already clocked in' });
    }

    // Get location timezone
    const locationDoc = await db.collection('locations').doc(device.locationId).get();
    const locationTimezone = locationDoc.data()?.timezone || 'UTC';

    // Create time entry
    const now = new Date().toISOString();
    const timeEntryRef = db.collection('timeEntries').doc();
    const timeEntryData = {
      userId: userDoc.id,
      businessId: device.businessId,
      locationId: device.locationId,
      clockInAt: now,
      clockOutAt: null,
      locationTimezone,
      createdAt: now,
      updatedAt: now,
    };

    await timeEntryRef.set(timeEntryData);

    res.status(201).json({
      timeEntryId: timeEntryRef.id,
      clockInAt: now,
    });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
});

/**
 * POST /api/kiosk/clock-out
 * Kiosk endpoint to clock out (requires device auth)
 */
router.post('/clock-out', requireKioskAuth, async (req: any, res: Response) => {
  try {
    const { pin } = req.body;
    const device = req.device;

    if (!pin || !/^\d{4,8}$/.test(pin)) {
      return res.status(400).json({ error: 'Invalid PIN format' });
    }

    // Find user by PIN
    const usersSnapshot = await db
      .collection('users')
      .where('locationId', '==', device.locationId)
      .get();

    const hashedPin = hashSecret(pin);
    let userDoc = null;

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      if (userData.pin === hashedPin) {
        userDoc = doc;
        break;
      }
    }

    if (!userDoc) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Find active time entry
    const activeEntriesSnapshot = await db
      .collection('timeEntries')
      .where('userId', '==', userDoc.id)
      .where('clockOutAt', '==', null)
      .get();

    if (activeEntriesSnapshot.empty) {
      return res.status(400).json({ error: 'No active time entry found' });
    }

    const timeEntryDoc = activeEntriesSnapshot.docs[0];
    const now = new Date().toISOString();

    // Update time entry
    await timeEntryDoc.ref.update({
      clockOutAt: now,
      updatedAt: now,
    });

    res.json({
      timeEntryId: timeEntryDoc.id,
      clockOutAt: now,
    });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
});

/**
 * POST /api/kiosk/verify-admin
 * Kiosk endpoint to verify an admin PIN (requires device auth)
 */
router.post('/verify-admin', requireKioskAuth, async (req: any, res: Response) => {
  try {
    const { pin } = req.body;
    const device = req.device;

    if (!pin || !/^\d{4,8}$/.test(pin)) {
      return res.status(400).json({ error: 'Invalid PIN format' });
    }

    // Find user by PIN and business (admins can exit from any location in their business)
    const usersSnapshot = await db
      .collection('users')
      .where('businessId', '==', device.businessId)
      .where('role', 'in', ['OWNER', 'MANAGER', 'SUPERADMIN'])
      .get();

    const hashedPin = hashSecret(pin);
    let userDoc = null;

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      if (userData.pin === hashedPin) {
        userDoc = doc;
        break;
      }
    }

    if (!userDoc) {
      return res.status(401).json({ error: 'Invalid Admin PIN' });
    }

    res.json({
      success: true,
      role: userDoc.data().role,
      displayName: userDoc.data().displayName,
    });
  } catch (error) {
    console.error('Verify admin error:', error);
    res.status(500).json({ error: 'Failed to verify admin PIN' });
  }
});

export default router;
