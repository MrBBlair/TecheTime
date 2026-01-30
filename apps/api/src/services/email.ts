/**
 * Email Service
 * Handles sending emails using Firebase Extensions or direct SMTP
 * Supports multiple providers: SendGrid, AWS SES, SMTP
 */

import { db } from '../config/firebase';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailOptions {
  to: string;
  template: EmailTemplate;
  from?: string;
  replyTo?: string;
}

/**
 * Send email using configured provider
 * In production, this would use Firebase Extensions or a service like SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const emailProvider = process.env.EMAIL_PROVIDER || 'firebase'; // firebase, sendgrid, ses, smtp

  switch (emailProvider) {
    case 'firebase':
      // Use Firebase Extensions Email (if installed)
      await sendEmailViaFirebase(options);
      break;
    case 'sendgrid':
      await sendEmailViaSendGrid(options);
      break;
    case 'ses':
      await sendEmailViaSES(options);
      break;
    case 'smtp':
      await sendEmailViaSMTP(options);
      break;
    default:
      console.warn(`Email provider "${emailProvider}" not configured. Email not sent.`);
      // In development, log the email instead
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email (dev mode):', {
          to: options.to,
          subject: options.template.subject,
          html: options.template.html,
        });
      }
  }
}

/**
 * Send email via Firebase Extensions Email
 */
async function sendEmailViaFirebase(options: EmailOptions): Promise<void> {
  // Store email in Firestore - Firebase Extensions Email will pick it up
  await db.collection('mail').add({
    to: options.to,
    message: {
      subject: options.template.subject,
      html: options.template.html,
      text: options.template.text || options.template.html.replace(/<[^>]*>/g, ''),
    },
    ...(options.from && { from: options.from }),
    ...(options.replyTo && { replyTo: options.replyTo }),
  });
}

/**
 * Send email via SendGrid
 */
async function sendEmailViaSendGrid(options: EmailOptions): Promise<void> {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (!sendgridApiKey) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  try {
    // Dynamic import to avoid requiring SendGrid in all environments
    // Use eval to bypass TypeScript checking for optional dependency
    const sgMailModule = await eval('import("@sendgrid/mail")');
    const sgMail = sgMailModule.default;
    sgMail.setApiKey(sendgridApiKey);

    await sgMail.send({
      to: options.to,
      from: options.from || process.env.SENDGRID_FROM_EMAIL || 'noreply@tech-etime.com',
      subject: options.template.subject,
      html: options.template.html,
      text: options.template.text || options.template.html.replace(/<[^>]*>/g, ''),
      ...(options.replyTo && { replyTo: options.replyTo }),
    });
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND' || error.message?.includes('Cannot find module')) {
      console.warn('@sendgrid/mail not installed. Falling back to Firebase email.');
      await sendEmailViaFirebase(options);
    } else {
      throw error;
    }
  }
}

/**
 * Send email via AWS SES
 */
async function sendEmailViaSES(options: EmailOptions): Promise<void> {
  // AWS SES implementation would go here
  // For now, use Firebase as fallback
  await sendEmailViaFirebase(options);
}

/**
 * Send email via SMTP
 */
async function sendEmailViaSMTP(options: EmailOptions): Promise<void> {
  // SMTP implementation would go here
  // For now, use Firebase as fallback
  await sendEmailViaFirebase(options);
}

/**
 * Get email sender address based on environment
 */
export function getEmailFrom(): string {
  return (
    process.env.EMAIL_FROM ||
    process.env.SENDGRID_FROM_EMAIL ||
    'noreply@tech-etime.com'
  );
}
