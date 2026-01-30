/**
 * Payroll Reports - View and export payroll summaries and time entries
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { FloatingBackground } from '../components/FloatingBackground';
import { Logo } from '../components/Logo';
import { ArrowLeft, Download, Calendar, FileText, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

type ReportType = 'summary' | 'detailed';

export function PayrollReports() {
  const { userData } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [startDate, setStartDate] = useState(() => {
    // Default to first day of current month
    const now = new Date();
    return format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = useState(() => {
    // Default to today
    return format(new Date(), 'yyyy-MM-dd');
  });
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Fetch users for filter dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    enabled: !!userData?.businessId,
  });

  // Fetch payroll summaries
  const { data: summariesData, isLoading: summariesLoading } = useQuery({
    queryKey: ['payroll-summaries', startDate, endDate, selectedUserId],
    queryFn: () =>
      api.getPayrollSummaries({
        startDate,
        endDate,
        userId: selectedUserId || undefined,
      }),
    enabled: !!userData?.businessId && reportType === 'summary',
  });

  // Fetch time entries
  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['time-entries', startDate, endDate, selectedUserId],
    queryFn: () =>
      api.getTimeEntries({
        startDate,
        endDate,
        userId: selectedUserId || undefined,
      }),
    enabled: !!userData?.businessId && reportType === 'detailed',
  });

  const users = usersData?.users || [];
  const summaries = summariesData?.summaries || [];
  const entries = entriesData?.entries || [];

  // Calculate totals
  const totals = summaries.reduce(
    (acc, s) => ({
      totalHours: acc.totalHours + (s.totalHours || 0),
      totalPay: acc.totalPay + (s.totalPay || 0),
      regularHours: acc.regularHours + (s.regularHours || 0),
      overtimeHours: acc.overtimeHours + (s.overtimeHours || 0),
      doubleTimeHours: acc.doubleTimeHours + (s.doubleTimeHours || 0),
    }),
    {
      totalHours: 0,
      totalPay: 0,
      regularHours: 0,
      overtimeHours: 0,
      doubleTimeHours: 0,
    }
  );

  // CSV Export functions
  const exportSummaryCSV = () => {
    const headers = [
      'Date',
      'Employee',
      'Total Hours',
      'Regular Hours',
      'Overtime Hours',
      'Double Time Hours',
      'Total Pay ($)',
    ];
    const rows = summaries.map((s) => [
      s.date,
      s.userName,
      s.totalHours.toFixed(2),
      (s.regularHours || 0).toFixed(2),
      (s.overtimeHours || 0).toFixed(2),
      (s.doubleTimeHours || 0).toFixed(2),
      (s.totalPay / 100).toFixed(2),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    downloadCSV(csv, `payroll-summary-${startDate}-to-${endDate}.csv`);
  };

  const exportDetailedCSV = () => {
    const headers = [
      'Date',
      'Employee',
      'Clock In',
      'Clock Out',
      'Hours',
      'Pay ($)',
      'Location Timezone',
    ];
    const rows = entries
      .filter((e) => e.clockOutAt) // Only completed shifts
      .map((e) => {
        const clockIn = new Date(e.clockInAt);
        const clockOut = e.clockOutAt ? new Date(e.clockOutAt) : null;
        const date = format(clockIn, 'yyyy-MM-dd');
        const clockInTime = format(clockIn, 'HH:mm:ss');
        const clockOutTime = clockOut ? format(clockOut, 'HH:mm:ss') : '';
        const hours = e.calculatedHours?.toFixed(2) || '';
        const pay = e.calculatedPay ? (e.calculatedPay / 100).toFixed(2) : '';

        return [date, e.userName, clockInTime, clockOutTime, hours, pay, e.locationTimezone];
      });

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    downloadCSV(csv, `payroll-detailed-${startDate}-to-${endDate}.csv`);
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = reportType === 'summary' ? summariesLoading : entriesLoading;

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <FloatingBackground />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="container-padding py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <Logo variant="kioskBackground" className="w-12 h-12" />
                <h1 className="text-xl font-semibold text-gray-900">Payroll Reports</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container-padding section-spacing">
          <div className="max-w-6xl mx-auto">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                  >
                    <option value="summary">Summary (Daily Totals)</option>
                    <option value="detailed">Detailed (All Shifts)</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                  />
                </div>

                {/* Employee Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee (Optional)
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                  >
                    <option value="">All Employees</option>
                    {users.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Export Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={reportType === 'summary' ? exportSummaryCSV : exportDetailedCSV}
                  disabled={isLoading || (reportType === 'summary' ? summaries.length === 0 : entries.length === 0)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Summary Report */}
            {reportType === 'summary' && (
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-brand-purple" />
                    Payroll Summary
                  </h2>
                  {summaries.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Hours</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {totals.totalHours.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Regular Hours</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {totals.regularHours.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Overtime Hours</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {totals.overtimeHours.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Double Time Hours</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {totals.doubleTimeHours.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Pay</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          ${(totals.totalPay / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <div className="p-8 text-center text-gray-600">Loading...</div>
                ) : summaries.length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No payroll data found for the selected date range.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Hours
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Regular
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Overtime
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Double Time
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Pay
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {summaries.map((summary) => (
                          <tr key={summary.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {summary.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {summary.userName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {summary.totalHours.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                              {(summary.regularHours || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                              {(summary.overtimeHours || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                              {(summary.doubleTimeHours || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              ${(summary.totalPay / 100).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Report */}
            {reportType === 'detailed' && (
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-brand-purple" />
                    Detailed Time Entries
                  </h2>
                </div>

                {isLoading ? (
                  <div className="p-8 text-center text-gray-600">Loading...</div>
                ) : entries.length === 0 ? (
                  <div className="p-8 text-center">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No time entries found for the selected date range.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clock In
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clock Out
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hours
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pay
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {entries
                          .filter((e) => e.clockOutAt) // Only show completed shifts
                          .map((entry) => {
                            const clockIn = new Date(entry.clockInAt);
                            const clockOut = entry.clockOutAt ? new Date(entry.clockOutAt) : null;
                            return (
                              <tr key={entry.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {format(clockIn, 'yyyy-MM-dd')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {entry.userName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {format(clockIn, 'HH:mm:ss')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {clockOut ? format(clockOut, 'HH:mm:ss') : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                  {entry.calculatedHours?.toFixed(2) || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                  {entry.calculatedPay ? `$${(entry.calculatedPay / 100).toFixed(2)}` : '-'}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
