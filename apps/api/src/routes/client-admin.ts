/**
 * Client Admin Routes - For CLIENT_ADMIN role managing multiple businesses
 */

import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { db } from '../config/firebase';
import { isValidTimezone } from '../utils/validation';
import { notifyClientAdminBusinessCreated } from '../services/notifications';

const router = Router();

// All client admin routes require authentication
router.use(requireAuth);

/**
 * Middleware to ensure user is CLIENT_ADMIN
 */
function requireClientAdmin(req: AuthRequest, res: Response, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role !== 'CLIENT_ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Client admin access required' });
  }

  next();
}

router.use(requireClientAdmin);

/**
 * GET /api/client-admin/businesses
 * List all businesses managed by this CLIENT_ADMIN
 */
router.get('/businesses', async (req: AuthRequest, res: Response) => {
  try {
    const businessesSnapshot = await db
      .collection('businesses')
      .where('clientAdminId', '==', req.user!.uid)
      .get();

    const businesses = await Promise.all(
      businessesSnapshot.docs.map(async (doc) => {
        const businessData = doc.data();

        // Get location count
        const locationsSnapshot = await db
          .collection('locations')
          .where('businessId', '==', doc.id)
          .get();

        // Get user count
        const usersSnapshot = await db
          .collection('users')
          .where('businessId', '==', doc.id)
          .get();

        // Get owner info
        let ownerName = 'Unknown';
        if (businessData.ownerId) {
          const ownerDoc = await db.collection('users').doc(businessData.ownerId).get();
          if (ownerDoc.exists) {
            ownerName = ownerDoc.data()?.displayName || ownerDoc.data()?.email || 'Unknown';
          }
        }

        return {
          id: doc.id,
          ...businessData,
          locationCount: locationsSnapshot.size,
          userCount: usersSnapshot.size,
          ownerName,
        };
      })
    );

    res.json({ businesses });
  } catch (error) {
    console.error('Get client admin businesses error:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

/**
 * POST /api/client-admin/businesses
 * Create a new business (CLIENT_ADMIN creates business and assigns an OWNER)
 */
router.post('/businesses', async (req: AuthRequest, res: Response) => {
  try {
    const { name, ownerEmail, ownerDisplayName, ownerPassword, locationName, locationTimezone } = req.body;

    if (!name || !ownerEmail || !ownerDisplayName || !ownerPassword || !locationName || !locationTimezone) {
      return res.status(400).json({
        error: 'Missing required fields: name, ownerEmail, ownerDisplayName, ownerPassword, locationName, locationTimezone',
      });
    }

    // Validate timezone
    if (!isValidTimezone(locationTimezone)) {
      return res.status(400).json({ error: 'Invalid timezone' });
    }

    // Validate password length
    if (ownerPassword.length < 6) {
      return res.status(400).json({ error: 'Owner password must be at least 6 characters' });
    }

    // Validate email format
    if (!ownerEmail.includes('@') || !ownerEmail.includes('.')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const { auth } = await import('../config/firebase');
    const { hashSecret } = await import('../utils/crypto');

    // Check if owner email already exists
    try {
      await auth.getUserByEmail(ownerEmail);
      return res.status(409).json({ error: 'Owner email already registered' });
    } catch (e: any) {
      if (e.code !== 'auth/user-not-found') {
        throw e;
      }
    }

    const now = new Date().toISOString();

    // Create business, location, and owner user in a transaction
    const result = await db.runTransaction(async (transaction) => {
      // Create Business document
      const businessRef = db.collection('businesses').doc();
      const businessData = {
        name,
        ownerId: '', // Will be set after creating owner
        clientAdminId: req.user!.uid,
        createdAt: now,
        updatedAt: now,
      };
      transaction.set(businessRef, businessData);

      // Create Location document
      const locationRef = db.collection('locations').doc();
      const locationData = {
        businessId: businessRef.id,
        name: locationName,
        timezone: locationTimezone,
        createdAt: now,
        updatedAt: now,
      };
      transaction.set(locationRef, locationData);

      // Create Firebase Auth user for owner
      const userRecord = await auth.createUser({
        email: ownerEmail,
        password: ownerPassword,
        displayName: ownerDisplayName,
      });

      // Create User document for owner
      const userRef = db.collection('users').doc(userRecord.uid);
      const userData = {
        email: ownerEmail,
        displayName: ownerDisplayName,
        onboardingStatus: 'SETUP_COMPLETED', // Skip onboarding since CLIENT_ADMIN created them
        role: 'OWNER',
        businessId: businessRef.id,
        locationId: locationRef.id,
        pin: hashSecret('0000'), // Default PIN, owner can change
        createdAt: now,
        updatedAt: now,
      };
      transaction.set(userRef, userData);

      // Update business with ownerId
      transaction.update(businessRef, { ownerId: userRecord.uid });

      // Set custom claims
      await auth.setCustomUserClaims(userRecord.uid, {
        role: 'OWNER',
        businessId: businessRef.id,
      });

      return {
        businessId: businessRef.id,
        locationId: locationRef.id,
        ownerId: userRecord.uid,
      };
    });

    // Send notification to CLIENT_ADMIN
    try {
      await notifyClientAdminBusinessCreated(req.user!.uid, {
        businessName: name,
        businessId: result.businessId,
        ownerName: ownerDisplayName,
        locationName,
      });
    } catch (notifError) {
      console.error('Failed to send business created notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      message: 'Business created successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Create business error:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Owner email already registered' });
    }
    res.status(500).json({ error: 'Failed to create business' });
  }
});

/**
 * GET /api/client-admin/businesses/:businessId
 * Get details of a specific business (must be managed by this CLIENT_ADMIN)
 */
router.get('/businesses/:businessId', async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.params;

    const businessDoc = await db.collection('businesses').doc(businessId).get();
    if (!businessDoc.exists) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const businessData = businessDoc.data();
    if (businessData?.clientAdminId !== req.user!.uid) {
      return res.status(403).json({ error: 'Not authorized to view this business' });
    }

    // Get additional info
    const locationsSnapshot = await db
      .collection('locations')
      .where('businessId', '==', businessId)
      .get();

    const usersSnapshot = await db
      .collection('users')
      .where('businessId', '==', businessId)
      .get();

    res.json({
      id: businessDoc.id,
      name: businessData?.name || '',
      ownerId: businessData?.ownerId || '',
      clientAdminId: businessData?.clientAdminId,
      createdAt: businessData?.createdAt,
      updatedAt: businessData?.updatedAt,
      locationCount: locationsSnapshot.size,
      userCount: usersSnapshot.size,
    });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

export default router;
