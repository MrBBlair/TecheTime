import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../firebase/admin.js';

export interface AuthRequest extends Request {
  userId?: string;
  businessId?: string;
  userBusinessIds?: string[]; // All businesses user belongs to
  userRole?: string;
  deviceSession?: any;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Log token verification attempt for debugging
    console.log('[Auth Middleware] Verifying token...');
    const decodedToken = await auth.verifyIdToken(token);
    console.log('[Auth Middleware] Token verified successfully, userId:', decodedToken.uid);
    const userId = decodedToken.uid;

    console.log('[Auth Middleware] Fetching user document from Firestore...');
    let userDoc;
    try {
      userDoc = await db.collection('users').doc(userId).get();
    } catch (firestoreError: any) {
      console.error('[Auth Middleware] Firestore read error:', {
        error: firestoreError.message,
        code: firestoreError.code,
        userId
      });
      throw firestoreError;
    }
    
    if (!userDoc.exists) {
      console.warn('[Auth Middleware] User document not found for userId:', userId);
      return res.status(401).json({ error: 'User not found' });
    }
    
    console.log('[Auth Middleware] User document retrieved successfully');

    const userData = userDoc.data()!;
    if (!userData.isActive) {
      return res.status(401).json({ error: 'User is inactive' });
    }

    // Support both old (businessId) and new (businessIds) formats for backward compatibility
    const businessIds = userData.businessIds || (userData.businessId ? [userData.businessId] : []);
    req.userBusinessIds = businessIds;

    // Get requested business ID from header, query param, or use default
    const requestedBusinessId = 
      (req.headers['x-business-id'] as string) ||
      (req.query.businessId as string) ||
      userData.defaultBusinessId ||
      businessIds[0] ||
      userData.businessId;

    // SUPERADMIN bypasses business access checks
    const isSuperAdmin = userData.role === 'SUPERADMIN';
    
    req.userId = userId;
    req.userRole = userData.role;
    
    // For SUPERADMIN, allow access to any business or no business
    if (isSuperAdmin) {
      // SUPERADMIN can access any business, use requestedBusinessId if provided
      req.businessId = requestedBusinessId || undefined;
      return next();
    }
    
    // For regular users, validate business access
    if (requestedBusinessId) {
      if (businessIds.length === 0) {
        // User has no businesses - this shouldn't happen but handle gracefully
        console.warn('[Auth Middleware] User has no businesses but requested business:', requestedBusinessId);
        return res.status(403).json({ 
          error: 'No business access',
          message: 'User does not belong to any business'
        });
      }
      if (!businessIds.includes(requestedBusinessId)) {
        console.warn('[Auth Middleware] User does not have access to requested business:', {
          userId,
          requestedBusinessId,
          userBusinessIds: businessIds
        });
        return res.status(403).json({ 
          error: 'Access denied to this business',
          message: 'You do not have access to the requested business'
        });
      }
      req.businessId = requestedBusinessId;
      console.log('[Auth Middleware] Business ID set:', requestedBusinessId);
    } else if (businessIds.length > 0) {
      // No business specified but user has businesses - use first one
      req.businessId = businessIds[0];
      console.log('[Auth Middleware] Business ID set from user businesses:', businessIds[0]);
    } else {
      // No business specified and user has no businesses
      console.warn('[Auth Middleware] User has no businesses assigned:', {
        userId,
        userData: { businessId: userData.businessId, businessIds: userData.businessIds }
      });
      return res.status(403).json({ 
        error: 'No business access',
        message: 'User does not belong to any business'
      });
    }

    next();
  } catch (error: any) {
    console.error('[Auth Middleware] Token verification failed:', {
      error: error.message,
      code: error.code,
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    
    // Provide more specific error messages
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid token format' });
    } else if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    } else if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Token revoked' });
    } else if (error.message?.includes('project')) {
      return res.status(401).json({ 
        error: 'Token project mismatch',
        message: 'Token was issued for a different Firebase project. Check FIREBASE_PROJECT_ID matches frontend config.'
      });
    }
    
    return res.status(401).json({ error: 'Invalid token', details: error.message });
  }
}

export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  await requireAuth(req, res, () => {
    if (req.userRole !== 'OWNER' && req.userRole !== 'MANAGER' && req.userRole !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  });
}

export async function requireDeviceSession(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const sessionId = req.headers['x-device-session-id'] as string;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Device session required' });
  }

  try {
    // Try collectionGroup query first (requires index)
    let sessions;
    try {
      sessions = await db
        .collectionGroup('deviceSessions')
        .where('__name__', '==', sessionId)
        .get();
    } catch (collectionGroupError: any) {
      // If collectionGroup fails (likely missing index), try optimized alternative
      console.warn('CollectionGroup query failed, trying alternative:', collectionGroupError.message);
      console.warn('⚠️  IMPORTANT: Create collectionGroup index for deviceSessions.__name__ to improve performance');
      
      // Optimized alternative: Use Promise.all to check businesses in parallel
      // This is faster than sequential checks but still requires the index for optimal performance
      const businessesSnapshot = await db.collection('businesses').get();
      
      // Check all businesses in parallel for better performance
      const sessionChecks = businessesSnapshot.docs.map(async (businessDoc) => {
        const sessionDoc = await businessDoc.ref
          .collection('deviceSessions')
          .doc(sessionId)
          .get();
        
        if (sessionDoc.exists) {
          return {
            session: sessionDoc.data(),
            ref: sessionDoc.ref,
          };
        }
        return null;
      });
      
      const results = await Promise.all(sessionChecks);
      const found = results.find((r) => r !== null);
      
      if (!found || !found.session) {
        return res.status(401).json({ error: 'Invalid device session' });
      }
      
      if (found.session.revokedAt) {
        return res.status(401).json({ error: 'Device session revoked' });
      }

      req.businessId = found.session.businessId;
      req.deviceSession = found.session;

      // Update last seen
      await found.ref.update({ lastSeenAt: new Date() });

      return next();
    }

    if (sessions.empty) {
      return res.status(401).json({ error: 'Invalid device session' });
    }

    const session = sessions.docs[0].data();
    if (session.revokedAt) {
      return res.status(401).json({ error: 'Device session revoked' });
    }

    req.businessId = session.businessId;
    req.deviceSession = session;

    // Update last seen
    await sessions.docs[0].ref.update({ lastSeenAt: new Date() });

    next();
  } catch (error) {
    console.error('Device session error:', error);
    return res.status(401).json({ error: 'Invalid device session' });
  }
}
