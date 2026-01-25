# Email Templates and Situations

This document describes all email situations and templates available in Tech eTime, along with usage examples.

## Overview

Tech eTime uses Postmark for email delivery. All email templates are defined in `apps/api/src/services/emailTemplates.ts` and the email sending functions are in `apps/api/src/services/postmark.ts`.

## Email Situations

### 1. Welcome Email
**When:** Sent when a new business is created  
**Function:** `sendWelcomeEmail()`  
**Parameters:**
- `email` (string): Recipient email address
- `businessName` (string): Name of the business
- `ownerName` (string, optional): Owner's full name (defaults to "there")

**Example:**
```typescript
import { sendWelcomeEmail } from './services/postmark.js';

await sendWelcomeEmail(
  'owner@example.com',
  'Acme Corporation',
  'John Doe'
);
```

---

### 2. User Invited Email
**When:** Sent when a user is invited to join a business  
**Function:** `sendUserInvitedEmail()`  
**Parameters:**
- `email` (string): Recipient email address
- `businessName` (string): Name of the business
- `inviterName` (string): Name of the person sending the invitation
- `role` (string): Role being assigned (OWNER, MANAGER, WORKER)
- `inviteLink` (string, optional): Link to accept the invitation

**Example:**
```typescript
import { sendUserInvitedEmail } from './services/postmark.js';

await sendUserInvitedEmail(
  'worker@example.com',
  'Acme Corporation',
  'John Doe',
  'WORKER',
  'https://app.techetime.app/invite/abc123'
);
```

---

### 3. Password Reset Email
**When:** Sent when a user requests a password reset  
**Function:** `sendPasswordResetEmail()`  
**Parameters:**
- `email` (string): Recipient email address
- `resetLink` (string): Password reset link (should expire in 1 hour)
- `userName` (string, optional): User's name (defaults to "there")

**Example:**
```typescript
import { sendPasswordResetEmail } from './services/postmark.js';

await sendPasswordResetEmail(
  'user@example.com',
  'https://app.techetime.app/reset-password?token=xyz789',
  'Jane Smith'
);
```

---

### 4. PIN Updated Email
**When:** Sent when a worker's time clock PIN is updated  
**Function:** `sendPinUpdatedEmail()`  
**Parameters:**
- `email` (string): Recipient email address
- `userName` (string): Worker's name
- `pin` (string): The new 4-digit PIN
- `businessName` (string): Name of the business

**Example:**
```typescript
import { sendPinUpdatedEmail } from './services/postmark.js';

await sendPinUpdatedEmail(
  'worker@example.com',
  'Jane Smith',
  '1234',
  'Acme Corporation'
);
```

---

### 5. Time Clock Reminder Email
**When:** Sent when a worker clocks in but hasn't clocked out after a certain period  
**Function:** `sendTimeClockReminderEmail()`  
**Parameters:**
- `email` (string): Recipient email address
- `userName` (string): Worker's name
- `businessName` (string): Name of the business
- `clockInTime` (string): Formatted clock-in time
- `locationName` (string): Name of the location

**Example:**
```typescript
import { sendTimeClockReminderEmail } from './services/postmark.js';

await sendTimeClockReminderEmail(
  'worker@example.com',
  'Jane Smith',
  'Acme Corporation',
  'January 24, 2026 at 9:00 AM',
  'Main Office'
);
```

---

### 6. Payroll Report Ready Email
**When:** Sent when a payroll report is generated  
**Function:** `sendPayrollReportReadyEmail()`  
**Parameters:**
- `email` (string): Recipient email address
- `userName` (string): Recipient's name
- `businessName` (string): Name of the business
- `reportPeriod` (string): Report period (e.g., "January 1-31, 2026")
- `downloadLink` (string, optional): Direct download link for the report

**Example:**
```typescript
import { sendPayrollReportReadyEmail } from './services/postmark.js';

await sendPayrollReportReadyEmail(
  'manager@example.com',
  'John Doe',
  'Acme Corporation',
  'January 1-31, 2026',
  'https://app.techetime.app/reports/download/abc123'
);
```

---

### 7. Security Alert Email
**When:** Sent for security-related events (login, password change, suspicious activity)  
**Function:** `sendSecurityAlertEmail()`  
**Parameters:**
- `email` (string): Recipient email address
- `userName` (string): User's name
- `alertType` ('login' | 'password_change' | 'suspicious_activity'): Type of security event
- `timestamp` (string): Formatted timestamp of the event
- `ipAddress` (string, optional): IP address where the event occurred

**Example:**
```typescript
import { sendSecurityAlertEmail } from './services/postmark.js';

await sendSecurityAlertEmail(
  'user@example.com',
  'John Doe',
  'login',
  'January 24, 2026 at 2:30 PM',
  '192.168.1.1'
);
```

---

### 8. User Added to Business Email
**When:** Sent when a user is added to a business  
**Function:** `sendUserAddedToBusinessEmail()`  
**Parameters:**
- `email` (string): Recipient email address
- `userName` (string): User's name
- `businessName` (string): Name of the business
- `role` (string): Role assigned (OWNER, MANAGER, WORKER)
- `addedByName` (string): Name of the person who added them

**Example:**
```typescript
import { sendUserAddedToBusinessEmail } from './services/postmark.js';

await sendUserAddedToBusinessEmail(
  'worker@example.com',
  'Jane Smith',
  'Acme Corporation',
  'WORKER',
  'John Doe'
);
```

---

### 9. User Removed from Business Email
**When:** Sent when a user is removed from a business  
**Function:** `sendUserRemovedFromBusinessEmail()`  
**Parameters:**
- `email` (string): Recipient email address
- `userName` (string): User's name
- `businessName` (string): Name of the business
- `removedByName` (string): Name of the person who removed them

**Example:**
```typescript
import { sendUserRemovedFromBusinessEmail } from './services/postmark.js';

await sendUserRemovedFromBusinessEmail(
  'worker@example.com',
  'Jane Smith',
  'Acme Corporation',
  'John Doe'
);
```

---

### 10. Pay Rate Changed Email
**When:** Sent when a worker's pay rate is updated  
**Function:** `sendPayRateChangedEmail()`  
**Parameters:**
- `email` (string): Recipient email address
- `userName` (string): Worker's name
- `businessName` (string): Name of the business
- `oldRate` (number): Previous hourly rate in cents (e.g., 2500 = $25.00)
- `newRate` (number): New hourly rate in cents (e.g., 3000 = $30.00)
- `effectiveDate` (string): Date when the new rate takes effect

**Example:**
```typescript
import { sendPayRateChangedEmail } from './services/postmark.js';

await sendPayRateChangedEmail(
  'worker@example.com',
  'Jane Smith',
  'Acme Corporation',
  2500, // $25.00/hour
  3000, // $30.00/hour
  'February 1, 2026'
);
```

---

### 11. Weekly Summary Email
**When:** Sent weekly with a summary of time clock activity  
**Function:** `sendWeeklySummaryEmail()`  
**Parameters:**
- `email` (string): Recipient email address
- `userName` (string): Worker's name
- `businessName` (string): Name of the business
- `weekStart` (string): Start date of the week (formatted)
- `weekEnd` (string): End date of the week (formatted)
- `totalHours` (number): Total hours worked (decimal, e.g., 40.5)
- `totalEarnings` (number): Total earnings in cents (e.g., 100000 = $1,000.00)

**Example:**
```typescript
import { sendWeeklySummaryEmail } from './services/postmark.js';

await sendWeeklySummaryEmail(
  'worker@example.com',
  'Jane Smith',
  'Acme Corporation',
  'January 18, 2026',
  'January 24, 2026',
  40.5, // hours
  101250 // $1,012.50 in cents
);
```

---

### 12. Account Deactivated Email
**When:** Sent when a user account is deactivated  
**Function:** `sendAccountDeactivatedEmail()`  
**Parameters:**
- `email` (string): Recipient email address
- `userName` (string): User's name
- `businessName` (string): Name of the business
- `deactivatedByName` (string): Name of the person who deactivated the account

**Example:**
```typescript
import { sendAccountDeactivatedEmail } from './services/postmark.js';

await sendAccountDeactivatedEmail(
  'worker@example.com',
  'Jane Smith',
  'Acme Corporation',
  'John Doe'
);
```

---

## Implementation Notes

### Error Handling
All email functions handle errors gracefully:
- If Postmark is not configured, emails are skipped (logged but not sent)
- Errors are logged but don't crash the application
- Always wrap email calls in try-catch blocks for critical operations

### Email Formatting
- All emails use a consistent HTML template with Tech eTime branding
- Emails include both HTML and plain text versions
- Templates are responsive and mobile-friendly
- Currency values should be passed in cents (integers) and are formatted automatically

### Environment Variables
Required environment variables:
- `POSTMARK_API_TOKEN`: Your Postmark API token
- `POSTMARK_FROM_EMAIL`: Sender email address (defaults to `noreply@techetime.app`)

### Usage in Routes
Example of using email functions in API routes:

```typescript
import { sendPinUpdatedEmail } from '../services/postmark.js';

// In your route handler
try {
  await sendPinUpdatedEmail(
    user.email,
    `${user.firstName} ${user.lastName}`,
    newPin,
    business.name
  );
} catch (emailError) {
  console.error('Failed to send PIN update email:', emailError);
  // Don't fail the request if email fails
}
```

---

## Template Customization

All templates are defined in `apps/api/src/services/emailTemplates.ts`. To customize:

1. **Colors**: Update the color scheme in `getBaseTemplate()` function
2. **Branding**: Modify the header section with logo/branding
3. **Content**: Edit individual template functions to change wording
4. **Layout**: Adjust HTML structure in template functions

---

## Testing

To test emails locally without Postmark:
1. Set `POSTMARK_API_TOKEN` to empty/undefined
2. Emails will be logged to console instead of being sent
3. Check console output for email content

---

## Future Enhancements

Potential email situations to add:
- Monthly payroll summaries
- Overtime alerts
- Shift reminders
- Holiday notifications
- System maintenance announcements
- Feature announcements
