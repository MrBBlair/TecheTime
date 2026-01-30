/**
 * Authentication Routes
 */

import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { db, auth } from '../config/firebase';
import { registerBusinessSchema } from '@shared/types';
import { hashSecret } from '../utils/crypto';
import { isValidTimezone } from '../utils/validation';

const router = Router();

/**
 * POST /api/auth/register
 * Simple user registration - creates Firebase Auth user and Firestore user document
 */
router.post('/register', async (req, res: Response) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and display name are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });

    const now = new Date().toISOString();

    // Create User document in Firestore (without business/location yet)
    const userRef = db.collection('users').doc(userRecord.uid);
    const userData = {
      email,
      displayName,
      onboardingStatus: 'NEW',
      role: 'OWNER', // Will be set when business is created
      createdAt: now,
      updatedAt: now,
    };

    await userRef.set(userData);

    res.status(201).json({
      message: 'Account created successfully',
      userId: userRecord.uid,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Failed to create account' 
      : error.message || 'Failed to create account';
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /api/auth/register-business
 * Atomic transaction: Creates User + Business + Location
 * @deprecated - Use /register + /admin/complete-setup instead
 */
router.post('/register-business', async (req, res: Response) => {
  try {
    // Validate input
    const validationResult = registerBusinessSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { email, password, displayName, businessName, locationName, locationTimezone, pin } =
      validationResult.data;

    // Validate timezone
    if (!isValidTimezone(locationTimezone)) {
      return res.status(400).json({ error: 'Invalid timezone' });
    }

    // Use transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
      });

      const now = new Date().toISOString();

      // Create Business document
      const businessRef = db.collection('businesses').doc();
      const businessData = {
        name: businessName,
        ownerId: userRecord.uid,
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

      // Create User document
      const userRef = db.collection('users').doc(userRecord.uid);
      const userData = {
        email,
        displayName,
        onboardingStatus: 'NEW',
        role: 'OWNER',
        businessId: businessRef.id,
        locationId: locationRef.id,
        pin: hashSecret(pin),
        createdAt: now,
        updatedAt: now,
      };
      transaction.set(userRef, userData);

      // Set custom claim for role
      await auth.setCustomUserClaims(userRecord.uid, {
        role: 'OWNER',
        businessId: businessRef.id,
      });

      return {
        userId: userRecord.uid,
        businessId: businessRef.id,
        locationId: locationRef.id,
      };
    });

    res.status(201).json({
      message: 'Business registered successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Register business error:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Failed to register business' });
  }
});

export default router;
