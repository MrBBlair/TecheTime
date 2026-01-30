/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';
import { UserRole } from '@shared/types';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: UserRole;
    businessId?: string;
  };
}

/**
 * requireAuth: Decodes Firebase token and attaches user to request
 */
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    // Fetch user document to get role and businessId
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const userData = userDoc.data();
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userData?.role as UserRole,
      businessId: userData?.businessId as string, // May be undefined for CLIENT_ADMIN
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

/**
 * requireSuperAdmin: Checks for SUPERADMIN role or specific UID
 */
export async function requireSuperAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const superAdminUid = process.env.SUPERADMIN_UID;
  const isSuperAdmin =
    req.user.role === 'SUPERADMIN' || req.user.uid === superAdminUid;

  if (!isSuperAdmin) {
    return res.status(403).json({ error: 'Forbidden: Super admin access required' });
  }

  next();
}

/**
 * requireKioskAuth: Validates X-Device-ID and X-Device-Secret headers
 */
export async function requireKioskAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const deviceId = req.headers['x-device-id'] as string;
    const deviceSecret = req.headers['x-device-secret'] as string;

    if (!deviceId || !deviceSecret) {
      return res.status(401).json({
        error: 'Unauthorized: Missing device credentials',
      });
    }

    const deviceDoc = await db.collection('deviceSessions').doc(deviceId).get();
    if (!deviceDoc.exists) {
      return res.status(401).json({ error: 'Unauthorized: Invalid device ID' });
    }

    const deviceData = deviceDoc.data();
    
    // Check if device is active
    if (!deviceData?.isActive) {
      return res.status(401).json({ error: 'Unauthorized: Device is not active' });
    }

    // Compare hashed secrets (we'll hash the provided secret and compare)
    const { hashSecret } = await import('../utils/crypto');
    const hash = hashSecret(deviceSecret);

    if (hash !== deviceData?.secret) {
      return res.status(401).json({ error: 'Unauthorized: Invalid device secret' });
    }

    // Update lastUsedAt
    await deviceDoc.ref.update({
      lastUsedAt: new Date().toISOString(),
    });

    // Attach device info to request
    (req as any).device = {
      id: deviceId,
      businessId: deviceData.businessId,
      locationId: deviceData.locationId,
    };

    next();
  } catch (error) {
    console.error('Kiosk auth error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid device credentials' });
  }
}
