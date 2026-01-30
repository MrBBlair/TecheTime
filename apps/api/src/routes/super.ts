/**
 * Super Admin Routes (Hidden)
 */

import { Router, Response } from 'express';
import { AuthRequest, requireAuth, requireSuperAdmin } from '../middleware/auth';
import { auth, db } from '../config/firebase';
import { impersonateSchema } from '@shared/types';

const router = Router();

// All super admin routes require super admin access
router.use(requireAuth);
router.use(requireSuperAdmin);

/**
 * POST /api/super/impersonate
 * Generate a custom token to login as any user
 */
router.post('/impersonate', async (req: AuthRequest, res: Response) => {
  try {
    const validationResult = impersonateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { userId } = validationResult.data;

    // Verify user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate custom token (expires in 1 hour)
    const customToken = await auth.createCustomToken(userId, {
      role: userDoc.data()?.role,
      businessId: userDoc.data()?.businessId,
    });

    res.json({ customToken });
  } catch (error) {
    console.error('Impersonate error:', error);
    res.status(500).json({ error: 'Failed to generate impersonation token' });
  }
});

/**
 * GET /api/super/businesses
 * List all businesses (tenants)
 */
router.get('/businesses', async (req: AuthRequest, res: Response) => {
  try {
    const businessesSnapshot = await db.collection('businesses').get();

    const businesses = await Promise.all(
      businessesSnapshot.docs.map(async (doc) => {
        const businessData = doc.data();

        // Get location count
        const locationsSnapshot = await db
          .collection('locations')
          .where('businessId', '==', doc.id)
          .get();

        // Get user count and owner for impersonation
        const usersSnapshot = await db
          .collection('users')
          .where('businessId', '==', doc.id)
          .get();

        const owner =
          usersSnapshot.docs.find((d) => d.data()?.role === 'OWNER') ||
          usersSnapshot.docs[0];
        const ownerId = owner?.id ?? null;

        return {
          id: doc.id,
          ...businessData,
          locationCount: locationsSnapshot.size,
          userCount: usersSnapshot.size,
          ownerId,
        };
      })
    );

    res.json({ businesses });
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

/**
 * POST /api/super/set-superadmin
 * Set a user as SuperAdmin (protected by existing SuperAdmin or setup secret)
 */
router.post('/set-superadmin', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if caller is already SuperAdmin OR using setup secret
    const setupSecret = process.env.SUPERADMIN_SETUP_SECRET;
    const isAuthorized = 
      req.user?.role === 'SUPERADMIN' || 
      (setupSecret && req.headers['x-setup-secret'] === setupSecret);

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Unauthorized: SuperAdmin access or setup secret required' });
    }

    // Check if Firebase Auth user exists
    let firebaseUser;
    try {
      firebaseUser = await auth.getUser(userId);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create Firebase Auth user
        firebaseUser = await auth.createUser({
          uid: userId,
          email: `superadmin-${userId.substring(0, 8)}@tech-etime.local`,
          displayName: 'Super Admin',
          disabled: false,
        });
      } else {
        throw error;
      }
    }

    // Set custom claims
    await auth.setCustomUserClaims(userId, {
      role: 'SUPERADMIN',
      businessId: null,
    });

    // Create/Update Firestore user document
    const now = new Date().toISOString();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    const userData = {
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || 'Super Admin',
      role: 'SUPERADMIN' as const,
      onboardingStatus: 'SETUP_COMPLETED' as const,
      createdAt: userDoc.exists ? userDoc.data()?.createdAt : now,
      updatedAt: now,
    };

    await userRef.set(userData, { merge: true });

    res.json({
      success: true,
      message: `User ${userId} is now a SuperAdmin`,
      user: {
        id: userId,
        ...userData,
      },
    });
  } catch (error: any) {
    console.error('Set SuperAdmin error:', error);
    res.status(500).json({ error: 'Failed to set SuperAdmin', details: error.message });
  }
});

export default router;
