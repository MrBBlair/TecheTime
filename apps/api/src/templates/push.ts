/**
 * Push Notification Templates
 * Notification templates for different situations and roles
 */

import { PushNotification } from '../services/push';

// ==================== WORKER PUSH NOTIFICATIONS ====================

export function workerPayStubReadyNotification(data: {
  periodStart: string;
  periodEnd: string;
  totalPay: number;
}): PushNotification {
  return {
    title: '💰 Pay Stub Ready',
    body: `Your pay stub for ${data.periodStart} to ${data.periodEnd} is ready. Total: $${(data.totalPay / 100).toFixed(2)}`,
    data: {
      type: 'pay_stub',
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    },
    clickAction: '/dashboard',
  };
}

export function workerClockReminderNotification(): PushNotification {
  return {
    title: '⏰ Don\'t Forget to Clock Out',
    body: 'You\'re still clocked in. Don\'t forget to clock out when you finish your shift.',
    data: {
      type: 'clock_reminder',
    },
    clickAction: '/kiosk',
  };
}

export function workerPayRateChangeNotification(data: {
  newRate: number;
  effectiveDate: string;
}): PushNotification {
  return {
    title: '📊 Pay Rate Updated',
    body: `Your pay rate has been updated to $${(data.newRate / 100).toFixed(2)}/hour effective ${data.effectiveDate}`,
    data: {
      type: 'pay_rate_change',
      effectiveDate: data.effectiveDate,
    },
    clickAction: '/profile',
  };
}

// ==================== MANAGER PUSH NOTIFICATIONS ====================

export function managerNewStaffNotification(data: {
  staffName: string;
  role: string;
}): PushNotification {
  return {
    title: '👤 New Team Member Added',
    body: `${data.staffName} (${data.role}) has been added to your team`,
    data: {
      type: 'new_staff',
      staffName: data.staffName,
    },
    clickAction: '/dashboard',
  };
}

export function managerTeamClockInNotification(data: {
  teamMemberName: string;
}): PushNotification {
  return {
    title: '🟢 Team Member Clocked In',
    body: `${data.teamMemberName} has clocked in`,
    data: {
      type: 'team_clock_in',
      teamMemberName: data.teamMemberName,
    },
    clickAction: '/dashboard',
  };
}

export function managerAttendanceAlertNotification(data: {
  teamMemberName: string;
  issue: string;
}): PushNotification {
  return {
    title: '⚠️ Attendance Alert',
    body: `${data.teamMemberName}: ${data.issue}`,
    data: {
      type: 'attendance_alert',
      teamMemberName: data.teamMemberName,
    },
    clickAction: '/dashboard',
    priority: 'high',
  };
}

export function managerPayrollReadyNotification(data: {
  periodStart: string;
  periodEnd: string;
}): PushNotification {
  return {
    title: '📋 Payroll Report Ready',
    body: `Payroll report for ${data.periodStart} to ${data.periodEnd} is ready`,
    data: {
      type: 'payroll_ready',
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    },
    clickAction: '/payroll-reports',
  };
}

// ==================== OWNER PUSH NOTIFICATIONS ====================

export function ownerLocationAddedNotification(data: {
  locationName: string;
}): PushNotification {
  return {
    title: '📍 New Location Added',
    body: `Location "${data.locationName}" has been added to your business`,
    data: {
      type: 'location_added',
      locationName: data.locationName,
    },
    clickAction: '/settings',
  };
}

export function ownerStaffChangeNotification(data: {
  action: string;
  staffName: string;
}): PushNotification {
  return {
    title: `👥 Staff ${data.action}`,
    body: `${data.staffName} has been ${data.action.toLowerCase()}`,
    data: {
      type: 'staff_change',
      action: data.action,
      staffName: data.staffName,
    },
    clickAction: '/dashboard',
  };
}

export function ownerKioskProvisionedNotification(data: {
  deviceName: string;
  locationName: string;
}): PushNotification {
  return {
    title: '📱 Kiosk Device Ready',
    body: `Kiosk "${data.deviceName}" at ${data.locationName} is ready to use`,
    data: {
      type: 'kiosk_provisioned',
      deviceName: data.deviceName,
    },
    clickAction: '/dashboard',
  };
}

// ==================== CLIENT_ADMIN PUSH NOTIFICATIONS ====================

export function clientAdminBusinessCreatedNotification(data: {
  businessName: string;
  ownerName: string;
}): PushNotification {
  return {
    title: '🏢 New Business Created',
    body: `Business "${data.businessName}" with owner ${data.ownerName} has been created`,
    data: {
      type: 'business_created',
      businessName: data.businessName,
    },
    clickAction: '/dashboard',
  };
}

// ==================== SUPERADMIN PUSH NOTIFICATIONS ====================

export function superAdminSystemAlertNotification(data: {
  alertType: string;
  message: string;
}): PushNotification {
  return {
    title: `🚨 System Alert: ${data.alertType}`,
    body: data.message,
    data: {
      type: 'system_alert',
      alertType: data.alertType,
    },
    clickAction: '/super-admin',
    priority: 'high',
  };
}
