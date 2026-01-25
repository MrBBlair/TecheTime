/**
 * Audit logging utility for payroll reports
 */

import { db } from '../firebase/admin.js';
import { Timestamp } from 'firebase-admin/firestore';

export interface AuditLogEntry {
  businessId: string;
  userId: string;
  action: 'report_generated' | 'report_exported';
  reportType: 'payroll';
  filters: Record<string, any>;
  reportId?: string;
  format?: 'json' | 'csv_summary' | 'csv_detailed';
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Log an audit entry for report generation or export
 */
export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  try {
    await db
      .collection('businesses')
      .doc(entry.businessId)
      .collection('auditLogs')
      .add({
        ...entry,
        timestamp: Timestamp.fromDate(entry.timestamp),
        createdAt: Timestamp.now(),
      });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Failed to log audit entry:', error);
  }
}

/**
 * Generate a report ID/hash from filters
 */
export function generateReportId(filters: Record<string, any>): string {
  const filterString = JSON.stringify(filters, Object.keys(filters).sort());
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < filterString.length; i++) {
    const char = filterString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `report_${Math.abs(hash).toString(36)}_${Date.now()}`;
}
