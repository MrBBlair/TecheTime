/**
 * Payroll calculation utilities
 * Handles overtime, rate lookups, and edge cases
 */

import { Timestamp } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';

export interface PayRateData {
  hourlyRate: number; // in cents
  effectiveFrom: Date;
}

export interface TimeEntryData {
  id: string;
  userId: string;
  locationId: string;
  clockInAt: Date;
  clockOutAt: Date | null;
  notes?: string | null;
}

export interface PayrollCalculationResult {
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  totalHours: number;
  hourlyRate: number;
  grossPay: number;
  entries: TimeEntryData[];
}

export interface OvertimeConfig {
  regularHoursPerWeek: number; // Default 40
  overtimeMultiplier: number; // Default 1.5
  doubleTimeMultiplier: number; // Default 2.0 (optional)
  doubleTimeThreshold?: number; // Hours per week threshold for double time (optional)
}

const DEFAULT_OVERTIME_CONFIG: OvertimeConfig = {
  regularHoursPerWeek: 40,
  overtimeMultiplier: 1.5,
  doubleTimeMultiplier: 2.0,
};

/**
 * Convert Firestore Timestamp to Date
 */
export function toDate(timestamp: any): Date {
  if (!timestamp) return new Date(0);
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (timestamp._seconds) {
    return new Date(timestamp._seconds * 1000);
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return new Date(timestamp);
}

/**
 * Get the start of week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const weekStart = new Date(d);
  weekStart.setDate(diff);
  return weekStart;
}

/**
 * Get pay rate for a user at a specific date
 * Checks payRates collection and finds the most recent effective rate
 * Falls back to user document if no pay rate found
 */
export async function getPayRate(
  db: Firestore,
  businessId: string,
  userId: string,
  effectiveDate: Date
): Promise<number | null> {
  try {
    const ratesSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('payRates')
      .where('userId', '==', userId)
      .get();

    // Find rates effective on or before the date
    if (!ratesSnapshot.empty) {
      const effectiveRates = ratesSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            hourlyRate: data.hourlyRate || 0,
            effectiveFrom: toDate(data.effectiveFrom),
          };
        })
        .filter((rate) => rate.effectiveFrom <= effectiveDate)
        .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());

      if (effectiveRates.length > 0) {
        // Convert from cents to dollars
        return effectiveRates[0].hourlyRate / 100;
      }
    }

    // Fallback: Get the most recent pay rate regardless of effective date
    // This handles cases where pay rates were set up after time entries were created
    if (!ratesSnapshot.empty) {
      const allRates = ratesSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            hourlyRate: data.hourlyRate || 0,
            effectiveFrom: toDate(data.effectiveFrom),
          };
        })
        .filter((rate) => rate.hourlyRate > 0)
        .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());
      
      if (allRates.length > 0) {
        // Convert from cents to dollars
        return allRates[0].hourlyRate / 100;
      }
    }

    return null;
  } catch (error) {
    console.warn(`Failed to fetch pay rate for user ${userId}:`, error);
    return null;
  }
}

/**
 * Calculate hours for a single time entry
 * Handles midnight crossing and validates dates
 */
export function calculateEntryHours(entry: TimeEntryData): number {
  if (!entry.clockOutAt) {
    return 0; // Incomplete entry
  }

  const clockIn = entry.clockInAt;
  const clockOut = entry.clockOutAt;

  // Validate dates
  if (isNaN(clockIn.getTime()) || isNaN(clockOut.getTime())) {
    return 0;
  }

  // Ensure clock out is after clock in
  if (clockOut < clockIn) {
    return 0;
  }

  // Calculate hours (handles midnight crossing automatically)
  const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

  // Cap at 24 hours per shift (safety check)
  return Math.min(hours, 24);
}

/**
 * Group time entries by week for overtime calculation
 */
function groupEntriesByWeek(entries: TimeEntryData[]): Map<string, TimeEntryData[]> {
  const weekMap = new Map<string, TimeEntryData[]>();

  for (const entry of entries) {
    if (!entry.clockOutAt) continue;
    const weekStart = getWeekStart(entry.clockInAt);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(entry);
  }

  return weekMap;
}

/**
 * Calculate regular vs overtime hours for a week
 */
function calculateWeeklyHours(
  weekEntries: TimeEntryData[],
  config: OvertimeConfig
): { regular: number; overtime: number; doubleTime: number } {
  const totalHours = weekEntries.reduce((sum, entry) => {
    return sum + calculateEntryHours(entry);
  }, 0);

  const regularHoursPerWeek = config.regularHoursPerWeek || 40;
  const doubleTimeThreshold = config.doubleTimeThreshold;

  let regular = Math.min(totalHours, regularHoursPerWeek);
  let overtime = 0;
  let doubleTime = 0;

  if (totalHours > regularHoursPerWeek) {
    const excessHours = totalHours - regularHoursPerWeek;
    
    if (doubleTimeThreshold && totalHours > doubleTimeThreshold) {
      // Calculate double time hours
      const doubleTimeHours = totalHours - doubleTimeThreshold;
      doubleTime = doubleTimeHours;
      overtime = excessHours - doubleTimeHours;
    } else {
      overtime = excessHours;
    }
  }

  return { regular, overtime, doubleTime };
}

/**
 * Calculate payroll for a set of time entries
 * Handles overtime, rate lookup, and edge cases
 */
export async function calculatePayroll(
  db: Firestore,
  businessId: string,
  userId: string,
  entries: TimeEntryData[],
  config: OvertimeConfig = DEFAULT_OVERTIME_CONFIG
): Promise<PayrollCalculationResult> {
  // Filter out incomplete entries
  const completeEntries = entries.filter((e) => e.clockOutAt !== null);

  if (completeEntries.length === 0) {
    return {
      regularHours: 0,
      overtimeHours: 0,
      doubleTimeHours: 0,
      totalHours: 0,
      hourlyRate: 0,
      grossPay: 0,
      entries: [],
    };
  }

  // Get pay rate (use the earliest entry date for rate lookup)
  const earliestEntry = completeEntries.reduce((earliest, entry) => {
    return entry.clockInAt < earliest.clockInAt ? entry : earliest;
  }, completeEntries[0]);

  const hourlyRate = await getPayRate(db, businessId, userId, earliestEntry.clockInAt) || 0;

  // Group entries by week for overtime calculation
  const weekMap = groupEntriesByWeek(completeEntries);

  let totalRegularHours = 0;
  let totalOvertimeHours = 0;
  let totalDoubleTimeHours = 0;

  // Calculate hours per week
  for (const [weekKey, weekEntries] of weekMap) {
    const weekly = calculateWeeklyHours(weekEntries, config);
    totalRegularHours += weekly.regular;
    totalOvertimeHours += weekly.overtime;
    totalDoubleTimeHours += weekly.doubleTime;
  }

  const totalHours = totalRegularHours + totalOvertimeHours + totalDoubleTimeHours;

  // Calculate gross pay
  const regularPay = totalRegularHours * hourlyRate;
  const overtimePay = totalOvertimeHours * hourlyRate * config.overtimeMultiplier;
  const doubleTimePay = totalDoubleTimeHours * hourlyRate * (config.doubleTimeMultiplier || 2.0);
  const grossPay = regularPay + overtimePay + doubleTimePay;

  return {
    regularHours: totalRegularHours,
    overtimeHours: totalOvertimeHours,
    doubleTimeHours: totalDoubleTimeHours,
    totalHours,
    hourlyRate,
    grossPay,
    entries: completeEntries,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format hours for display
 */
export function formatHours(hours: number): string {
  return hours.toFixed(2);
}
