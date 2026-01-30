/**
 * Worker Dashboard - View own time entries, hours, and pay
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { FloatingBackground } from '../components/FloatingBackground';
import { Logo } from '../components/Logo';
import { Clock, Calendar, DollarSign, User, LogOut, Settings, Download, FileText } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export function WorkerDashboard() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState(() => {
    // Default to current month
    const now = new Date();
    return {
      startDate: format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd'),
    };
  });
  const [viewMode, setViewMode] = useState<'entries' | 'weekly' | 'monthly' | 'paystub'>('entries');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Fetch own time entries
  const { data: entriesData, isLoading } = useQuery({
    queryKey: ['time-entries', dateRange.startDate, dateRange.endDate, userData?.id],
    queryFn: () =>
      api.getTimeEntries({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        userId: userData?.id,
      }),
    enabled: !!userData?.id,
  });

  // Fetch own payroll summaries
  const { data: summariesData } = useQuery({
    queryKey: ['payroll-summaries', dateRange.startDate, dateRange.endDate, userData?.id],
    queryFn: () =>
      api.getPayrollSummaries({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        userId: userData?.id,
      }),
    enabled: !!userData?.id,
  });

  const entries = entriesData?.entries || [];
  const summaries = summariesData?.summaries || [];

  // Calculate totals
  const totals = summaries.reduce(
    (acc, s) => ({
      totalHours: acc.totalHours + (s.totalHours || 0),
      totalPay: acc.totalPay + (s.totalPay || 0),
    }),
    { totalHours: 0, totalPay: 0 }
  );

  // Get current pay rate
  const currentPayRate = userData?.payRates?.[0]
    ? userData.payRates.sort(
        (a: { effectiveDate: string }, b: { effectiveDate: string }) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
      )[0]
    : null;

  // Group entries by week
  const weeklyBreakdown = useMemo(() => {
    if (!entries.length) return [];
    const weeks: Record<string, { entries: typeof entries; totalHours: number; totalPay: number }> = {};
    
    entries.forEach((entry) => {
      if (!entry.clockOutAt) return;
      const date = new Date(entry.clockInAt);
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { entries: [], totalHours: 0, totalPay: 0 };
      }
      
      weeks[weekKey].entries.push(entry);
      weeks[weekKey].totalHours += entry.calculatedHours || 0;
      weeks[weekKey].totalPay += entry.calculatedPay || 0;
    });
    
    return Object.entries(weeks)
      .map(([weekStart, data]) => ({
        weekStart,
        weekEnd: format(endOfWeek(new Date(weekStart), { weekStartsOn: 0 }), 'yyyy-MM-dd'),
        ...data,
      }))
      .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
  }, [entries]);

  // Group entries by month
  const monthlyBreakdown = useMemo(() => {
    if (!entries.length) return [];
    const months: Record<string, { entries: typeof entries; totalHours: number; totalPay: number }> = {};
    
    entries.forEach((entry) => {
      if (!entry.clockOutAt) return;
      const date = new Date(entry.clockInAt);
      const monthStart = startOfMonth(date);
      const monthKey = format(monthStart, 'yyyy-MM-dd');
      
      if (!months[monthKey]) {
        months[monthKey] = { entries: [], totalHours: 0, totalPay: 0 };
      }
      
      months[monthKey].entries.push(entry);
      months[monthKey].totalHours += entry.calculatedHours || 0;
      months[monthKey].totalPay += entry.calculatedPay || 0;
    });
    
    return Object.entries(months)
      .map(([monthStart, data]) => ({
        monthStart,
        monthEnd: format(endOfMonth(new Date(monthStart)), 'yyyy-MM-dd'),
        ...data,
      }))
      .sort((a, b) => new Date(b.monthStart).getTime() - new Date(a.monthStart).getTime());
  }, [entries]);

  // CSV Export
  const exportToCSV = () => {
    const headers = ['Date', 'Clock In', 'Clock Out', 'Hours', 'Pay ($)'];
    const rows = entries
      .filter((e) => e.clockOutAt)
      .map((entry) => {
        const clockIn = new Date(entry.clockInAt);
        const clockOut = entry.clockOutAt ? new Date(entry.clockOutAt) : null;
        return [
          format(clockIn, 'yyyy-MM-dd'),
          formatInTimeZone(clockIn, entry.locationTimezone, 'HH:mm:ss'),
          clockOut ? formatInTimeZone(clockOut, entry.locationTimezone, 'HH:mm:ss') : '',
          (entry.calculatedHours || 0).toFixed(2),
          ((entry.calculatedPay || 0) / 100).toFixed(2),
        ];
      });
    
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-entries-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get pay stub data for selected period
  const getPayStubData = () => {
    const completedEntries = entries.filter((e) => e.clockOutAt);
    const regularHours = summaries.reduce((sum, s) => sum + (s.regularHours || 0), 0);
    const overtimeHours = summaries.reduce((sum, s) => sum + (s.overtimeHours || 0), 0);
    const doubleTimeHours = summaries.reduce((sum, s) => sum + (s.doubleTimeHours || 0), 0);
    
    return {
      period: `${dateRange.startDate} to ${dateRange.endDate}`,
      employeeName: userData?.displayName || 'N/A',
      payRate: currentPayRate ? (currentPayRate.amount / 100).toFixed(2) : 'N/A',
      regularHours,
      overtimeHours,
      doubleTimeHours,
      totalHours: totals.totalHours,
      totalPay: totals.totalPay,
      entries: completedEntries,
    };
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <FloatingBackground />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="container-padding py-4">
            <div className="flex items-center justify-between">
              <Logo variant="kioskBackground" className="w-16 h-16" />
              <div className="flex items-center gap-4">
                <Link
                  to="/profile"
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Profile"
                >
                  <User className="w-6 h-6" />
                </Link>
                <Link
                  to="/settings"
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-6 h-6" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container-padding section-spacing">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-semibold text-gray-900 mb-2">
                Welcome{userData?.displayName ? `, ${userData.displayName}` : ''}
              </h1>
              <p className="text-gray-600">View your time entries and earnings</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Hours</p>
                    <p className="text-3xl font-semibold text-gray-900">
                      {totals.totalHours.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {dateRange.startDate} to {dateRange.endDate}
                    </p>
                  </div>
                  <Clock className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                    <p className="text-3xl font-semibold text-gray-900">
                      ${(totals.totalPay / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">This period</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pay Rate</p>
                    <p className="text-3xl font-semibold text-gray-900">
                      {currentPayRate ? `$${(currentPayRate.amount / 100).toFixed(2)}` : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Per hour</p>
                  </div>
                  <Calendar className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
              
              {/* View Mode Tabs */}
              <div className="flex items-center gap-2 border-b border-gray-200 mb-4">
                <button
                  onClick={() => setViewMode('entries')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    viewMode === 'entries'
                      ? 'text-brand-purple border-b-2 border-brand-purple'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Time Entries
                </button>
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    viewMode === 'weekly'
                      ? 'text-brand-purple border-b-2 border-brand-purple'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Weekly Breakdown
                </button>
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    viewMode === 'monthly'
                      ? 'text-brand-purple border-b-2 border-brand-purple'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly Breakdown
                </button>
                <button
                  onClick={() => setViewMode('paystub')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    viewMode === 'paystub'
                      ? 'text-brand-purple border-b-2 border-brand-purple'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pay Stub
                </button>
              </div>

              {/* Date Range Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Content based on view mode */}
            {viewMode === 'entries' && (
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-900">Time Entries</h2>
                </div>

                {isLoading ? (
                  <div className="p-8 text-center text-gray-600">Loading...</div>
                ) : entries.length === 0 ? (
                  <div className="p-8 text-center">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No time entries found for the selected date range.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {entries
                      .filter((e) => e.clockOutAt)
                      .map((entry) => {
                        const clockIn = new Date(entry.clockInAt);
                        const clockOut = entry.clockOutAt ? new Date(entry.clockOutAt) : null;
                        const dateStr = format(clockIn, 'yyyy-MM-dd');
                        const clockInTime = formatInTimeZone(
                          clockIn,
                          entry.locationTimezone,
                          'HH:mm:ss'
                        );
                        const clockOutTime = clockOut
                          ? formatInTimeZone(clockOut, entry.locationTimezone, 'HH:mm:ss')
                          : null;

                        return (
                          <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">{dateStr}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {clockInTime} - {clockOutTime || 'In Progress'}
                                </p>
                                {entry.calculatedHours && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {entry.calculatedHours.toFixed(2)} hours
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                {entry.calculatedPay && (
                                  <p className="text-lg font-semibold text-gray-900">
                                    ${(entry.calculatedPay / 100).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {viewMode === 'weekly' && (
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-900">Weekly Breakdown</h2>
                </div>
                {weeklyBreakdown.length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No weekly data available.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {weeklyBreakdown.map((week) => (
                      <div key={week.weekStart} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Week of {format(new Date(week.weekStart), 'MMM d, yyyy')}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {week.entries.length} shift{week.entries.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              ${(week.totalPay / 100).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">{week.totalHours.toFixed(2)} hours</p>
                          </div>
                        </div>
                        {/* Simple bar chart */}
                        <div className="mt-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                              <div
                                className="bg-brand-purple h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min((week.totalHours / 40) * 100, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-16 text-right">
                              {week.totalHours.toFixed(1)}h
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {viewMode === 'monthly' && (
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-900">Monthly Breakdown</h2>
                </div>
                {monthlyBreakdown.length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No monthly data available.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {monthlyBreakdown.map((month) => (
                      <div key={month.monthStart} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {format(new Date(month.monthStart), 'MMMM yyyy')}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {month.entries.length} shift{month.entries.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              ${(month.totalPay / 100).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">{month.totalHours.toFixed(2)} hours</p>
                          </div>
                        </div>
                        {/* Simple bar chart */}
                        <div className="mt-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                              <div
                                className="bg-brand-purple h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min((month.totalHours / 160) * 100, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-16 text-right">
                              {month.totalHours.toFixed(1)}h
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {viewMode === 'paystub' && (
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Pay Stub
                  </h2>
                </div>
                <div className="p-6">
                  {(() => {
                    const payStub = getPayStubData();
                    return (
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="border-b border-gray-200 pb-4">
                          <h3 className="text-xl font-semibold text-gray-900">Pay Period</h3>
                          <p className="text-gray-600">{payStub.period}</p>
                          <p className="text-sm text-gray-500 mt-1">Employee: {payStub.employeeName}</p>
                        </div>

                        {/* Earnings Summary */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Earnings Summary</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Regular Hours:</span>
                              <span className="font-medium">{payStub.regularHours.toFixed(2)}</span>
                            </div>
                            {payStub.overtimeHours > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Overtime Hours:</span>
                                <span className="font-medium">{payStub.overtimeHours.toFixed(2)}</span>
                              </div>
                            )}
                            {payStub.doubleTimeHours > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Double Time Hours:</span>
                                <span className="font-medium">{payStub.doubleTimeHours.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-gray-200">
                              <span className="font-semibold text-gray-900">Total Hours:</span>
                              <span className="font-semibold text-gray-900">{payStub.totalHours.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Pay Details */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Pay Details</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Pay Rate:</span>
                              <span className="font-medium">${payStub.payRate}/hr</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-200">
                              <span className="font-semibold text-gray-900 text-lg">Total Pay:</span>
                              <span className="font-semibold text-gray-900 text-lg">
                                ${(payStub.totalPay / 100).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Shift Count */}
                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            Total Shifts: <span className="font-medium">{payStub.entries.length}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
