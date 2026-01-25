/**
 * Email Templates for Tech eTime
 * 
 * This file contains HTML and text templates for all email situations
 * in the Tech eTime application.
 */

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

/**
 * Base HTML template wrapper
 */
function getBaseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tech eTime</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Tech eTime</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666666;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Tech eTime. All rights reserved.</p>
              <p style="margin: 5px 0 0;">This is an automated message. Please do not reply to this email.</p>
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

/**
 * Welcome Email - Sent when a business is created
 */
export function getWelcomeEmailTemplate(businessName: string, ownerName: string): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Welcome to Tech eTime!</h2>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Hi ${ownerName},
    </p>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Your business <strong style="color: #667eea;">${businessName}</strong> has been successfully created!
    </p>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      You can now start managing your workforce time clock and payroll with ease.
    </p>
    <div style="margin: 30px 0; padding: 20px; background-color: #f0f4ff; border-left: 4px solid #667eea; border-radius: 4px;">
      <p style="margin: 0; color: #333333; font-size: 14px; font-weight: 600;">Next Steps:</p>
      <ul style="margin: 10px 0 0; padding-left: 20px; color: #555555; font-size: 14px;">
        <li>Add locations for your business</li>
        <li>Invite workers and managers</li>
        <li>Set up pay rates</li>
        <li>Configure your time clock</li>
      </ul>
    </div>
    <p style="margin: 20px 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
      Thank you for choosing Tech eTime!
    </p>
  `;

  return {
    subject: `Welcome to Tech eTime - ${businessName}`,
    htmlBody: getBaseTemplate(content),
    textBody: `Welcome to Tech eTime!\n\nHi ${ownerName},\n\nYour business ${businessName} has been successfully created. You can now start managing your workforce time clock and payroll.\n\nNext Steps:\n- Add locations for your business\n- Invite workers and managers\n- Set up pay rates\n- Configure your time clock\n\nThank you for choosing Tech eTime!`,
  };
}

/**
 * User Invited Email - Sent when a user is invited to join a business
 */
export function getUserInvitedEmailTemplate(
  businessName: string,
  inviterName: string,
  role: string,
  inviteLink?: string
): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">You've Been Invited!</h2>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Hi there,
    </p>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      <strong style="color: #667eea;">${inviterName}</strong> has invited you to join <strong style="color: #667eea;">${businessName}</strong> as a <strong>${role}</strong>.
    </p>
    ${inviteLink ? `
    <div style="margin: 30px 0; text-align: center;">
      <a href="${inviteLink}" style="display: inline-block; padding: 14px 28px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
    </div>
    ` : ''}
    <p style="margin: 20px 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
      If you have any questions, please contact ${inviterName}.
    </p>
  `;

  return {
    subject: `Invitation to Join ${businessName} on Tech eTime`,
    htmlBody: getBaseTemplate(content),
    textBody: `You've Been Invited!\n\nHi there,\n\n${inviterName} has invited you to join ${businessName} as a ${role}.\n\n${inviteLink ? `Accept your invitation here: ${inviteLink}\n\n` : ''}If you have any questions, please contact ${inviterName}.`,
  };
}

/**
 * Password Reset Email - Sent when user requests password reset
 */
export function getPasswordResetEmailTemplate(resetLink: string, userName: string): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Password Reset Request</h2>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Hi ${userName},
    </p>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      We received a request to reset your password for your Tech eTime account.
    </p>
    <div style="margin: 30px 0; text-align: center;">
      <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Reset Password</a>
    </div>
    <p style="margin: 20px 0 0; color: #555555; font-size: 14px; line-height: 1.6;">
      This link will expire in 1 hour. If you didn't request this, please ignore this email and your password will remain unchanged.
    </p>
    <p style="margin: 10px 0 0; color: #999999; font-size: 12px; line-height: 1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <span style="color: #667eea; word-break: break-all;">${resetLink}</span>
    </p>
  `;

  return {
    subject: 'Reset Your Tech eTime Password',
    htmlBody: getBaseTemplate(content),
    textBody: `Password Reset Request\n\nHi ${userName},\n\nWe received a request to reset your password for your Tech eTime account.\n\nReset your password here: ${resetLink}\n\nThis link will expire in 1 hour. If you didn't request this, please ignore this email and your password will remain unchanged.`,
  };
}

/**
 * PIN Updated Email - Sent when a worker's PIN is updated
 */
export function getPinUpdatedEmailTemplate(userName: string, pin: string, businessName: string): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Your PIN Has Been Updated</h2>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Hi ${userName},
    </p>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Your time clock PIN for <strong style="color: #667eea;">${businessName}</strong> has been updated.
    </p>
    <div style="margin: 30px 0; padding: 20px; background-color: #f0f4ff; border: 2px solid #667eea; border-radius: 6px; text-align: center;">
      <p style="margin: 0 0 10px; color: #333333; font-size: 14px; font-weight: 600;">Your New PIN:</p>
      <p style="margin: 0; color: #667eea; font-size: 32px; font-weight: 700; letter-spacing: 4px; font-family: monospace;">${pin}</p>
    </div>
    <p style="margin: 20px 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
      Use this PIN to clock in and out at your time clock kiosk.
    </p>
    <p style="margin: 10px 0 0; color: #ff6b6b; font-size: 14px; line-height: 1.6;">
      <strong>Security Tip:</strong> Keep your PIN confidential and don't share it with others.
    </p>
  `;

  return {
    subject: `Your PIN Has Been Updated - ${businessName}`,
    htmlBody: getBaseTemplate(content),
    textBody: `Your PIN Has Been Updated\n\nHi ${userName},\n\nYour time clock PIN for ${businessName} has been updated.\n\nYour New PIN: ${pin}\n\nUse this PIN to clock in and out at your time clock kiosk.\n\nSecurity Tip: Keep your PIN confidential and don't share it with others.`,
  };
}

/**
 * Time Clock Reminder Email - Sent when a worker forgets to clock out
 */
export function getTimeClockReminderEmailTemplate(
  userName: string,
  businessName: string,
  clockInTime: string,
  locationName: string
): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">⏰ Time Clock Reminder</h2>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Hi ${userName},
    </p>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      We noticed you clocked in at <strong>${clockInTime}</strong> for <strong style="color: #667eea;">${businessName}</strong> (${locationName}) but haven't clocked out yet.
    </p>
    <div style="margin: 30px 0; padding: 20px; background-color: #fff4e6; border-left: 4px solid #ff9800; border-radius: 4px;">
      <p style="margin: 0; color: #333333; font-size: 14px;">
        <strong>Clock In Time:</strong> ${clockInTime}<br>
        <strong>Location:</strong> ${locationName}
      </p>
    </div>
    <p style="margin: 20px 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
      Please remember to clock out when you finish your shift. If you've already left, please contact your manager to correct your time entry.
    </p>
  `;

  return {
    subject: `Time Clock Reminder - ${businessName}`,
    htmlBody: getBaseTemplate(content),
    textBody: `Time Clock Reminder\n\nHi ${userName},\n\nWe noticed you clocked in at ${clockInTime} for ${businessName} (${locationName}) but haven't clocked out yet.\n\nClock In Time: ${clockInTime}\nLocation: ${locationName}\n\nPlease remember to clock out when you finish your shift. If you've already left, please contact your manager to correct your time entry.`,
  };
}

/**
 * Payroll Report Ready Email - Sent when a payroll report is generated
 */
export function getPayrollReportReadyEmailTemplate(
  userName: string,
  businessName: string,
  reportPeriod: string,
  downloadLink?: string
): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">📊 Payroll Report Ready</h2>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Hi ${userName},
    </p>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Your payroll report for <strong style="color: #667eea;">${businessName}</strong> is ready.
    </p>
    <div style="margin: 30px 0; padding: 20px; background-color: #f0f4ff; border-left: 4px solid #667eea; border-radius: 4px;">
      <p style="margin: 0; color: #333333; font-size: 14px;">
        <strong>Report Period:</strong> ${reportPeriod}
      </p>
    </div>
    ${downloadLink ? `
    <div style="margin: 30px 0; text-align: center;">
      <a href="${downloadLink}" style="display: inline-block; padding: 14px 28px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Download Report</a>
    </div>
    ` : `
    <p style="margin: 20px 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
      You can view and download the report from your Tech eTime dashboard.
    </p>
    `}
  `;

  return {
    subject: `Payroll Report Ready - ${businessName} (${reportPeriod})`,
    htmlBody: getBaseTemplate(content),
    textBody: `Payroll Report Ready\n\nHi ${userName},\n\nYour payroll report for ${businessName} is ready.\n\nReport Period: ${reportPeriod}\n\n${downloadLink ? `Download your report here: ${downloadLink}` : 'You can view and download the report from your Tech eTime dashboard.'}`,
  };
}

/**
 * Account Security Alert Email - Sent for security-related events
 */
export function getSecurityAlertEmailTemplate(
  userName: string,
  alertType: 'login' | 'password_change' | 'suspicious_activity',
  timestamp: string,
  ipAddress?: string
): EmailTemplate {
  const alertMessages = {
    login: 'A new login was detected on your account',
    password_change: 'Your password was recently changed',
    suspicious_activity: 'Suspicious activity was detected on your account',
  };

  const content = `
    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">🔒 Security Alert</h2>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Hi ${userName},
    </p>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      ${alertMessages[alertType]}.
    </p>
    <div style="margin: 30px 0; padding: 20px; background-color: #fff4e6; border-left: 4px solid #ff9800; border-radius: 4px;">
      <p style="margin: 0; color: #333333; font-size: 14px;">
        <strong>Time:</strong> ${timestamp}<br>
        ${ipAddress ? `<strong>IP Address:</strong> ${ipAddress}<br>` : ''}
        <strong>Alert Type:</strong> ${alertType.replace('_', ' ').toUpperCase()}
      </p>
    </div>
    <p style="margin: 20px 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
      If this wasn't you, please secure your account immediately by changing your password.
    </p>
    <p style="margin: 10px 0 0; color: #ff6b6b; font-size: 14px; line-height: 1.6;">
      <strong>If you didn't perform this action, contact support immediately.</strong>
    </p>
  `;

  return {
    subject: `Security Alert - Tech eTime Account`,
    htmlBody: getBaseTemplate(content),
    textBody: `Security Alert\n\nHi ${userName},\n\n${alertMessages[alertType]}.\n\nTime: ${timestamp}\n${ipAddress ? `IP Address: ${ipAddress}\n` : ''}Alert Type: ${alertType.replace('_', ' ').toUpperCase()}\n\nIf this wasn't you, please secure your account immediately by changing your password.\n\nIf you didn't perform this action, contact support immediately.`,
  };
}

/**
 * User Added to Business Email - Sent when a user is added to a business
 */
export function getUserAddedToBusinessEmailTemplate(
  userName: string,
  businessName: string,
  role: string,
  addedByName: string
): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Welcome to ${businessName}!</h2>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Hi ${userName},
    </p>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      You've been added to <strong style="color: #667eea;">${businessName}</strong> as a <strong>${role}</strong> by ${addedByName}.
    </p>
    <p style="margin: 20px 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
      You can now access this business in your Tech eTime account. Log in to get started!
    </p>
  `;

  return {
    subject: `You've Been Added to ${businessName}`,
    htmlBody: getBaseTemplate(content),
    textBody: `Welcome to ${businessName}!\n\nHi ${userName},\n\nYou've been added to ${businessName} as a ${role} by ${addedByName}.\n\nYou can now access this business in your Tech eTime account. Log in to get started!`,
  };
}

/**
 * User Removed from Business Email - Sent when a user is removed from a business
 */
export function getUserRemovedFromBusinessEmailTemplate(
  userName: string,
  businessName: string,
  removedByName: string
): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Access Removed</h2>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Hi ${userName},
    </p>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Your access to <strong style="color: #667eea;">${businessName}</strong> has been removed by ${removedByName}.
    </p>
    <p style="margin: 20px 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
      If you believe this was done in error, please contact ${removedByName} or your business administrator.
    </p>
  `;

  return {
    subject: `Access Removed - ${businessName}`,
    htmlBody: getBaseTemplate(content),
    textBody: `Access Removed\n\nHi ${userName},\n\nYour access to ${businessName} has been removed by ${removedByName}.\n\nIf you believe this was done in error, please contact ${removedByName} or your business administrator.`,
  };
}

/**
 * Pay Rate Changed Email - Sent when a worker's pay rate is updated
 */
export function getPayRateChangedEmailTemplate(
  userName: string,
  businessName: string,
  oldRate: number,
  newRate: number,
  effectiveDate: string
): EmailTemplate {
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const content = `
    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Pay Rate Updated</h2>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Hi ${userName},
    </p>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Your pay rate for <strong style="color: #667eea;">${businessName}</strong> has been updated.
    </p>
    <div style="margin: 30px 0; padding: 20px; background-color: #f0f4ff; border-left: 4px solid #667eea; border-radius: 4px;">
      <p style="margin: 0 0 10px; color: #333333; font-size: 14px;">
        <strong>Previous Rate:</strong> ${formatCurrency(oldRate)}/hour<br>
        <strong>New Rate:</strong> <span style="color: #667eea; font-weight: 600;">${formatCurrency(newRate)}/hour</span><br>
        <strong>Effective Date:</strong> ${effectiveDate}
      </p>
    </div>
    <p style="margin: 20px 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
      This new rate will apply to all hours worked on or after ${effectiveDate}.
    </p>
  `;

  return {
    subject: `Pay Rate Updated - ${businessName}`,
    htmlBody: getBaseTemplate(content),
    textBody: `Pay Rate Updated\n\nHi ${userName},\n\nYour pay rate for ${businessName} has been updated.\n\nPrevious Rate: ${formatCurrency(oldRate)}/hour\nNew Rate: ${formatCurrency(newRate)}/hour\nEffective Date: ${effectiveDate}\n\nThis new rate will apply to all hours worked on or after ${effectiveDate}.`,
  };
}

/**
 * Weekly Summary Email - Sent weekly with time clock summary
 */
export function getWeeklySummaryEmailTemplate(
  userName: string,
  businessName: string,
  weekStart: string,
  weekEnd: string,
  totalHours: number,
  totalEarnings: number
): EmailTemplate {
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const content = `
    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">📅 Weekly Summary</h2>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Hi ${userName},
    </p>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Here's your weekly summary for <strong style="color: #667eea;">${businessName}</strong>.
    </p>
    <div style="margin: 30px 0; padding: 20px; background-color: #f0f4ff; border-left: 4px solid #667eea; border-radius: 4px;">
      <p style="margin: 0 0 10px; color: #333333; font-size: 14px;">
        <strong>Week:</strong> ${weekStart} - ${weekEnd}<br>
        <strong>Total Hours:</strong> ${totalHours.toFixed(2)} hours<br>
        <strong>Total Earnings:</strong> <span style="color: #667eea; font-weight: 600; font-size: 18px;">${formatCurrency(totalEarnings)}</span>
      </p>
    </div>
    <p style="margin: 20px 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
      Log in to your Tech eTime account to view detailed time entries and reports.
    </p>
  `;

  return {
    subject: `Weekly Summary - ${businessName} (${weekStart} to ${weekEnd})`,
    htmlBody: getBaseTemplate(content),
    textBody: `Weekly Summary\n\nHi ${userName},\n\nHere's your weekly summary for ${businessName}.\n\nWeek: ${weekStart} - ${weekEnd}\nTotal Hours: ${totalHours.toFixed(2)} hours\nTotal Earnings: ${formatCurrency(totalEarnings)}\n\nLog in to your Tech eTime account to view detailed time entries and reports.`,
  };
}

/**
 * Account Deactivated Email - Sent when an account is deactivated
 */
export function getAccountDeactivatedEmailTemplate(
  userName: string,
  businessName: string,
  deactivatedByName: string
): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Account Deactivated</h2>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Hi ${userName},
    </p>
    <p style="margin: 0 0 15px; color: #555555; font-size: 16px; line-height: 1.6;">
      Your account for <strong style="color: #667eea;">${businessName}</strong> has been deactivated by ${deactivatedByName}.
    </p>
    <p style="margin: 20px 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
      You will no longer be able to access this business or clock in/out. If you believe this was done in error, please contact ${deactivatedByName} or your business administrator.
    </p>
  `;

  return {
    subject: `Account Deactivated - ${businessName}`,
    htmlBody: getBaseTemplate(content),
    textBody: `Account Deactivated\n\nHi ${userName},\n\nYour account for ${businessName} has been deactivated by ${deactivatedByName}.\n\nYou will no longer be able to access this business or clock in/out. If you believe this was done in error, please contact ${deactivatedByName} or your business administrator.`,
  };
}
