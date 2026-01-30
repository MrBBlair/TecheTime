/**
 * Email Templates
 * HTML email templates for different situations and roles
 */

export interface EmailTemplateData {
  userName?: string;
  businessName?: string;
  [key: string]: any;
}

/**
 * Base email template wrapper
 */
function baseTemplate(content: string, data?: EmailTemplateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tech eTime</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #7c3aed; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Tech eTime</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; color: #666666; font-size: 12px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Tech eTime. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ==================== WORKER EMAIL TEMPLATES ====================

export function workerWelcomeEmail(data: EmailTemplateData): string {
  return baseTemplate(`
    <h2 style="color: #333333; margin-top: 0;">Welcome to Tech eTime, ${data.userName || 'there'}!</h2>
    <p style="color: #666666; line-height: 1.6;">
      Your account has been created and you're ready to start tracking your time.
    </p>
    <p style="color: #666666; line-height: 1.6;">
      <strong>Your PIN:</strong> ${data.pin || 'Set in app'}<br>
      <strong>Pay Rate:</strong> $${((data.payRate || 0) / 100).toFixed(2)}/hour
    </p>
    <p style="color: #666666; line-height: 1.6;">
      You can clock in and out using your PIN at any kiosk device or through the mobile app.
    </p>
    <div style="margin: 30px 0; text-align: center;">
      <a href="${data.appUrl || 'https://app.tech-etime.com'}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">Access Your Dashboard</a>
    </div>
  `, data);
}

export function workerPayStubEmail(data: EmailTemplateData): string {
  return baseTemplate(`
    <h2 style="color: #333333; margin-top: 0;">Your Pay Stub is Ready</h2>
    <p style="color: #666666; line-height: 1.6;">
      Hi ${data.userName || 'there'},
    </p>
    <p style="color: #666666; line-height: 1.6;">
      Your pay stub for the period <strong>${data.periodStart}</strong> to <strong>${data.periodEnd}</strong> is now available.
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0;"><strong>Total Hours:</strong></td>
          <td style="text-align: right; padding: 8px 0;">${data.totalHours?.toFixed(2) || '0.00'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Total Pay:</strong></td>
          <td style="text-align: right; padding: 8px 0; font-size: 18px; color: #7c3aed; font-weight: 600;">$${((data.totalPay || 0) / 100).toFixed(2)}</td>
        </tr>
      </table>
    </div>
    <div style="margin: 30px 0; text-align: center;">
      <a href="${data.appUrl || 'https://app.tech-etime.com'}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">View Pay Stub</a>
    </div>
  `, data);
}

export function workerPayRateChangeEmail(data: EmailTemplateData): string {
  return baseTemplate(`
    <h2 style="color: #333333; margin-top: 0;">Pay Rate Updated</h2>
    <p style="color: #666666; line-height: 1.6;">
      Hi ${data.userName || 'there'},
    </p>
    <p style="color: #666666; line-height: 1.6;">
      Your pay rate has been updated effective <strong>${data.effectiveDate}</strong>.
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0;"><strong>Previous Rate:</strong></td>
          <td style="text-align: right; padding: 8px 0;">$${((data.previousRate || 0) / 100).toFixed(2)}/hour</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>New Rate:</strong></td>
          <td style="text-align: right; padding: 8px 0; font-size: 18px; color: #7c3aed; font-weight: 600;">$${((data.newRate || 0) / 100).toFixed(2)}/hour</td>
        </tr>
      </table>
    </div>
  `, data);
}

// ==================== MANAGER EMAIL TEMPLATES ====================

export function managerNewStaffEmail(data: EmailTemplateData): string {
  return baseTemplate(`
    <h2 style="color: #333333; margin-top: 0;">New Team Member Added</h2>
    <p style="color: #666666; line-height: 1.6;">
      Hi ${data.userName || 'Manager'},
    </p>
    <p style="color: #666666; line-height: 1.6;">
      A new team member has been added to your team:
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Name:</strong> ${data.staffName}</p>
      <p style="margin: 8px 0 0 0;"><strong>Role:</strong> ${data.staffRole}</p>
      <p style="margin: 8px 0 0 0;"><strong>Location:</strong> ${data.locationName}</p>
    </div>
    <div style="margin: 30px 0; text-align: center;">
      <a href="${data.appUrl || 'https://app.tech-etime.com'}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">View Team</a>
    </div>
  `, data);
}

export function managerPayrollReadyEmail(data: EmailTemplateData): string {
  return baseTemplate(`
    <h2 style="color: #333333; margin-top: 0;">Payroll Report Ready</h2>
    <p style="color: #666666; line-height: 1.6;">
      Hi ${data.userName || 'Manager'},
    </p>
    <p style="color: #666666; line-height: 1.6;">
      Your payroll report for <strong>${data.periodStart}</strong> to <strong>${data.periodEnd}</strong> is ready for review.
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0;"><strong>Team Members:</strong></td>
          <td style="text-align: right; padding: 8px 0;">${data.teamSize || 0}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Total Hours:</strong></td>
          <td style="text-align: right; padding: 8px 0;">${data.totalHours?.toFixed(2) || '0.00'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Total Payroll:</strong></td>
          <td style="text-align: right; padding: 8px 0; font-size: 18px; color: #7c3aed; font-weight: 600;">$${((data.totalPay || 0) / 100).toFixed(2)}</td>
        </tr>
      </table>
    </div>
    <div style="margin: 30px 0; text-align: center;">
      <a href="${data.appUrl || 'https://app.tech-etime.com'}/payroll-reports" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">View Report</a>
    </div>
  `, data);
}

export function managerAttendanceAlertEmail(data: EmailTemplateData): string {
  return baseTemplate(`
    <h2 style="color: #d97706; margin-top: 0;">⚠️ Attendance Alert</h2>
    <p style="color: #666666; line-height: 1.6;">
      Hi ${data.userName || 'Manager'},
    </p>
    <p style="color: #666666; line-height: 1.6;">
      ${data.alertMessage || 'There is an attendance issue that requires your attention.'}
    </p>
    <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #d97706;">
      <p style="margin: 0;"><strong>Team Member:</strong> ${data.teamMemberName}</p>
      <p style="margin: 8px 0 0 0;"><strong>Issue:</strong> ${data.issue}</p>
      ${data.details ? `<p style="margin: 8px 0 0 0;"><strong>Details:</strong> ${data.details}</p>` : ''}
    </div>
    <div style="margin: 30px 0; text-align: center;">
      <a href="${data.appUrl || 'https://app.tech-etime.com'}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">View Dashboard</a>
    </div>
  `, data);
}

// ==================== OWNER EMAIL TEMPLATES ====================

export function ownerSetupCompleteEmail(data: EmailTemplateData): string {
  return baseTemplate(`
    <h2 style="color: #333333; margin-top: 0;">🎉 Welcome to Tech eTime!</h2>
    <p style="color: #666666; line-height: 1.6;">
      Hi ${data.userName || 'there'},
    </p>
    <p style="color: #666666; line-height: 1.6;">
      Your business <strong>${data.businessName}</strong> has been successfully set up!
    </p>
    <p style="color: #666666; line-height: 1.6;">
      You can now start managing your team, locations, and payroll.
    </p>
    <div style="margin: 30px 0; text-align: center;">
      <a href="${data.appUrl || 'https://app.tech-etime.com'}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to Dashboard</a>
    </div>
  `, data);
}

export function ownerLocationAddedEmail(data: EmailTemplateData): string {
  return baseTemplate(`
    <h2 style="color: #333333; margin-top: 0;">New Location Added</h2>
    <p style="color: #666666; line-height: 1.6;">
      Hi ${data.userName || 'Owner'},
    </p>
    <p style="color: #666666; line-height: 1.6;">
      A new location has been added to <strong>${data.businessName}</strong>:
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Location:</strong> ${data.locationName}</p>
      <p style="margin: 8px 0 0 0;"><strong>Timezone:</strong> ${data.timezone}</p>
    </div>
    <div style="margin: 30px 0; text-align: center;">
      <a href="${data.appUrl || 'https://app.tech-etime.com'}/settings" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">Manage Locations</a>
    </div>
  `, data);
}

export function ownerKioskProvisionedEmail(data: EmailTemplateData): string {
  return baseTemplate(`
    <h2 style="color: #333333; margin-top: 0;">Kiosk Device Provisioned</h2>
    <p style="color: #666666; line-height: 1.6;">
      Hi ${data.userName || 'Owner'},
    </p>
    <p style="color: #666666; line-height: 1.6;">
      A new kiosk device has been provisioned:
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Device Name:</strong> ${data.deviceName}</p>
      <p style="margin: 8px 0 0 0;"><strong>Location:</strong> ${data.locationName}</p>
      <p style="margin: 8px 0 0 0;"><strong>Device ID:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px;">${data.deviceId}</code></p>
    </div>
    <p style="color: #666666; line-height: 1.6;">
      The device is now ready for your team to clock in and out.
    </p>
  `, data);
}

// ==================== CLIENT_ADMIN EMAIL TEMPLATES ====================

export function clientAdminBusinessCreatedEmail(data: EmailTemplateData): string {
  return baseTemplate(`
    <h2 style="color: #333333; margin-top: 0;">New Business Created</h2>
    <p style="color: #666666; line-height: 1.6;">
      Hi ${data.userName || 'Client Admin'},
    </p>
    <p style="color: #666666; line-height: 1.6;">
      A new business has been created under your management:
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Business:</strong> ${data.businessName}</p>
      <p style="margin: 8px 0 0 0;"><strong>Owner:</strong> ${data.ownerName}</p>
      <p style="margin: 8px 0 0 0;"><strong>Location:</strong> ${data.locationName}</p>
    </div>
    <div style="margin: 30px 0; text-align: center;">
      <a href="${data.appUrl || 'https://app.tech-etime.com'}/business/${data.businessId}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">View Business</a>
    </div>
  `, data);
}

// ==================== SUPERADMIN EMAIL TEMPLATES ====================

export function superAdminSystemAlertEmail(data: EmailTemplateData): string {
  return baseTemplate(`
    <h2 style="color: #dc2626; margin-top: 0;">🚨 System Alert</h2>
    <p style="color: #666666; line-height: 1.6;">
      ${data.alertMessage || 'A system alert requires your attention.'}
    </p>
    <div style="background-color: #fee2e2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <p style="margin: 0;"><strong>Alert Type:</strong> ${data.alertType}</p>
      <p style="margin: 8px 0 0 0;"><strong>Severity:</strong> ${data.severity || 'Medium'}</p>
      ${data.details ? `<p style="margin: 8px 0 0 0;"><strong>Details:</strong> ${data.details}</p>` : ''}
    </div>
  `, data);
}
