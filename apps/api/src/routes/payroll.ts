import { Router } from 'express';
import { db } from '../firebase/admin.js';
import { payrollReportSchema } from '@techetime/shared';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';
import { generatePayrollInsights } from '../services/gemini.js';
import {
  calculatePayroll,
  type TimeEntryData,
} from '../utils/payrollCalculations.js';
import { logAuditEntry, generateReportId } from '../utils/auditLog.js';

export const payrollRouter = Router();

interface PayrollReportRow {
  userId: string;
  worker: string;
  locationId?: string;
  locationName?: string;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  totalHours: number;
  hourlyRate: number;
  grossPay: number;
  entryCount: number;
  entries?: TimeEntryData[];
}

interface PayrollReportSummary {
  totalHours: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalDoubleTimeHours: number;
  totalGrossPay: number;
  workerCount: number;
  locationCount: number;
  reportId: string;
  generatedAt: string;
  dateRange: {
    start: string;
    end: string;
  };
}

/**
 * Get location name by ID
 */
async function getLocationName(businessId: string, locationId: string): Promise<string> {
  try {
    const locDoc = await db
      .collection('businesses')
      .doc(businessId)
      .collection('locations')
      .doc(locationId)
      .get();
    
    if (locDoc.exists) {
      return locDoc.data()?.name || 'Unknown Location';
    }
    return 'Unknown Location';
  } catch (error) {
    console.warn(`Failed to fetch location ${locationId}:`, error);
    return 'Unknown Location';
  }
}

/**
 * Get user name by ID
 */
async function getUserName(userId: string): Promise<string> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data()!;
      return `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown Worker';
    }
    return 'Unknown Worker';
  } catch (error) {
    console.warn(`Failed to fetch user ${userId}:`, error);
    return 'Unknown Worker';
  }
}

payrollRouter.get('/payroll', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    if (!req.businessId) {
      return res.status(400).json({ error: 'Business ID required' });
    }

    if (!req.userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // Parse and validate query parameters
    const reportQuery = payrollReportSchema.parse({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
      locationId: req.query.locationId,
    });

    const startDate = new Date(reportQuery.startDate);
    const endDate = new Date(reportQuery.endDate);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Validate date range
    if (startDate > endDate) {
      return res.status(400).json({ error: 'Start date must be before or equal to end date' });
    }

    // Check date range limit (max 90 days unless admin)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const MAX_DAYS = 90;
    if (daysDiff > MAX_DAYS) {
      return res.status(400).json({ 
        error: `Date range cannot exceed ${MAX_DAYS} days. Please select a smaller range.` 
      });
    }

    // Adjust end date to end of day
    endDate.setHours(23, 59, 59, 999);
    startDate.setHours(0, 0, 0, 0);

    // Fetch time entries with date range filtering at database level for better performance
    // Note: Requires composite index: timeEntries(clockInAt, userId, locationId)
    // If index doesn't exist, Firestore will suggest creating it
    let entriesSnapshot;
    try {
      let entriesQuery: FirebaseFirestore.Query = db
        .collection('businesses')
        .doc(req.businessId)
        .collection('timeEntries')
        .where('clockInAt', '>=', startDate)
        .where('clockInAt', '<=', endDate);
      
      // Apply additional filters if specified
      if (reportQuery.userId) {
        entriesQuery = entriesQuery.where('userId', '==', reportQuery.userId);
      }
      if (reportQuery.locationId) {
        entriesQuery = entriesQuery.where('locationId', '==', reportQuery.locationId);
      }
      
      entriesSnapshot = await entriesQuery.get();
    } catch (error: any) {
      // If composite index error, fall back to fetching all and filtering client-side
      if (error.code === 9 || error.message?.includes('index')) {
        console.warn('Composite index missing, falling back to client-side filtering:', error.message);
        try {
          entriesSnapshot = await db
            .collection('businesses')
            .doc(req.businessId)
            .collection('timeEntries')
            .get();
        } catch (fallbackError: any) {
          console.error('Failed to fetch time entries:', fallbackError);
          return res.status(500).json({
            error: 'Failed to fetch time entries',
            message: fallbackError.message,
          });
        }
      } else {
        console.error('Failed to fetch time entries:', error);
        return res.status(500).json({
          error: 'Failed to fetch time entries',
          message: error.message,
        });
      }
    }

    function toDateSafe(val: unknown): Date | null {
      if (!val) return null;
      if (typeof (val as any).toDate === 'function') return (val as any).toDate();
      if (val instanceof Date) return isNaN((val as Date).getTime()) ? null : (val as Date);
      const d = new Date(val as string | number);
      return isNaN(d.getTime()) ? null : d;
    }

    const entriesByUser = new Map<string, TimeEntryData[]>();
    const locationIds = new Set<string>();

    for (const entryDoc of entriesSnapshot.docs) {
      try {
        const entry = entryDoc.data();
        if (!entry.userId) continue;

        if (reportQuery.userId && entry.userId !== reportQuery.userId) continue;
        if (reportQuery.locationId && entry.locationId !== reportQuery.locationId) continue;
        if (!entry.clockOutAt) continue;

        const clockIn = toDateSafe(entry.clockInAt);
        const clockOut = toDateSafe(entry.clockOutAt);
        if (!clockIn || !clockOut) continue;

        if (clockIn < startDate || clockIn > endDate) continue;

        if (!entriesByUser.has(entry.userId)) {
          entriesByUser.set(entry.userId, []);
        }

        const timeEntry: TimeEntryData = {
          id: entryDoc.id,
          userId: entry.userId,
          locationId: entry.locationId,
          clockInAt: clockIn,
          clockOutAt: clockOut,
          notes: entry.notes || null,
        };

        entriesByUser.get(entry.userId)!.push(timeEntry);
        locationIds.add(entry.locationId);
      } catch (error) {
        console.error('Error processing entry:', entryDoc.id, error);
      }
    }

    // Fetch all workers for the business so the report includes everyone, not only
    // workers with completed entries (fixes "only one user" / "not populating others' hours").
    let workersSnapshot;
    try {
      workersSnapshot = await db
        .collection('users')
        .where('businessId', '==', req.businessId)
        .get();
    } catch (error: any) {
      console.error('Failed to fetch workers:', error);
      return res.status(500).json({
        error: 'Failed to fetch workers',
        message: error.message,
      });
    }

    const allWorkers = workersSnapshot.docs
      .filter((d) => (d.data().role as string) === 'WORKER')
      .map((d) => ({ id: d.id, ...d.data() } as { id: string; firstName?: string; lastName?: string }));

    let workers = allWorkers;
    if (reportQuery.userId) {
      workers = allWorkers.filter((w) => w.id === reportQuery.userId);
    }

    const report: PayrollReportRow[] = [];
    const locationNamesCache = new Map<string, string>();

    // Batch fetch all location names at once (fixes N+1 query problem)
    const idsToFetch = Array.from(new Set(locationIds)).filter(Boolean);
    if (reportQuery.locationId && !idsToFetch.includes(reportQuery.locationId)) {
      idsToFetch.push(reportQuery.locationId);
    }
    
    if (idsToFetch.length > 0) {
      const locationRefs = idsToFetch.map(locId => 
        db.collection('businesses').doc(req.businessId!).collection('locations').doc(locId)
      );
      
      try {
        const locationDocs = await db.getAll(...locationRefs);
        locationDocs.forEach((doc, index) => {
          if (doc.exists) {
            const locId = idsToFetch[index];
            locationNamesCache.set(locId, doc.data()?.name || 'Unknown Location');
          }
        });
      } catch (error) {
        console.warn('Failed to batch fetch locations, falling back to individual fetches:', error);
        // Fallback to individual fetches if batch fails
        await Promise.all(idsToFetch.map(async (locId) => {
          if (locId) {
            const name = await getLocationName(req.businessId!, locId);
            locationNamesCache.set(locId, name);
          }
        }));
      }
    }

    // Batch fetch pay rates for all workers to avoid N+1 queries
    const payRatePromises = workers.map(async (worker) => {
      const userId = worker.id;
      const entries = entriesByUser.get(userId) ?? [];
      
      // Get earliest entry date for pay rate lookup
      const earliestEntry = entries.length > 0 
        ? entries.reduce((earliest, entry) => 
            entry.clockInAt < earliest.clockInAt ? entry : earliest
          )
        : null;
      
      const effectiveDate = earliestEntry?.clockInAt || startDate;
      
      // Calculate payroll (this will fetch pay rate internally)
      const calculation = await calculatePayroll(db, req.businessId!, userId, entries);
      
      return { worker, entries, calculation };
    });
    
    const workerCalculations = await Promise.all(payRatePromises);
    
    for (const { worker, entries, calculation } of workerCalculations) {
      const userId = worker.id;

      const firstEntry = entries[0];
      const locationId = reportQuery.locationId ?? firstEntry?.locationId;
      const locationName = reportQuery.locationId
        ? (locationId ? locationNamesCache.get(locationId) ?? 'Unknown Location' : undefined)
        : firstEntry
          ? locationNamesCache.get(firstEntry.locationId) ?? 'Unknown Location'
          : undefined;

      const workerName =
        [worker.firstName, worker.lastName].filter(Boolean).join(' ').trim() || 'Unknown Worker';

      report.push({
        userId,
        worker: workerName,
        locationId,
        locationName,
        regularHours: calculation.regularHours,
        overtimeHours: calculation.overtimeHours,
        doubleTimeHours: calculation.doubleTimeHours,
        totalHours: calculation.totalHours,
        hourlyRate: calculation.hourlyRate,
        grossPay: calculation.grossPay,
        entryCount: entries.length,
        entries: req.query.includeDetails === 'true' ? entries : undefined,
      });
    }

    // Sort report by worker name
    report.sort((a, b) => a.worker.localeCompare(b.worker));

    // Calculate summary totals
    const summary: PayrollReportSummary = {
      totalHours: report.reduce((sum, row) => sum + row.totalHours, 0),
      totalRegularHours: report.reduce((sum, row) => sum + row.regularHours, 0),
      totalOvertimeHours: report.reduce((sum, row) => sum + row.overtimeHours, 0),
      totalDoubleTimeHours: report.reduce((sum, row) => sum + row.doubleTimeHours, 0),
      totalGrossPay: report.reduce((sum, row) => sum + row.grossPay, 0),
      workerCount: report.length,
      locationCount: new Set(report.map((r) => r.locationId).filter(Boolean)).size,
      reportId: generateReportId({
        startDate: reportQuery.startDate,
        endDate: reportQuery.endDate,
        userId: reportQuery.userId,
        locationId: reportQuery.locationId,
      }),
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };

    // Generate AI insights if enabled
    let insights = null;
    if (process.env.GOOGLE_AI_API_KEY) {
      try {
        insights = await generatePayrollInsights(report, startDate, endDate);
      } catch (error) {
        console.error('AI insights error:', error);
      }
    }

    // Log audit entry
    await logAuditEntry({
      businessId: req.businessId,
      userId: req.userId,
      action: 'report_generated',
      reportType: 'payroll',
      filters: {
        startDate: reportQuery.startDate,
        endDate: reportQuery.endDate,
        userId: reportQuery.userId,
        locationId: reportQuery.locationId,
      },
      reportId: summary.reportId,
      timestamp: new Date(),
      metadata: {
        workerCount: summary.workerCount,
        totalHours: summary.totalHours,
        totalGrossPay: summary.totalGrossPay,
      },
    });

    // Handle CSV export
    const exportFormat = req.query.format as string | undefined;
    if (exportFormat === 'csv' || exportFormat === 'csv_summary') {
      // Log CSV export audit
      await logAuditEntry({
        businessId: req.businessId,
        userId: req.userId,
        action: 'report_exported',
        reportType: 'payroll',
        filters: {
          startDate: reportQuery.startDate,
          endDate: reportQuery.endDate,
          userId: reportQuery.userId,
          locationId: reportQuery.locationId,
        },
        reportId: summary.reportId,
        format: 'csv_summary',
        timestamp: new Date(),
      });

      const csv = generateSummaryCSV(report, summary);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payroll-summary-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    }

    if (exportFormat === 'csv_detailed') {
      // Log CSV export audit
      await logAuditEntry({
        businessId: req.businessId,
        userId: req.userId,
        action: 'report_exported',
        reportType: 'payroll',
        filters: {
          startDate: reportQuery.startDate,
          endDate: reportQuery.endDate,
          userId: reportQuery.userId,
          locationId: reportQuery.locationId,
        },
        reportId: summary.reportId,
        format: 'csv_detailed',
        timestamp: new Date(),
      });

      const csv = generateDetailedCSV(report, summary);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payroll-detailed-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    }

    // Return JSON response
    res.json({ 
      report, 
      summary,
      insights 
    });
  } catch (error: any) {
    console.error('Payroll report error:', error);
    res.status(500).json({ 
      error: 'Failed to generate payroll report',
      message: error.message 
    });
  }
});

/**
 * Generate summary CSV (one row per worker)
 */
function generateSummaryCSV(report: PayrollReportRow[], summary: PayrollReportSummary): string {
  const rows = [
    [
      'Worker',
      'Worker ID',
      'Location',
      'Regular Hours',
      'Overtime Hours',
      'Double Time Hours',
      'Total Hours',
      'Hourly Rate',
      'OT Rate',
      'Gross Pay',
      'Entry Count',
    ].join(','),
    ...report.map(row => [
      `"${row.worker}"`,
      row.userId,
      row.locationName ? `"${row.locationName}"` : '',
      row.regularHours.toFixed(2),
      row.overtimeHours.toFixed(2),
      row.doubleTimeHours.toFixed(2),
      row.totalHours.toFixed(2),
      row.hourlyRate > 0 ? row.hourlyRate.toFixed(2) : '',
      row.hourlyRate > 0 ? (row.hourlyRate * 1.5).toFixed(2) : '',
      row.grossPay > 0 ? row.grossPay.toFixed(2) : '',
      row.entryCount,
    ].join(',')),
    '', // Empty row
    [
      'TOTAL',
      '',
      '',
      summary.totalRegularHours.toFixed(2),
      summary.totalOvertimeHours.toFixed(2),
      summary.totalDoubleTimeHours.toFixed(2),
      summary.totalHours.toFixed(2),
      '',
      '',
      summary.totalGrossPay.toFixed(2),
      report.reduce((sum, r) => sum + r.entryCount, 0),
    ].join(','),
  ];

  return rows.join('\n');
}

/**
 * Generate detailed CSV (one row per time entry)
 */
function generateDetailedCSV(report: PayrollReportRow[], summary: PayrollReportSummary): string {
  const rows: string[] = [
    [
      'Worker',
      'Worker ID',
      'Location',
      'Clock In',
      'Clock Out',
      'Hours',
      'Hourly Rate',
      'Pay Type',
      'Gross Pay',
      'Notes',
    ].join(','),
  ];

  for (const row of report) {
    if (!row.entries || row.entries.length === 0) continue;

    for (const entry of row.entries) {
      const hours = entry.clockOutAt
        ? (entry.clockOutAt.getTime() - entry.clockInAt.getTime()) / (1000 * 60 * 60)
        : 0;
      
      // Determine pay type (simplified - would need week context for accurate OT)
      const payType = hours > 8 ? 'OT' : 'Regular';
      const rate = row.hourlyRate;
      const grossPay = hours * rate * (payType === 'OT' ? 1.5 : 1);

      rows.push([
        `"${row.worker}"`,
        row.userId,
        row.locationName ? `"${row.locationName}"` : '',
        entry.clockInAt.toISOString(),
        entry.clockOutAt ? entry.clockOutAt.toISOString() : '',
        hours.toFixed(2),
        rate > 0 ? rate.toFixed(2) : '',
        payType,
        grossPay > 0 ? grossPay.toFixed(2) : '',
        entry.notes ? `"${entry.notes.replace(/"/g, '""')}"` : '',
      ].join(','));
    }
  }

  return rows.join('\n');
}
