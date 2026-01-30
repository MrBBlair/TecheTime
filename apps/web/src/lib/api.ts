/**
 * API Client Utilities
 */

// In development, Vite proxy handles /api routes (configured in vite.config.ts)
// In production, Vercel serverless functions handle /api routes
// Always use relative paths - works in both environments!
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  // Use relative path - Vite proxy (dev) or Vercel (prod) will handle it
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; displayName: string }) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  registerBusiness: (data: any) =>
    apiRequest('/api/auth/register-business', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin - Business
  getBusiness: () => apiRequest<{ id: string; name: string; address?: string; phone?: string }>('/api/admin/business'),
  updateBusiness: (data: { name?: string; address?: string; phone?: string }) =>
    apiRequest('/api/admin/business', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Admin - Locations
  getLocations: () => apiRequest<{ locations: any[] }>('/api/admin/locations'),
  createLocation: (data: any) =>
    apiRequest('/api/admin/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLocation: (id: string, data: any) =>
    apiRequest(`/api/admin/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteLocation: (id: string) =>
    apiRequest(`/api/admin/locations/${id}`, {
      method: 'DELETE',
    }),

  // Admin - Users
  getUsers: () => apiRequest<{ users: any[] }>('/api/admin/users'),
  createUser: (data: any) =>
    apiRequest('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: any) =>
    apiRequest(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    apiRequest(`/api/admin/users/${id}`, {
      method: 'DELETE',
    }),

  // Onboarding
  updateOnboardingStatus: (status: string) =>
    apiRequest('/api/admin/onboarding-status', {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  completeSetup: (data: any) =>
    apiRequest('/api/admin/complete-setup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Kiosk
  registerKiosk: (data: { businessId: string; locationId: string; deviceName: string }) =>
    apiRequest<{ deviceId: string; secret: string }>('/api/kiosk/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  kioskClockIn: (pin: string) => {
    const deviceId = localStorage.getItem('kiosk_device_id');
    const deviceSecret = localStorage.getItem('kiosk_secret');
    return apiRequest<{ timeEntryId: string; clockInAt: string }>('/api/kiosk/clock-in', {
      method: 'POST',
      body: JSON.stringify({ pin }),
      headers: {
        'X-Device-ID': deviceId || '',
        'X-Device-Secret': deviceSecret || '',
      },
    });
  },
  kioskClockOut: (pin: string) => {
    const deviceId = localStorage.getItem('kiosk_device_id');
    const deviceSecret = localStorage.getItem('kiosk_secret');
    return apiRequest<{ timeEntryId: string; clockOutAt: string }>('/api/kiosk/clock-out', {
      method: 'POST',
      body: JSON.stringify({ pin }),
      headers: {
        'X-Device-ID': deviceId || '',
        'X-Device-Secret': deviceSecret || '',
      },
    });
  },
  kioskVerifyAdmin: (pin: string) => {
    const deviceId = localStorage.getItem('kiosk_device_id');
    const deviceSecret = localStorage.getItem('kiosk_secret');
    return apiRequest<{ success: true; role: string; displayName: string }>('/api/kiosk/verify-admin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
      headers: {
        'X-Device-ID': deviceId || '',
        'X-Device-Secret': deviceSecret || '',
      },
    });
  },

  // Super Admin
  impersonate: (userId: string) =>
    apiRequest<{ customToken: string }>('/api/super/impersonate', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  getBusinesses: () =>
    apiRequest<{
      businesses: Array<{
        id: string;
        name?: string;
        locationCount: number;
        userCount: number;
        ownerId: string | null;
      }>;
    }>('/api/super/businesses'),

  // Payroll Reports
  getPayrollSummaries: (params: {
    startDate: string;
    endDate: string;
    userId?: string;
  }) => {
    const queryParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.userId && { userId: params.userId }),
    });
    return apiRequest<{
      summaries: Array<{
        id: string;
        userId: string;
        userName: string;
        businessId: string;
        locationId: string;
        date: string;
        totalHours: number;
        totalPay: number;
        regularHours?: number;
        overtimeHours?: number;
        doubleTimeHours?: number;
      }>;
    }>(`/api/admin/payroll-summaries?${queryParams}`);
  },
  getTimeEntries: (params: {
    startDate: string;
    endDate: string;
    userId?: string;
  }) => {
    const queryParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.userId && { userId: params.userId }),
    });
    return apiRequest<{
      entries: Array<{
        id: string;
        userId: string;
        userName: string;
        businessId: string;
        locationId: string;
        clockInAt: string;
        clockOutAt?: string;
        locationTimezone: string;
        calculatedPay?: number;
        calculatedHours?: number;
      }>;
    }>(`/api/admin/time-entries?${queryParams}`);
  },

  // Super Admin Login (UUID-based)
  adminLogin: (uuid: string) =>
    apiRequest<{
      customToken: string;
      user: { id: string; displayName?: string; email?: string; role: string };
    }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ uuid }),
    }),

  // User Profile
  getProfile: () => apiRequest<{ id: string; displayName?: string; email?: string; phoneNumber?: string; role: string; businessId?: string; locationId?: string; payRates?: any[] }>('/api/admin/profile'),
  updateProfile: (data: { displayName?: string; phoneNumber?: string }) =>
    apiRequest('/api/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Client Admin
  getClientAdminBusinesses: () =>
    apiRequest<{
      businesses: Array<{
        id: string;
        name: string;
        ownerId: string;
        clientAdminId?: string;
        locationCount: number;
        userCount: number;
        ownerName: string;
        createdAt?: string;
        updatedAt?: string;
      }>;
    }>('/api/client-admin/businesses'),
  createBusiness: (data: {
    name: string;
    ownerEmail: string;
    ownerDisplayName: string;
    ownerPassword: string;
    locationName: string;
    locationTimezone: string;
  }) =>
    apiRequest('/api/client-admin/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getClientAdminBusiness: (businessId: string) =>
      apiRequest(`/api/client-admin/businesses/${businessId}`),

    // Notifications
    registerFCMToken: (token: string) =>
      apiRequest('/api/notifications/fcm-token', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
    removeFCMToken: (token: string) =>
      apiRequest('/api/notifications/fcm-token', {
        method: 'DELETE',
        body: JSON.stringify({ token }),
      }),
    updateNotificationPreferences: (preferences: {
      pushEnabled?: boolean;
      emailEnabled?: boolean;
      pushTypes?: string[];
    }) =>
      apiRequest('/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      }),
    getNotificationPreferences: () =>
      apiRequest<{
        preferences: {
          pushEnabled: boolean;
          emailEnabled: boolean;
          pushTypes: string[];
        };
      }>('/api/notifications/preferences'),
};
