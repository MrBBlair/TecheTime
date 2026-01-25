import postmark from 'postmark';
import {
  getWelcomeEmailTemplate,
  getUserInvitedEmailTemplate,
  getPasswordResetEmailTemplate,
  getPinUpdatedEmailTemplate,
  getTimeClockReminderEmailTemplate,
  getPayrollReportReadyEmailTemplate,
  getSecurityAlertEmailTemplate,
  getUserAddedToBusinessEmailTemplate,
  getUserRemovedFromBusinessEmailTemplate,
  getPayRateChangedEmailTemplate,
  getWeeklySummaryEmailTemplate,
  getAccountDeactivatedEmailTemplate,
} from './emailTemplates.js';

const client = process.env.POSTMARK_API_TOKEN
  ? new postmark.ServerClient(process.env.POSTMARK_API_TOKEN)
  : null;

const getFromEmail = () => process.env.POSTMARK_FROM_EMAIL || 'noreply@techetime.app';

/**
 * Helper function to send emails with error handling
 */
async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<void> {
  if (!client) {
    console.log('Postmark not configured, skipping email:', to);
    return;
  }

  try {
    await client.sendEmail({
      From: getFromEmail(),
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody,
    });
  } catch (error) {
    console.error('Postmark error:', error);
    throw error;
  }
}

/**
 * Welcome Email - Sent when a business is created
 */
export async function sendWelcomeEmail(
  email: string,
  businessName: string,
  ownerName: string = 'there'
): Promise<void> {
  const template = getWelcomeEmailTemplate(businessName, ownerName);
  await sendEmail(email, template.subject, template.htmlBody, template.textBody);
}

/**
 * User Invited Email - Sent when a user is invited to join a business
 */
export async function sendUserInvitedEmail(
  email: string,
  businessName: string,
  inviterName: string,
  role: string,
  inviteLink?: string
): Promise<void> {
  const template = getUserInvitedEmailTemplate(businessName, inviterName, role, inviteLink);
  await sendEmail(email, template.subject, template.htmlBody, template.textBody);
}

/**
 * Password Reset Email - Sent when user requests password reset
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  userName: string = 'there'
): Promise<void> {
  const template = getPasswordResetEmailTemplate(resetLink, userName);
  await sendEmail(email, template.subject, template.htmlBody, template.textBody);
}

/**
 * PIN Updated Email - Sent when a worker's PIN is updated
 */
export async function sendPinUpdatedEmail(
  email: string,
  userName: string,
  pin: string,
  businessName: string
): Promise<void> {
  const template = getPinUpdatedEmailTemplate(userName, pin, businessName);
  await sendEmail(email, template.subject, template.htmlBody, template.textBody);
}

/**
 * Time Clock Reminder Email - Sent when a worker forgets to clock out
 */
export async function sendTimeClockReminderEmail(
  email: string,
  userName: string,
  businessName: string,
  clockInTime: string,
  locationName: string
): Promise<void> {
  const template = getTimeClockReminderEmailTemplate(userName, businessName, clockInTime, locationName);
  await sendEmail(email, template.subject, template.htmlBody, template.textBody);
}

/**
 * Payroll Report Ready Email - Sent when a payroll report is generated
 */
export async function sendPayrollReportReadyEmail(
  email: string,
  userName: string,
  businessName: string,
  reportPeriod: string,
  downloadLink?: string
): Promise<void> {
  const template = getPayrollReportReadyEmailTemplate(userName, businessName, reportPeriod, downloadLink);
  await sendEmail(email, template.subject, template.htmlBody, template.textBody);
}

/**
 * Account Security Alert Email - Sent for security-related events
 */
export async function sendSecurityAlertEmail(
  email: string,
  userName: string,
  alertType: 'login' | 'password_change' | 'suspicious_activity',
  timestamp: string,
  ipAddress?: string
): Promise<void> {
  const template = getSecurityAlertEmailTemplate(userName, alertType, timestamp, ipAddress);
  await sendEmail(email, template.subject, template.htmlBody, template.textBody);
}

/**
 * User Added to Business Email - Sent when a user is added to a business
 */
export async function sendUserAddedToBusinessEmail(
  email: string,
  userName: string,
  businessName: string,
  role: string,
  addedByName: string
): Promise<void> {
  const template = getUserAddedToBusinessEmailTemplate(userName, businessName, role, addedByName);
  await sendEmail(email, template.subject, template.htmlBody, template.textBody);
}

/**
 * User Removed from Business Email - Sent when a user is removed from a business
 */
export async function sendUserRemovedFromBusinessEmail(
  email: string,
  userName: string,
  businessName: string,
  removedByName: string
): Promise<void> {
  const template = getUserRemovedFromBusinessEmailTemplate(userName, businessName, removedByName);
  await sendEmail(email, template.subject, template.htmlBody, template.textBody);
}

/**
 * Pay Rate Changed Email - Sent when a worker's pay rate is updated
 */
export async function sendPayRateChangedEmail(
  email: string,
  userName: string,
  businessName: string,
  oldRate: number, // in cents
  newRate: number, // in cents
  effectiveDate: string
): Promise<void> {
  const template = getPayRateChangedEmailTemplate(userName, businessName, oldRate, newRate, effectiveDate);
  await sendEmail(email, template.subject, template.htmlBody, template.textBody);
}

/**
 * Weekly Summary Email - Sent weekly with time clock summary
 */
export async function sendWeeklySummaryEmail(
  email: string,
  userName: string,
  businessName: string,
  weekStart: string,
  weekEnd: string,
  totalHours: number,
  totalEarnings: number // in cents
): Promise<void> {
  const template = getWeeklySummaryEmailTemplate(
    userName,
    businessName,
    weekStart,
    weekEnd,
    totalHours,
    totalEarnings
  );
  await sendEmail(email, template.subject, template.htmlBody, template.textBody);
}

/**
 * Account Deactivated Email - Sent when an account is deactivated
 */
export async function sendAccountDeactivatedEmail(
  email: string,
  userName: string,
  businessName: string,
  deactivatedByName: string
): Promise<void> {
  const template = getAccountDeactivatedEmailTemplate(userName, businessName, deactivatedByName);
  await sendEmail(email, template.subject, template.htmlBody, template.textBody);
}
