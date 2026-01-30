/**
 * Push Notification Service
 * Handles sending push notifications via Firebase Cloud Messaging (FCM)
 */

import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
  priority?: 'normal' | 'high';
}

export interface PushOptions {
  userId: string;
  notification: PushNotification;
  priority?: 'normal' | 'high';
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(options: PushOptions): Promise<void> {
  try {
    // Get user's FCM tokens
    const userDoc = await db.collection('users').doc(options.userId).get();
    if (!userDoc.exists) {
      console.warn(`User ${options.userId} not found for push notification`);
      return;
    }

    const userData = userDoc.data();
    const fcmTokens = userData?.fcmTokens || [];

    if (fcmTokens.length === 0) {
      console.log(`No FCM tokens found for user ${options.userId}`);
      return;
    }

    // Check if user has push notifications enabled
    const notificationPreferences = userData?.notificationPreferences || {};
    if (notificationPreferences.pushEnabled === false) {
      console.log(`Push notifications disabled for user ${options.userId}`);
      return;
    }

    // Send to all user's devices
    const messages = fcmTokens.map((token: string) => ({
      token,
      notification: {
        title: options.notification.title,
        body: options.notification.body,
        ...(options.notification.imageUrl && { imageUrl: options.notification.imageUrl }),
      },
      data: {
        ...options.notification.data,
        clickAction: options.notification.clickAction || '',
      },
      android: {
        priority: options.priority === 'high' ? 'high' : 'normal',
      },
      apns: {
        headers: {
          'apns-priority': options.priority === 'high' ? '10' : '5',
        },
      },
      webpush: {
        notification: {
          title: options.notification.title,
          body: options.notification.body,
          icon: '/Logo1.png',
          badge: '/Logo1.png',
          ...(options.notification.imageUrl && { image: options.notification.imageUrl }),
        },
      },
    }));

    // Send messages in batches
    const batchSize = 500; // FCM batch limit
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const response = await admin.messaging().sendEach(batch);
      
      // Remove invalid tokens
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = (resp.error as any)?.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(batch[idx].token);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await removeFCMTokens(options.userId, invalidTokens);
      }
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  notification: PushNotification,
  priority: 'normal' | 'high' = 'normal'
): Promise<void> {
  await Promise.all(
    userIds.map((userId) =>
      sendPushNotification({ userId, notification, priority })
    )
  );
}

/**
 * Register FCM token for a user
 */
export async function registerFCMToken(userId: string, token: string): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();
  const existingTokens = userData?.fcmTokens || [];

  // Add token if not already present
  if (!existingTokens.includes(token)) {
    await userRef.update({
      fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Remove FCM tokens for a user
 */
export async function removeFCMTokens(userId: string, tokens: string[]): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  await userRef.update({
    fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokens),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    pushEnabled?: boolean;
    emailEnabled?: boolean;
    pushTypes?: string[];
  }
): Promise<void> {
  await db.collection('users').doc(userId).update({
    notificationPreferences: preferences,
    updatedAt: new Date().toISOString(),
  });
}
