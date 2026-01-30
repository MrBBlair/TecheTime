/**
 * KioskGuard: Checks localStorage for kiosk_secret
 * Ensures only provisioned devices can access the kiosk route
 */

import { Navigate } from 'react-router-dom';

export function KioskGuard({ children }: { children: React.ReactNode }) {
  const kioskSecret = localStorage.getItem('kiosk_secret');
  const deviceId = localStorage.getItem('kiosk_device_id');

  if (!kioskSecret || !deviceId) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
