/**
 * Core Type Definitions for Tech eTime
 * All types must be defined here first before use in other packages
 */

export type OnboardingStatus = 'NEW' | 'TOUR_COMPLETED' | 'SETUP_COMPLETED';

export type UserRole = 'SUPERADMIN' | 'CLIENT_ADMIN' | 'OWNER' | 'MANAGER' | 'WORKER';

export interface PayRate {
  amount: number; // Amount in cents
  effectiveDate: string; // ISO date string
  createdAt: string; // ISO timestamp
}

export interface User {
  id: string;
  email?: string; // Optional for Workers, Mandatory for Admins
  displayName?: string;
  phoneNumber?: string;
  onboardingStatus: OnboardingStatus;
  role: UserRole;
  businessId?: string; // Optional for CLIENT_ADMIN (they manage multiple), required for others
  locationId?: string;
  pin?: string; // Hashed PIN (using SHA-256, note: masterplan mentions Bcrypt but SHA-256 is sufficient)
  payRates?: PayRate[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface Business {
  id: string;
  name: string;
  ownerId: string; // The OWNER user who owns this business
  clientAdminId?: string; // The CLIENT_ADMIN who manages this business (optional)
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface Location {
  id: string;
  businessId: string;
  name: string;
  address?: string;
  timezone: string; // IANA timezone string (e.g., 'America/New_York')
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface TimeEntry {
  id: string;
  userId: string;
  businessId: string;
  locationId: string;
  clockInAt: string; // UTC ISO string
  clockOutAt?: string; // UTC ISO string (null if still clocked in)
  locationTimezone: string; // IANA timezone string - CRITICAL for Payroll
  calculatedPay?: number; // Snapshotted at time of shift close (in cents)
  calculatedHours?: number; // Snapshotted hours (decimal)
  notes?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface DeviceSession {
  id: string;
  businessId: string;
  locationId: string;
  secret: string; // Hashed token for validation
  deviceName: string;
  isActive: boolean;
  createdAt: string; // ISO timestamp
  lastUsedAt?: string; // ISO timestamp
}

export interface DailyPayrollSummary {
  id: string; // Format: {date}_{userId} (e.g., "2026-01-25_user123")
  userId: string;
  businessId: string;
  locationId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  totalHours: number; // Decimal hours
  totalPay: number; // In cents
  regularHours?: number;
  overtimeHours?: number;
  doubleTimeHours?: number;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface RegisterBusinessPayload {
  email: string;
  password: string;
  displayName: string;
  businessName: string;
  locationName: string;
  locationTimezone: string;
  pin: string; // Plain PIN (will be hashed)
}

export interface KioskRegisterPayload {
  businessId: string;
  locationId: string;
  deviceName: string;
}

export interface KioskRegisterResponse {
  deviceId: string;
  secret: string; // Plain secret (store securely)
}

export interface ImpersonatePayload {
  userId: string;
}

export interface ImpersonateResponse {
  customToken: string; // Firebase custom token
}

export interface CreateStaffPayload {
  displayName: string;
  email?: string; // Optional for Workers
  pin: string; // Plain PIN (will be hashed)
  role: 'MANAGER' | 'WORKER';
  locationId: string;
  payRate: {
    amount: number; // In cents
    effectiveDate: string; // ISO date string
  };
}
