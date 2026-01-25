import { z } from 'zod';

export const registerBusinessSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  ownerEmail: z.string().email('Invalid email address'),
  ownerPassword: z.string().min(8, 'Password must be at least 8 characters'),
  ownerFirstName: z.string().min(1, 'First name is required'),
  ownerLastName: z.string().min(1, 'Last name is required'),
});

export const createBusinessSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(100, 'Business name is too long'),
  timezone: z.string().default('America/New_York'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  address: z.string().optional(),
  timezone: z.string().default('America/New_York'),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createUserSchema = z.object({
  email: z.string().email().nullable(),
  password: z.string().min(8).optional(),
  role: z.enum(['OWNER', 'MANAGER', 'WORKER', 'SUPERADMIN']),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  workerId: z.string().optional(),
  phoneNumber: z.string().optional(),
  hourlyRate: z.number().positive().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().nullable().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  workerId: z.string().optional(),
  phoneNumber: z.string().optional(),
  role: z.enum(['OWNER', 'MANAGER', 'WORKER', 'SUPERADMIN']).optional(),
  isActive: z.boolean().optional(),
  hourlyRate: z.number().positive().optional(),
});

export const setPinSchema = z.object({
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d+$/, 'PIN must contain only digits'),
});

export const pinToggleSchema = z.object({
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d+$/, 'PIN must contain only digits'),
  locationId: z.string().optional(),
  notes: z.string().optional(),
});

export const clockInSchema = z.object({
  userId: z.string(),
  locationId: z.string(),
  notes: z.string().optional(),
});

export const clockOutSchema = z.object({
  userId: z.string(),
  notes: z.string().optional(),
});

export const payrollReportSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  userId: z.string().optional(),
  locationId: z.string().optional(),
});

export const enableKioskSchema = z.object({
  deviceName: z.string().min(1, 'Device name is required'),
  defaultLocationId: z.string().optional(),
});

export const kioskExitSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateTimeEntrySchema = z.object({
  clockInAt: z.string().datetime().optional(),
  clockOutAt: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
  locationId: z.string().optional(),
});
