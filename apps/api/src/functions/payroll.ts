/**
 * Firebase Cloud Function: Payroll Aggregation
 * Triggers on timeEntry writes to calculate payroll when shift closes
 */

import * as functions from 'firebase-functions';
import { db } from '../config/firebase';
import { format, parseISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

/**
 * Calculate hours worked between two UTC timestamps in a specific timezone
 */
function calculateHours(
  clockInAt: string,
  clockOutAt: string,
  timezone: string
): number {
  const clockIn = parseISO(clockInAt);
  const clockOut = parseISO(clockOutAt);
  const zonedIn = utcToZonedTime(clockIn, timezone);
  const zonedOut = utcToZonedTime(clockOut, timezone);

  // Calculate difference in milliseconds, convert to hours
  const diffMs = zonedOut.getTime() - zonedIn.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Calculate pay based on hours and pay rate
 * Supports overtime (1.5x after 40 hours) and double time (2x after 60 hours)
 */
function calculatePay(hours: number, payRateCents: number): {
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  totalPay: number;
} {
  let regularHours = Math.min(hours, 40);
  let overtimeHours = Math.max(0, Math.min(hours - 40, 20)); // Between 40-60 hours
  let doubleTimeHours = Math.max(0, hours - 60); // Over 60 hours

  const regularPay = regularHours * payRateCents;
  const overtimePay = overtimeHours * payRateCents * 1.5;
  const doubleTimePay = doubleTimeHours * payRateCents * 2;

  return {
    regularHours,
    overtimeHours,
    doubleTimeHours,
    totalPay: Math.round(regularPay + overtimePay + doubleTimePay),
  };
}

/**
 * Get the effective pay rate for a user on a specific date
 */
async function getUserPayRate(userId: string, date: string): Promise<number> {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();
  const payRates = userData?.payRates || [];

  if (payRates.length === 0) {
    // Default to a pay rate if none set (should be configured)
    return 1500; // $15.00/hour in cents
  }

  // Find the most recent pay rate effective on or before the date
  const effectiveRate = payRates
    .filter((rate: any) => rate.effectiveDate <= date)
    .sort((a: any, b: any) => b.effectiveDate.localeCompare(a.effectiveDate))[0];

  return effectiveRate?.amount || 1500;
}

/**
 * Firebase Function: onTimeEntryWrite
 * Triggers when a timeEntry document is created or updated
 */
export const onTimeEntryWrite = functions.firestore
  .document('timeEntries/{timeEntryId}')
  .onWrite(async (change, context) => {
    const timeEntryId = context.params.timeEntryId;
    const before = change.before.data();
    const after = change.after.data();

    // Only process if clockOutAt was just set (shift closed)
    if (!after) {
      return; // Document deleted
    }

    const wasOpen = before && !before.clockOutAt;
    const isNowClosed = after.clockOutAt && !after.calculatedPay;

    if (!wasOpen || !isNowClosed) {
      return; // Shift wasn't just closed, or already calculated
    }

    try {
      const { userId, clockInAt, clockOutAt, locationTimezone } = after;

      // Calculate hours worked
      const hours = calculateHours(clockInAt, clockOutAt, locationTimezone);

      // Get user's pay rate
      const payRateCents = await getUserPayRate(userId, clockInAt.split('T')[0]);

      // Calculate pay
      const { regularHours, overtimeHours, doubleTimeHours, totalPay } = calculatePay(
        hours,
        payRateCents
      );

      // Update time entry with calculated values
      await change.after.ref.update({
        calculatedPay: totalPay,
        calculatedHours: hours,
      });

      // Get date in location timezone for daily summary
      const clockOutDate = parseISO(clockOutAt);
      const zonedDate = utcToZonedTime(clockOutDate, locationTimezone);
      const dateStr = format(zonedDate, 'yyyy-MM-dd');

      // Update or create daily payroll summary
      const summaryId = `${dateStr}_${userId}`;
      const summaryRef = db.collection('dailyPayrollSummaries').doc(summaryId);

      await db.runTransaction(async (transaction) => {
        const summaryDoc = await transaction.get(summaryRef);

        if (summaryDoc.exists) {
          const existing = summaryDoc.data()!;
          transaction.update(summaryRef, {
            totalHours: existing.totalHours + hours,
            totalPay: existing.totalPay + totalPay,
            regularHours: (existing.regularHours || 0) + regularHours,
            overtimeHours: (existing.overtimeHours || 0) + overtimeHours,
            doubleTimeHours: (existing.doubleTimeHours || 0) + doubleTimeHours,
            updatedAt: new Date().toISOString(),
          });
        } else {
          transaction.set(summaryRef, {
            userId,
            businessId: after.businessId,
            locationId: after.locationId,
            date: dateStr,
            totalHours: hours,
            totalPay,
            regularHours,
            overtimeHours,
            doubleTimeHours,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      });

      console.log(`Payroll calculated for timeEntry ${timeEntryId}: ${hours} hours, $${totalPay / 100}`);
    } catch (error) {
      console.error(`Error calculating payroll for timeEntry ${timeEntryId}:`, error);
      // Don't throw - we don't want to retry indefinitely
    }
  });
