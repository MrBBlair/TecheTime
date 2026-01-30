/**
 * Zod Schemas for API Validation
 * These schemas are used for both frontend and backend validation
 */

import { z } from 'zod';

export const onboardingStatusSchema = z.enum(['NEW', 'TOUR_COMPLETED', 'SETUP_COMPLETED']);

export const userRoleSchema = z.enum(['SUPERADMIN', 'CLIENT_ADMIN', 'OWNER', 'MANAGER', 'WORKER']);

export const payRateSchema = z.object({
  amount: z.number().int().positive(), // Amount in cents
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  createdAt: z.string().datetime(),
});

export const registerBusinessSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
  businessName: z.string().min(1).max(200),
  locationName: z.string().min(1).max(200),
  locationTimezone: z.string().min(1), // IANA timezone validation should be done server-side
  pin: z.string().regex(/^\d{4,8}$/, 'PIN must be 4-8 digits'),
});

export const kioskRegisterSchema = z.object({
  businessId: z.string().min(1),
  locationId: z.string().min(1),
  deviceName: z.string().min(1).max(100),
});

export const impersonateSchema = z.object({
  userId: z.string().min(1),
});

export const timeEntryClockInSchema = z.object({
  pin: z.string().regex(/^\d{4,8}$/),
  locationId: z.string().min(1).optional(), // Optional if using device session
});

export const timeEntryClockOutSchema = z.object({
  timeEntryId: z.string().min(1),
});

export const createStaffSchema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  pin: z.string().regex(/^\d{4,8}$/, 'PIN must be 4-8 digits'),
  role: z.enum(['MANAGER', 'WORKER']),
  locationId: z.string().min(1),
  payRate: z.object({
    amount: z.number().int().positive(),
    effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});
