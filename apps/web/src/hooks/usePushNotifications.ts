/**
 * Push Notifications Hook
 * Handles FCM token registration and notification permissions
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';
import { getFirebaseConfig } from '../config/firebase';

let messagingInstance: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') return null; // SSR check
  
  if (!messagingInstance) {
    try {
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(getFirebaseConfig());
      messagingInstance = getMessaging(app);
    } catch (error) {
      console.warn('Firebase Messaging not available:', error);
      return null;
    }
  }
  
  return messagingInstance;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    // Request permission and get token
    async function requestPermissionAndToken() {
      if (!user) return;

      const messaging = getMessagingInstance();
      if (!messaging) return;

      try {
        // Request notification permission
        const permission = await Notification.requestPermission();
        setPermission(permission);

        if (permission === 'granted') {
          // Get FCM token
          const currentToken = await getToken(messaging, {
            vapidKey: process.env.VITE_FIREBASE_VAPID_KEY || '',
          });

          if (currentToken) {
            setToken(currentToken);
            // Register token with backend
            try {
              await api.registerFCMToken(currentToken);
            } catch (error) {
              console.error('Failed to register FCM token:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }

    requestPermissionAndToken();

    // Listen for foreground messages
    const messaging = getMessagingInstance();
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        // Show browser notification
        if (permission === 'granted') {
          new Notification(payload.notification?.title || 'Notification', {
            body: payload.notification?.body,
            icon: '/Logo1.png',
            badge: '/Logo1.png',
            tag: payload.data?.type,
            data: payload.data,
          });
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user, permission]);

  const requestPermission = async () => {
    if (!isSupported) return false;
    
    const messaging = getMessagingInstance();
    if (!messaging) return false;

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        const currentToken = await getToken(messaging, {
          vapidKey: process.env.VITE_FIREBASE_VAPID_KEY || '',
        });

        if (currentToken) {
          setToken(currentToken);
          await api.registerFCMToken(currentToken);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  return {
    token,
    permission,
    isSupported,
    requestPermission,
  };
}
