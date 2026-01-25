import { Router } from 'express';
import { auth, db } from '../firebase/admin.js';
import { registerBusinessSchema, createBusinessSchema } from '@techetime/shared';
import { sendWelcomeEmail } from '../services/postmark.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/register-business', async (req, res, next) => {
  try {
    // Validate request body
    const data = registerBusinessSchema.parse(req.body);
    const { firebaseUid } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'Firebase UID is required' });
    }

    // Verify Firebase token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (tokenError: any) {
      if (tokenError.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Authentication token has expired. Please try again.' });
      } else if (tokenError.code === 'auth/id-token-revoked') {
        return res.status(401).json({ error: 'Authentication token has been revoked.' });
      } else {
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    }
    
    if (decodedToken.uid !== firebaseUid) {
      return res.status(401).json({ error: 'Token UID does not match provided Firebase UID' });
    }

    // Check if user already exists in Firestore
    const userDoc = await db.collection('users').doc(firebaseUid).get();
    if (userDoc.exists) {
      return res.status(409).json({ 
        error: 'User already registered',
        message: 'This account is already registered. Please log in instead.'
      });
    }

    // Create business and user document in a transaction to ensure atomicity
    const businessRef = db.collection('businesses').doc();
    const businessId = businessRef.id;
    const now = new Date();

    try {
      // Use batch write to ensure both operations succeed or fail together
      const batch = db.batch();
      
      // Create business
      batch.set(businessRef, {
        name: data.businessName.trim(),
        createdAt: now,
      });

      // Create user document (password is handled by Firebase Auth)
      batch.set(db.collection('users').doc(firebaseUid), {
        businessId, // Legacy field for backward compatibility
        businessIds: [businessId], // New array field
        defaultBusinessId: businessId,
        email: data.ownerEmail.toLowerCase().trim(),
        role: 'OWNER',
        firstName: data.ownerFirstName.trim(),
        lastName: data.ownerLastName.trim(),
        pinHash: null,
        pinEnabled: false,
        isActive: true,
        createdAt: now,
      });

      // Commit the batch
      await batch.commit();

      // Send welcome email (non-blocking - don't fail registration if email fails)
      try {
        const ownerName = `${data.ownerFirstName} ${data.ownerLastName}`;
        await sendWelcomeEmail(data.ownerEmail, data.businessName, ownerName);
      } catch (emailError) {
        console.error('Failed to send welcome email (non-critical):', emailError);
        // Don't throw - email failure shouldn't fail registration
      }

      // Fetch the created documents to return
      const userData = (await db.collection('users').doc(firebaseUid).get()).data()!;
      const businessData = (await businessRef.get()).data()!;

      res.status(201).json({
        user: { ...userData, id: firebaseUid },
        business: { ...businessData, id: businessId },
        message: 'Business and account created successfully',
      });
    } catch (dbError: any) {
      console.error('Database error during registration:', dbError);
      // If database operation fails, the Firebase Auth user will be cleaned up by the frontend
      throw new Error('Failed to create business or user account. Please try again.');
    }
  } catch (error: any) {
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      const validationErrors = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors 
      });
    }
    
    // Handle other errors
    console.error('Registration error:', error);
    next(error);
  }
});

authRouter.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data()!;
    
    // Support both old (businessId) and new (businessIds) formats
    const businessIds = userData.businessIds || (userData.businessId ? [userData.businessId] : []);
    
    // Load all businesses user belongs to
    const businessPromises = businessIds.map((bid: string) => db.collection('businesses').doc(bid).get());
    const businessDocs = await Promise.all(businessPromises);
    const businesses = businessDocs
      .filter(doc => doc.exists)
      .map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Get default/selected business
    const defaultBusinessId = userData.defaultBusinessId || businessIds[0] || userData.businessId;
    const defaultBusiness = businesses.find(b => b.id === defaultBusinessId) || businesses[0] || null;

    res.json({
      user: { ...userData, id: userDoc.id },
      business: defaultBusiness,
      businesses: businesses,
    });
  } catch (error) {
    next(error);
  }
});

// Create a business for an existing authenticated user
authRouter.post('/create-business', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const data = createBusinessSchema.parse(req.body);
    
    // Check if user already has businesses
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data()!;
    const existingBusinessIds = userData.businessIds || (userData.businessId ? [userData.businessId] : []);
    
    // Create business
    const businessRef = db.collection('businesses').doc();
    const businessId = businessRef.id;
    const now = new Date();
    
    // Use batch write to ensure atomicity
    const batch = db.batch();
    
    // Create business with all provided details
    batch.set(businessRef, {
      name: data.businessName.trim(),
      timezone: data.timezone,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      zipCode: data.zipCode?.trim() || null,
      phone: data.phone?.trim() || null,
      createdAt: now,
    });
    
    // Update user document with new business
    const updatedBusinessIds = [...existingBusinessIds, businessId];
    batch.update(db.collection('users').doc(userId), {
      businessIds: updatedBusinessIds,
      businessId: existingBusinessIds.length === 0 ? businessId : userData.businessId, // Keep existing if present
      defaultBusinessId: existingBusinessIds.length === 0 ? businessId : userData.defaultBusinessId || existingBusinessIds[0],
    });
    
    // Commit the batch
    await batch.commit();
    
    // Fetch the created business
    const businessData = (await businessRef.get()).data()!;
    
    res.status(201).json({
      business: { ...businessData, id: businessId },
      message: 'Business created successfully',
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const validationErrors = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors 
      });
    }
    console.error('Create business error:', error);
    next(error);
  }
});

// Get all businesses for the authenticated user
authRouter.get('/businesses', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data()!;
    const businessIds = userData.businessIds || (userData.businessId ? [userData.businessId] : []);
    
    if (businessIds.length === 0) {
      return res.json({ businesses: [] });
    }
    
    // Load all businesses
    const businessPromises = businessIds.map((bid: string) => db.collection('businesses').doc(bid).get());
    const businessDocs = await Promise.all(businessPromises);
    const businesses = businessDocs
      .filter(doc => doc.exists)
      .map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ businesses });
  } catch (error) {
    next(error);
  }
});

// Add user to an existing business (requires OWNER role in target business)
authRouter.post('/businesses/:businessId/add-user', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const targetBusinessId = req.params.businessId;
    const { email, role = 'WORKER', firstName, lastName } = req.body;
    
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, first name, and last name are required' });
    }
    
    // Verify target business exists
    const businessDoc = await db.collection('businesses').doc(targetBusinessId).get();
    if (!businessDoc.exists) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Find user by email
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (userSnapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Check if user already belongs to this business
    const businessIds = userData.businessIds || (userData.businessId ? [userData.businessId] : []);
    if (businessIds.includes(targetBusinessId)) {
      return res.status(400).json({ error: 'User already belongs to this business' });
    }
    
    // Add business to user's businessIds array
    const updatedBusinessIds = [...businessIds, targetBusinessId];
    await db.collection('users').doc(userDoc.id).update({
      businessIds: updatedBusinessIds,
      // Update legacy businessId if it was the only one
      businessId: userData.businessId || targetBusinessId,
    });
    
    res.json({ 
      message: 'User added to business successfully',
      businessId: targetBusinessId,
    });
  } catch (error) {
    next(error);
  }
});
