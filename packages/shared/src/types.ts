export type UserRole = 'OWNER' | 'MANAGER' | 'WORKER' | 'SUPERADMIN';
export type SessionType = 'ADMIN' | 'KIOSK';

export interface Business {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  phone?: string | null;
  timezone?: string;
  createdAt: Date | string;
}

export interface User {
  id: string;
  businessId: string; // Legacy field - kept for backward compatibility, use businessIds[0] if present
  businessIds: string[]; // Array of business IDs user belongs to
  defaultBusinessId?: string; // Primary/default business ID
  email: string | null;
  role: UserRole;
  firstName: string;
  lastName: string;
  username?: string | null; // Optional username for profile
  avatarUrl?: string | null; // Optional avatar URL (base64 or storage URL)
  workerId?: string | null;
  phoneNumber?: string | null;
  pinHash: string | null;
  pinEnabled: boolean;
  isActive: boolean;
  createdAt: Date | string;
}

export interface Location {
  id: string;
  businessId: string;
  name: string;
  address: string | null;
  timezone: string;
  isActive: boolean;
}

export interface DeviceSession {
  id: string;
  businessId: string;
  userId: string | null;
  sessionType: SessionType;
  deviceName: string;
  defaultLocationId: string | null;
  createdAt: Date | string;
  lastSeenAt: Date | string;
  revokedAt: Date | string | null;
}

export interface TimeEntry {
  id: string;
  businessId: string;
  userId: string;
  locationId: string;
  clockInAt: Date | string;
  clockOutAt: Date | string | null;
  notes: string | null;
  createdAt: Date | string;
}

export interface PayRate {
  id: string;
  businessId: string;
  userId: string;
  hourlyRate: number; // stored as cents
  effectiveFrom: Date | string;
}
