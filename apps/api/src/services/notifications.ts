/**
 * Notification Service
 * Orchestrates sending emails and push notifications based on events
 */

import { sendEmail, getEmailFrom } from './email';
import { sendPushNotification } from './push';
import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

// Import all email templates
import * as emailTemplates from '../templates/email';
// Import all push templates
import * as pushTemplates from '../templates/push';

/**
 * Send notification (email + push) to a user
 */
export async function sendNotification(
  userId: string,
  options: {
    email?: {
      template: keyof typeof emailTemplates;
      data: any;
    };
    push?: {
      template: keyof typeof pushTemplates;
      data: any;
    };
  }
): Promise<void> {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    console.warn(`User ${userId} not found for notification`);
    return;
  }

  const userData = userDoc.data();
  const preferences = userData?.notificationPreferences || {};

  // Send email if enabled and template provided
  if (options.email && userData?.email && preferences.emailEnabled !== false) {
    const templateFn = emailTemplates[options.email.template];
    if (templateFn && typeof templateFn === 'function') {
      const html = templateFn({
        ...options.email.data,
        userName: userData.displayName,
        businessName: userData.businessId ? await getBusinessName(userData.businessId) : undefined,
        appUrl: process.env.APP_URL || 'https://app.tech-etime.com',
      });

      await sendEmail({
        to: userData.email,
        template: {
          subject: getEmailSubject(options.email.template),
          html,
        },
        from: getEmailFrom(),
      });
    }
  }

  // Send push if enabled and template provided
  if (options.push && preferences.pushEnabled !== false) {
    const templateFn = pushTemplates[options.push.template];
    if (templateFn && typeof templateFn === 'function') {
      const notification = templateFn(options.push.data);
      await sendPushNotification({
        userId,
        notification,
      });
    }
  }
}

/**
 * Get business name by ID
 */
async function getBusinessName(businessId: string): Promise<string | undefined> {
  const businessDoc = await db.collection('businesses').doc(businessId).get();
  return businessDoc.data()?.name;
}

/**
 * Get email subject based on template
 */
function getEmailSubject(template: string): string {
  const subjects: Record<string, string> = {
    workerWelcomeEmail: 'Welcome to Tech eTime!',
    workerPayStubEmail: 'Your Pay Stub is Ready',
    workerPayRateChangeEmail: 'Pay Rate Updated',
    managerNewStaffEmail: 'New Team Member Added',
    managerPayrollReadyEmail: 'Payroll Report Ready',
    managerAttendanceAlertEmail: 'Attendance Alert',
    ownerSetupCompleteEmail: 'Welcome to Tech eTime!',
    ownerLocationAddedEmail: 'New Location Added',
    ownerKioskProvisionedEmail: 'Kiosk Device Provisioned',
    clientAdminBusinessCreatedEmail: 'New Business Created',
    superAdminSystemAlertEmail: 'System Alert',
  };
  return subjects[template] || 'Notification from Tech eTime';
}

// ==================== WORKER NOTIFICATIONS ====================

export async function notifyWorkerWelcome(userId: string, data: { pin: string; payRate: number }): Promise<void> {
  await sendNotification(userId, {
    email: {
      template: 'workerWelcomeEmail',
      data: { pin: data.pin, payRate: data.payRate },
    },
  });
}

export async function notifyWorkerPayStub(userId: string, data: {
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  totalPay: number;
}): Promise<void> {
  await sendNotification(userId, {
    email: {
      template: 'workerPayStubEmail',
      data,
    },
    push: {
      template: 'workerPayStubReadyNotification',
      data: { periodStart: data.periodStart, periodEnd: data.periodEnd, totalPay: data.totalPay },
    },
  });
}

export async function notifyWorkerPayRateChange(userId: string, data: {
  previousRate: number;
  newRate: number;
  effectiveDate: string;
}): Promise<void> {
  await sendNotification(userId, {
    email: {
      template: 'workerPayRateChangeEmail',
      data,
    },
    push: {
      template: 'workerPayRateChangeNotification',
      data: { newRate: data.newRate, effectiveDate: data.effectiveDate },
    },
  });
}

// ==================== MANAGER NOTIFICATIONS ====================

export async function notifyManagerNewStaff(managerId: string, data: {
  staffName: string;
  staffRole: string;
  locationName: string;
}): Promise<void> {
  await sendNotification(managerId, {
    email: {
      template: 'managerNewStaffEmail',
      data,
    },
    push: {
      template: 'managerNewStaffNotification',
      data: { staffName: data.staffName, role: data.staffRole },
    },
  });
}

export async function notifyManagerPayrollReady(managerId: string, data: {
  periodStart: string;
  periodEnd: string;
  teamSize: number;
  totalHours: number;
  totalPay: number;
}): Promise<void> {
  await sendNotification(managerId, {
    email: {
      template: 'managerPayrollReadyEmail',
      data,
    },
    push: {
      template: 'managerPayrollReadyNotification',
      data: { periodStart: data.periodStart, periodEnd: data.periodEnd },
    },
  });
}

export async function notifyManagerAttendanceAlert(managerId: string, data: {
  teamMemberName: string;
  issue: string;
  details?: string;
}): Promise<void> {
  await sendNotification(managerId, {
    email: {
      template: 'managerAttendanceAlertEmail',
      data: {
        alertMessage: `Team member ${data.teamMemberName} has an attendance issue.`,
        ...data,
      },
    },
    push: {
      template: 'managerAttendanceAlertNotification',
      data,
    },
  });
}

// ==================== OWNER NOTIFICATIONS ====================

export async function notifyOwnerSetupComplete(ownerId: string, data: { businessName: string }): Promise<void> {
  await sendNotification(ownerId, {
    email: {
      template: 'ownerSetupCompleteEmail',
      data,
    },
  });
}

export async function notifyOwnerLocationAdded(ownerId: string, data: {
  locationName: string;
  timezone: string;
  businessName: string;
}): Promise<void> {
  await sendNotification(ownerId, {
    email: {
      template: 'ownerLocationAddedEmail',
      data,
    },
    push: {
      template: 'ownerLocationAddedNotification',
      data: { locationName: data.locationName },
    },
  });
}

export async function notifyOwnerKioskProvisioned(ownerId: string, data: {
  deviceName: string;
  deviceId: string;
  locationName: string;
}): Promise<void> {
  await sendNotification(ownerId, {
    email: {
      template: 'ownerKioskProvisionedEmail',
      data,
    },
    push: {
      template: 'ownerKioskProvisionedNotification',
      data: { deviceName: data.deviceName, locationName: data.locationName },
    },
  });
}

// ==================== CLIENT_ADMIN NOTIFICATIONS ====================

export async function notifyClientAdminBusinessCreated(clientAdminId: string, data: {
  businessName: string;
  businessId: string;
  ownerName: string;
  locationName: string;
}): Promise<void> {
  await sendNotification(clientAdminId, {
    email: {
      template: 'clientAdminBusinessCreatedEmail',
      data,
    },
    push: {
      template: 'clientAdminBusinessCreatedNotification',
      data: { businessName: data.businessName, ownerName: data.ownerName },
    },
  });
}

// ==================== SUPERADMIN NOTIFICATIONS ====================

export async function notifySuperAdminSystemAlert(superAdminId: string, data: {
  alertType: string;
  alertMessage: string;
  severity?: string;
  details?: string;
}): Promise<void> {
  await sendNotification(superAdminId, {
    email: {
      template: 'superAdminSystemAlertEmail',
      data,
    },
    push: {
      template: 'superAdminSystemAlertNotification',
      data: { alertType: data.alertType, message: data.alertMessage },
    },
  });
}
