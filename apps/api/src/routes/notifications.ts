/**
 * Notification Routes
 * API endpoints for managing notification preferences and FCM tokens
 */

import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { registerFCMToken, removeFCMTokens, updateNotificationPreferences } from '../services/push';
import { db } from '../config/firebase';

const router = Router();

// All notification routes require authentication
router.use(requireAuth);

/**
 * POST /api/notifications/fcm-token
 * Register FCM token for push notifications
 */
router.post('/fcm-token', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    await registerFCMToken(req.user.uid, token);

    res.json({ message: 'FCM token registered successfully' });
  } catch (error) {
    console.error('Register FCM token error:', error);
    res.status(500).json({ error: 'Failed to register FCM token' });
  }
});

/**
 * DELETE /api/notifications/fcm-token
 * Remove FCM token (e.g., on logout)
 */
router.delete('/fcm-token', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    await removeFCMTokens(req.user.uid, [token]);

    res.json({ message: 'FCM token removed successfully' });
  } catch (error) {
    console.error('Remove FCM token error:', error);
    res.status(500).json({ error: 'Failed to remove FCM token' });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 */
router.put('/preferences', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { pushEnabled, emailEnabled, pushTypes } = req.body;

    const preferences: any = {};
    if (typeof pushEnabled === 'boolean') {
      preferences.pushEnabled = pushEnabled;
    }
    if (typeof emailEnabled === 'boolean') {
      preferences.emailEnabled = emailEnabled;
    }
    if (Array.isArray(pushTypes)) {
      preferences.pushTypes = pushTypes;
    }

    await updateNotificationPreferences(req.user.uid, preferences);

    res.json({ message: 'Notification preferences updated successfully' });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

/**
 * GET /api/notifications/preferences
 * Get current notification preferences
 */
router.get('/preferences', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const preferences = userDoc.data()?.notificationPreferences || {
      pushEnabled: true,
      emailEnabled: true,
      pushTypes: [],
    };

    res.json({ preferences });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ error: 'Failed to get notification preferences' });
  }
});

export default router;
