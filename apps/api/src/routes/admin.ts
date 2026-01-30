/**
 * Admin Routes
 */

import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { db } from '../config/firebase';
import { isValidTimezone } from '../utils/validation';
import { createStaffSchema } from '@shared/types';
import { hashSecret } from '../utils/crypto';
import {
  notifyWorkerWelcome,
  notifyWorkerPayRateChange,
  notifyManagerNewStaff,
  notifyOwnerSetupComplete,
  notifyOwnerLocationAdded,
  notifyOwnerKioskProvisioned,
} from '../services/notifications';

const router = Router();

/**
 * POST /api/admin/login
 * Super Admin login with UUID (public endpoint, no auth required)
 */
router.post('/login', async (req, res: Response) => {
  try {
    const { uuid } = req.body;

    if (!uuid || typeof uuid !== 'string') {
      return res.status(400).json({ error: 'UUID is required' });
    }

    const superAdminUid = process.env.SUPERADMIN_UID;
    if (!superAdminUid) {
      return res.status(500).json({ error: 'Super admin configuration missing' });
    }

    // Validate UUID matches SUPERADMIN_UID
    if (uuid !== superAdminUid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if super admin user exists in Firestore
    let userDoc = await db.collection('users').doc(superAdminUid).get();
    
    if (!userDoc.exists) {
      // Create super admin user if it doesn't exist
      const { auth } = await import('../config/firebase');
      
      // Check if Firebase Auth user exists
      let firebaseUser;
      try {
        firebaseUser = await auth.getUser(superAdminUid);
      } catch {
        // Create Firebase Auth user if it doesn't exist
        firebaseUser = await auth.createUser({
          uid: superAdminUid,
          email: `admin@tech-etime.com`, // Default email
          displayName: 'Super Admin',
          disabled: false,
        });
      }

      // Create Firestore user document
      const now = new Date().toISOString();
      await db.collection('users').doc(superAdminUid).set({
        email: firebaseUser.email || `admin@tech-etime.com`,
        displayName: 'Super Admin',
        role: 'SUPERADMIN',
        onboardingStatus: 'SETUP_COMPLETED',
        createdAt: now,
        updatedAt: now,
      });

      // Set custom claims
      await auth.setCustomUserClaims(superAdminUid, {
        role: 'SUPERADMIN',
      });

      userDoc = await db.collection('users').doc(superAdminUid).get();
    }

    // Generate custom token for login
    const { auth } = await import('../config/firebase');
    const customToken = await auth.createCustomToken(superAdminUid, {
      role: 'SUPERADMIN',
    });

    res.json({
      customToken,
      user: {
        id: userDoc.id,
        ...userDoc.data(),
      },
    });
  } catch (error) {
    console.error('Super admin login error:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

// All other admin routes require authentication
router.use(requireAuth);

/**
 * PUT /api/admin/onboarding-status
 * Update user's onboarding status
 */
router.put('/onboarding-status', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status } = req.body;
    if (!['NEW', 'TOUR_COMPLETED', 'SETUP_COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.collection('users').doc(req.user.uid).update({
      onboardingStatus: status,
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: 'Onboarding status updated' });
  } catch (error) {
    console.error('Update onboarding status error:', error);
    res.status(500).json({ error: 'Failed to update onboarding status' });
  }
});

/**
 * GET /api/admin/business
 * Get the authenticated user's business
 */
router.get('/business', async (req: AuthRequest, res: Response) => {
  try {
    // CLIENT_ADMIN should use /api/client-admin/businesses instead
    if (req.user?.role === 'CLIENT_ADMIN') {
      return res.status(400).json({ error: 'CLIENT_ADMIN should use /api/client-admin/businesses endpoint' });
    }

    if (!req.user?.businessId) {
      return res.status(403).json({ error: 'User not associated with a business' });
    }

    const businessDoc = await db.collection('businesses').doc(req.user.businessId).get();

    if (!businessDoc.exists) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const data = businessDoc.data();
    if (data?.ownerId !== req.user.uid && req.user.role !== 'SUPERADMIN' && req.user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Not authorized to view this business' });
    }

    res.json({
      id: businessDoc.id,
      ...data,
    });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

/**
 * PUT /api/admin/business
 * Update the authenticated user's business
 */
router.put('/business', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId) {
      return res.status(403).json({ error: 'User not associated with a business' });
    }

    const businessRef = db.collection('businesses').doc(req.user.businessId);
    const businessDoc = await businessRef.get();

    if (!businessDoc.exists) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const data = businessDoc.data();
    if (data?.ownerId !== req.user.uid && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Only the owner can update business settings' });
    }

    const { name, address, phone } = req.body;
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (address !== undefined) updates.address = address || null;
    if (phone !== undefined) updates.phone = phone || null;

    if (Object.keys(updates).length <= 1) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    await businessRef.update(updates);
    const updated = await businessRef.get();

    res.json({
      id: updated.id,
      ...updated.data(),
    });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

/**
 * POST /api/admin/complete-setup
 * Complete setup for existing user (creates Business + Location, updates user)
 */
router.post('/complete-setup', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(403).json({ error: 'User not properly authenticated' });
    }

    const { businessName, locationName, locationTimezone, pin } = req.body;

    if (!businessName || !locationName || !locationTimezone || !pin) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!isValidTimezone(locationTimezone)) {
      return res.status(400).json({ error: 'Invalid timezone' });
    }

    if (!/^\d{4,8}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4-8 digits' });
    }

    const result = await db.runTransaction(async (transaction) => {
      const now = new Date().toISOString();

      // Check if business already exists
      const userDoc = await transaction.get(db.collection('users').doc(req.user!.uid));
      const existingBusinessId = userDoc.data()?.businessId;

      let businessId = existingBusinessId;
      let businessRef;

      if (!businessId) {
        // Create Business document
        businessRef = db.collection('businesses').doc();
        businessId = businessRef.id;
        transaction.set(businessRef, {
          name: businessName,
          ownerId: req.user!.uid,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Create Location document
      const locationRef = db.collection('locations').doc();
      const locationData = {
        businessId,
        name: locationName,
        timezone: locationTimezone,
        createdAt: now,
        updatedAt: now,
      };
      transaction.set(locationRef, locationData);

      // Update User document
      const userRef = db.collection('users').doc(req.user!.uid);
      transaction.update(userRef, {
        businessId,
        locationId: locationRef.id,
        pin: hashSecret(pin),
        onboardingStatus: 'SETUP_COMPLETED',
        updatedAt: now,
      });

      return {
        businessId,
        locationId: locationRef.id,
      };
    });

    // Get business name for notification
    const businessDocForNotification = await db.collection('businesses').doc(result.businessId).get();
    const businessNameForNotification = businessDocForNotification.data()?.name || 'Your Business';

    // Send setup complete notification
    try {
      await notifyOwnerSetupComplete(req.user!.uid, {
        businessName: businessNameForNotification,
      });
    } catch (notifError) {
      console.error('Failed to send setup complete notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      message: 'Setup completed successfully',
      ...result,
    });
  } catch (error) {
    console.error('Complete setup error:', error);
    res.status(500).json({ error: 'Failed to complete setup' });
  }
});

/**
 * GET /api/admin/locations
 * Get all locations for the authenticated user's business
 */
router.get('/locations', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId) {
      return res.status(403).json({ error: 'User not associated with a business' });
    }

    const locationsSnapshot = await db
      .collection('locations')
      .where('businessId', '==', req.user.businessId)
      .get();

    const locations = locationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ locations });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

/**
 * POST /api/admin/locations
 * Create a new location
 */
router.post('/locations', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId) {
      return res.status(403).json({ error: 'User not associated with a business' });
    }

    // Only OWNER can create locations
    if (req.user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only owner can create locations' });
    }

    const { name, address, timezone } = req.body;

    if (!name || !timezone) {
      return res.status(400).json({ error: 'Name and timezone are required' });
    }

    if (!isValidTimezone(timezone)) {
      return res.status(400).json({ error: 'Invalid timezone' });
    }

    const now = new Date().toISOString();
    const locationRef = db.collection('locations').doc();
    const locationData = {
      businessId: req.user.businessId,
      name,
      address: address || null,
      timezone,
      createdAt: now,
      updatedAt: now,
    };

    await locationRef.set(locationData);

    // Get business info for notification
    const businessDoc = await db.collection('businesses').doc(req.user.businessId).get();
    const businessName = businessDoc.data()?.name || 'Your Business';
    const ownerId = businessDoc.data()?.ownerId;

    // Notify owner when location is added
    if (ownerId) {
      try {
        await notifyOwnerLocationAdded(ownerId, {
          locationName: name,
          timezone,
          businessName,
        });
      } catch (notifError) {
        console.error('Failed to send location added notification:', notifError);
      }
    }

    res.status(201).json({
      id: locationRef.id,
      ...locationData,
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

/**
 * PUT /api/admin/locations/:id
 * Update a location
 */
router.put('/locations/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId) {
      return res.status(403).json({ error: 'User not associated with a business' });
    }

    // Only OWNER can update locations
    if (req.user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only owner can update locations' });
    }

    const { id } = req.params;
    const { name, address, timezone } = req.body;

    const locationRef = db.collection('locations').doc(id);
    const locationDoc = await locationRef.get();

    if (!locationDoc.exists) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const locationData = locationDoc.data();
    if (locationData?.businessId !== req.user.businessId) {
      return res.status(403).json({ error: 'Not authorized to update this location' });
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (timezone !== undefined) {
      if (!isValidTimezone(timezone)) {
        return res.status(400).json({ error: 'Invalid timezone' });
      }
      updates.timezone = timezone;
    }

    await locationRef.update(updates);

    const updatedDoc = await locationRef.get();
    res.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

/**
 * DELETE /api/admin/locations/:id
 * Delete a location
 */
router.delete('/locations/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId) {
      return res.status(403).json({ error: 'User not associated with a business' });
    }

    // Only OWNER can delete locations
    if (req.user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only owner can delete locations' });
    }

    const { id } = req.params;
    const locationRef = db.collection('locations').doc(id);
    const locationDoc = await locationRef.get();

    if (!locationDoc.exists) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const locationData = locationDoc.data();
    if (locationData?.businessId !== req.user.businessId) {
      return res.status(403).json({ error: 'Not authorized to delete this location' });
    }

    await locationRef.delete();

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

/**
 * GET /api/admin/users
 * Get all users (staff) for the authenticated user's business
 */
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId) {
      return res.status(403).json({ error: 'User not associated with a business' });
    }

    const usersSnapshot = await db
      .collection('users')
      .where('businessId', '==', req.user.businessId)
      .get();

    const users = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      // Don't expose PIN hash
      const { pin, ...userData } = data;
      return {
        id: doc.id,
        ...userData,
      };
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * POST /api/admin/users
 * Create a new staff member (Worker or Manager)
 */
router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId) {
      return res.status(403).json({ error: 'User not associated with a business' });
    }

    // Only OWNER and MANAGER can create staff
    if (req.user.role !== 'OWNER' && req.user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Not authorized to create staff' });
    }

    // Validate input
    const validationResult = createStaffSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { displayName, email, pin, role, locationId, payRate } = validationResult.data;

    // Verify location belongs to business
    const locationDoc = await db.collection('locations').doc(locationId).get();
    if (!locationDoc.exists) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const locationData = locationDoc.data();
    if (locationData?.businessId !== req.user.businessId) {
      return res.status(403).json({ error: 'Location does not belong to your business' });
    }

    // For MANAGER role, email is required
    if (role === 'MANAGER' && !email) {
      return res.status(400).json({ error: 'Email is required for Manager role' });
    }

    const now = new Date().toISOString();

    // Create user document
    const userRef = db.collection('users').doc();
    const userData: any = {
      displayName,
      onboardingStatus: 'NEW',
      role,
      businessId: req.user.businessId,
      locationId,
      pin: hashSecret(pin),
      payRates: [
        {
          amount: payRate.amount,
          effectiveDate: payRate.effectiveDate,
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Add email if provided
    if (email) {
      userData.email = email;
    }

    await userRef.set(userData);

    // If email provided and role is MANAGER, create Firebase Auth user
    if (email && role === 'MANAGER') {
      try {
        const { auth } = await import('../config/firebase');
        await auth.createUser({
          email,
          displayName,
          disabled: false,
        });

        // Set custom claims
        await auth.setCustomUserClaims((await auth.getUserByEmail(email)).uid, {
          role,
          businessId: req.user.businessId,
        });
      } catch (authError: any) {
        // If auth user creation fails, delete the Firestore user
        await userRef.delete();
        if (authError.code === 'auth/email-already-exists') {
          return res.status(409).json({ error: 'Email already registered' });
        }
        throw authError;
      }
    }

    // Don't expose PIN hash in response
    const { pin: _, ...responseData } = userData;

    // Send welcome notification if user is a WORKER
    if (role === 'WORKER' && email) {
      try {
        await notifyWorkerWelcome(userRef.id, {
          pin: pin, // Send plain PIN in email (user needs to know it)
          payRate: payRate.amount,
        });
      } catch (notifError) {
        console.error('Failed to send welcome notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    // Notify managers when new staff is added
    if (role === 'WORKER' || role === 'MANAGER') {
      try {
        // Get all managers in the business
        const managersSnapshot = await db
          .collection('users')
          .where('businessId', '==', req.user.businessId)
          .where('role', '==', 'MANAGER')
          .get();

        const locationDoc = await db.collection('locations').doc(locationId).get();
        const locationName = locationDoc.data()?.name || 'Unknown Location';

        await Promise.all(
          managersSnapshot.docs.map((doc) =>
            notifyManagerNewStaff(doc.id, {
              staffName: displayName,
              staffRole: role,
              locationName,
            }).catch((err) => console.error(`Failed to notify manager ${doc.id}:`, err))
          )
        );
      } catch (notifError) {
        console.error('Failed to send manager notification:', notifError);
      }
    }

    res.status(201).json({
      id: userRef.id,
      ...responseData,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update a staff member
 */
router.put('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId) {
      return res.status(403).json({ error: 'User not associated with a business' });
    }

    // Only OWNER can update users
    if (req.user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only owner can update users' });
    }

    const { id } = req.params;
    const { displayName, email, pin, role, locationId, payRate } = req.body;

    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    if (userData?.businessId !== req.user.businessId) {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }

    // Only OWNER can change roles
    if (role && role !== userData.role && req.user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only owner can change user roles' });
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (displayName !== undefined) updates.displayName = displayName;
    if (email !== undefined) updates.email = email;
    if (pin !== undefined) updates.pin = hashSecret(pin);
    if (role !== undefined) updates.role = role;
    if (locationId !== undefined) {
      // Verify location belongs to business
      const locationDoc = await db.collection('locations').doc(locationId).get();
      if (!locationDoc.exists || locationDoc.data()?.businessId !== req.user.businessId) {
        return res.status(400).json({ error: 'Invalid location' });
      }
      updates.locationId = locationId;
    }

    // Handle pay rate updates
    if (payRate !== undefined) {
      const existingPayRates = userData.payRates || [];
      const previousRate = existingPayRates.length > 0
        ? existingPayRates[existingPayRates.length - 1].amount
        : 0;
      
      updates.payRates = [
        ...existingPayRates,
        {
          amount: payRate.amount,
          effectiveDate: payRate.effectiveDate,
          createdAt: new Date().toISOString(),
        },
      ];

      // Notify user of pay rate change if they're a WORKER
      if (userData.role === 'WORKER' && payRate.amount !== previousRate) {
        try {
          await notifyWorkerPayRateChange(id, {
            previousRate,
            newRate: payRate.amount,
            effectiveDate: payRate.effectiveDate,
          });
        } catch (notifError) {
          console.error('Failed to send pay rate change notification:', notifError);
        }
      }
    }

    await userRef.update(updates);

    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data()!;
    const { pin: _, ...responseData } = updatedData;

    res.json({
      id: updatedDoc.id,
      ...responseData,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete (deactivate) a staff member
 */
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId) {
      return res.status(403).json({ error: 'User not associated with a business' });
    }

    // Only OWNER can delete users
    if (req.user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only owner can delete users' });
    }

    const { id } = req.params;
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    if (userData?.businessId !== req.user.businessId) {
      return res.status(403).json({ error: 'Not authorized to delete this user' });
    }

    // Don't allow deleting OWNER
    if (userData.role === 'OWNER') {
      return res.status(403).json({ error: 'Cannot delete owner account' });
    }

    // Soft delete: remove from active users (or mark as deleted)
    // For now, we'll actually delete the document
    await userRef.delete();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/admin/payroll-summaries
 * Get payroll summaries for the authenticated user's business
 * Query params: startDate, endDate, userId (optional)
 */
router.get('/payroll-summaries', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId) {
      return res.status(403).json({ error: 'User not associated with a business' });
    }

    const { startDate, endDate, userId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate as string) || !dateRegex.test(endDate as string)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    let query = db
      .collection('dailyPayrollSummaries')
      .where('businessId', '==', req.user.businessId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate);

    // Optionally filter by userId
    if (userId) {
      query = query.where('userId', '==', userId) as any;
    }

    const snapshot = await query.get();

    const summaries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch user display names
    const userIds = [...new Set(summaries.map((s: any) => s.userId))];
    const userDocs = await Promise.all(
      userIds.map((uid) => db.collection('users').doc(uid).get())
    );

    const userMap = new Map();
    userDocs.forEach((doc) => {
      if (doc.exists) {
        userMap.set(doc.id, doc.data()?.displayName || 'Unknown');
      }
    });

    // Enrich summaries with user names
    const enriched = summaries.map((summary: any) => ({
      ...summary,
      userName: userMap.get(summary.userId) || 'Unknown',
    }));

    res.json({ summaries: enriched });
  } catch (error) {
    const err = error as Error & { message?: string };
    console.error('Get payroll summaries error:', err?.message ?? err);
    if (err?.message?.includes('index')) {
      console.error(
        'Create the required Firestore index: run "firebase deploy --only firestore:indexes" or use the URL in the error above.'
      );
    }
    res.status(500).json({ error: 'Failed to fetch payroll summaries' });
  }
});

/**
 * GET /api/admin/time-entries
 * Get time entries for the authenticated user's business
 * Query params: startDate, endDate, userId (optional)
 */
router.get('/time-entries', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId) {
      return res.status(403).json({ error: 'User not associated with a business' });
    }

    const { startDate, endDate, userId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Convert dates to ISO timestamps for query
    const startTimestamp = new Date(`${startDate}T00:00:00Z`).toISOString();
    const endTimestamp = new Date(`${endDate}T23:59:59Z`).toISOString();

    let query = db
      .collection('timeEntries')
      .where('businessId', '==', req.user.businessId)
      .where('clockInAt', '>=', startTimestamp)
      .where('clockInAt', '<=', endTimestamp);

    // Optionally filter by userId
    if (userId) {
      query = query.where('userId', '==', userId) as any;
    }

    const snapshot = await query.get();

    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch user display names
    const userIds = [...new Set(entries.map((e: any) => e.userId))];
    const userDocs = await Promise.all(
      userIds.map((uid) => db.collection('users').doc(uid).get())
    );

    const userMap = new Map();
    userDocs.forEach((doc) => {
      if (doc.exists) {
        userMap.set(doc.id, doc.data()?.displayName || 'Unknown');
      }
    });

    // Enrich entries with user names
    const enriched = entries.map((entry: any) => ({
      ...entry,
      userName: userMap.get(entry.userId) || 'Unknown',
    }));

    res.json({ entries: enriched });
  } catch (error) {
    const err = error as Error & { message?: string };
    console.error('Get time entries error:', err?.message ?? err);
    if (err?.message?.includes('index')) {
      console.error(
        'Create the required Firestore index: run "firebase deploy --only firestore:indexes" or use the URL in the error above.'
      );
    }
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

/**
 * GET /api/admin/profile
 * Get current user's profile
 */
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    // Don't expose PIN hash
    const { pin, ...profileData } = userData || {};

    res.json({
      id: userDoc.id,
      ...profileData,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/admin/profile
 * Update current user's own profile (limited fields)
 */
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { displayName, phoneNumber } = req.body;

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length === 0) {
        return res.status(400).json({ error: 'Display name is required' });
      }
      updates.displayName = displayName.trim();
    }

    if (phoneNumber !== undefined) {
      // Allow clearing phone number (empty string)
      updates.phoneNumber = phoneNumber?.trim() || null;
    }

    await db.collection('users').doc(req.user.uid).update(updates);

    // Fetch updated user
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    const { pin, ...profileData } = userData || {};

    res.json({
      id: userDoc.id,
      ...profileData,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
