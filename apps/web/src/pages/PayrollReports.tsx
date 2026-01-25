import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format, subDays } from 'date-fns';
import type { Location, User } from '@techetime/shared';

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
  entries?: Array<{
    id: string;
    userId: string;
    locationId: string;
    clockInAt: string;
    clockOutAt: string | null;
    notes?: string | null;
  }>;
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

type SortField = 'worker' | 'totalHours' | 'hourlyRate' | 'grossPay';
type SortDirection = 'asc' | 'desc';

export default function PayrollReports() {
  const { user, getAuthHeaders, selectedBusinessId } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [report, setReport] = useState<PayrollReportRow[]>([]);
  const [summary, setSummary] = useState<PayrollReportSummary | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('worker');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [includeDetails, setIncludeDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, selectedBusinessId]);

  // Listen for business changes
  useEffect(() => {
    const handleBusinessChange = () => {
      loadData();
    };
    window.addEventListener('businessChanged', handleBusinessChange);
    return () => window.removeEventListener('businessChanged', handleBusinessChange);
  }, []);

  async function loadData() {
    if (!user) return;
    const headers: HeadersInit = {};
    const authHeaders = await getAuthHeaders();
    Object.assign(headers, authHeaders);
    try {
      const [locRes, workerRes] = await Promise.all([
        fetch('/api/admin/locations', { headers }),
        fetch('/api/admin/users', { headers }),
      ]);
      if (locRes.ok) setLocations((await locRes.json()).filter((l: Location) => l.isActive));
      else setLocations([]);
      if (workerRes.ok) setWorkers((await workerRes.json()).filter((u: User) => u.role === 'WORKER'));
      else setWorkers([]);
    } catch (e) {
      console.error('Failed to load payroll data:', e);
      setLocations([]);
      setWorkers([]);
    }
  }

  function validateDates(): string | null {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Please select valid dates';
    }
    
    if (start > end) {
      return 'Start date must be before or equal to end date';
    }
    
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      return 'Date range cannot exceed 90 days. Please select a smaller range.';
    }
    
    return null;
  }

  async function generateReport() {
    const validationError = validateDates();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      const authHeaders = await getAuthHeaders();
      Object.assign(headers, authHeaders);
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      if (selectedLocation) params.append('locationId', selectedLocation);
      if (selectedWorker) params.append('userId', selectedWorker);
      if (includeDetails) params.append('includeDetails', 'true');

      const res = await fetch(`/api/reports/payroll?${params}`, { headers });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to generate report' }));
        throw new Error(errorData.error || errorData.message || 'Failed to generate report');
      }
      
      const data = await res.json();
      setReport(data.report || []);
      setSummary(data.summary || null);
      setInsights(data.insights || null);
      setExpandedRows(new Set()); // Reset expanded rows
    } catch (err: any) {
      setError(err.message || 'Failed to generate payroll report');
      setReport([]);
      setSummary(null);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }

  async function exportCSV(format: 'csv_summary' | 'csv_detailed' = 'csv_summary') {
    const validationError = validateDates();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    try {
      const headers: HeadersInit = {};
      const authHeaders = await getAuthHeaders();
      Object.assign(headers, authHeaders);
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        format,
      });
      if (selectedLocation) params.append('locationId', selectedLocation);
      if (selectedWorker) params.append('userId', selectedWorker);

      const res = await fetch(`/api/reports/payroll?${params}`, { headers });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to export CSV' }));
        throw new Error(errorData.error || errorData.message || 'Failed to export CSV');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const formatLabel = format === 'csv_summary' ? 'summary' : 'detailed';
      a.download = `payroll-${formatLabel}-${startDate}-${endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function toggleRowExpansion(userId: string) {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  }

  // Sort report data
  const sortedReport = [...report].sort((a, b) => {
    let aVal: any, bVal: any;
    
    switch (sortField) {
      case 'worker':
        aVal = a.worker.toLowerCase();
        bVal = b.worker.toLowerCase();
        break;
      case 'totalHours':
        aVal = a.totalHours;
        bVal = b.totalHours;
        break;
      case 'hourlyRate':
        aVal = a.hourlyRate;
        bVal = b.hourlyRate;
        break;
      case 'grossPay':
        aVal = a.grossPay;
        bVal = b.grossPay;
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-white/70">↕</span>;
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-royal-purple">Payroll Reports</h1>
      
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold text-charcoal mb-4">Report Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-charcoal">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-purple"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-charcoal">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-purple"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-charcoal">Location (Optional)</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-purple"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-charcoal">Worker (Optional)</label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-purple"
            >
              <option value="">All Workers</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.firstName} {worker.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="includeDetails"
            checked={includeDetails}
            onChange={(e) => setIncludeDetails(e.target.checked)}
            className="w-4 h-4 text-royal-purple border-gray-300 rounded focus:ring-royal-purple"
          />
          <label htmlFor="includeDetails" className="text-sm text-charcoal">
            Include detailed time entries (slower, but shows individual shifts)
          </label>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={generateReport} 
            disabled={loading} 
            className="btn-primary flex-1 min-w-[140px]"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          <button 
            onClick={() => exportCSV('csv_summary')} 
            disabled={loading || report.length === 0} 
            className="btn-secondary"
          >
            Export Summary CSV
          </button>
          <button 
            onClick={() => exportCSV('csv_detailed')} 
            disabled={loading || report.length === 0} 
            className="btn-secondary"
          >
            Export Detailed CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Hours</h3>
            <p className="text-3xl font-bold text-royal-purple">{summary.totalHours.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.totalRegularHours.toFixed(2)} reg + {summary.totalOvertimeHours.toFixed(2)} OT
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Gross Pay</h3>
            <p className="text-3xl font-bold text-old-gold">${summary.totalGrossPay.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Workers</h3>
            <p className="text-3xl font-bold text-royal-purple">{summary.workerCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Locations</h3>
            <p className="text-3xl font-bold text-royal-purple">{summary.locationCount}</p>
            <p className="text-xs text-gray-500 mt-1">
              Report ID: {summary.reportId.slice(0, 8)}...
            </p>
          </div>
        </div>
      )}

      {/* Report Results */}
      {report.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-charcoal">Report Results</h2>
            {summary && (
              <p className="text-sm text-gray-500">
                Generated: {format(new Date(summary.generatedAt), 'MMM d, yyyy h:mm a')}
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-royal-purple text-white sticky top-0 [&_th]:!text-white [&_th_*]:!text-white">
                <tr>
                  <th className="px-4 py-3 text-left"></th>
                  <th 
                    className="px-4 py-3 text-left cursor-pointer hover:bg-royal-purple/90 select-none"
                    onClick={() => handleSort('worker')}
                  >
                    <div className="flex items-center gap-2">
                      Worker
                      <SortIcon field="worker" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th 
                    className="px-4 py-3 text-left cursor-pointer hover:bg-royal-purple/90 select-none"
                    onClick={() => handleSort('totalHours')}
                  >
                    <div className="flex items-center gap-2">
                      Total Hours
                      <SortIcon field="totalHours" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">Regular</th>
                  <th className="px-4 py-3 text-left">OT</th>
                  <th 
                    className="px-4 py-3 text-left cursor-pointer hover:bg-royal-purple/90 select-none font-semibold"
                    onClick={() => handleSort('hourlyRate')}
                  >
                    <div className="flex items-center gap-2">
                      Hourly Rate
                      <SortIcon field="hourlyRate" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left cursor-pointer hover:bg-royal-purple/90 select-none font-semibold"
                    onClick={() => handleSort('grossPay')}
                  >
                    <div className="flex items-center gap-2">
                      Gross Pay
                      <SortIcon field="grossPay" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {sortedReport.map((row) => (
                  <>
                    <tr 
                      key={row.userId} 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleRowExpansion(row.userId)}
                    >
                      <td className="px-4 py-3 text-charcoal">
                        {row.entries && row.entries.length > 0 ? (
                          expandedRows.has(row.userId) ? '▼' : '▶'
                        ) : ''}
                      </td>
                      <td className="px-4 py-3 text-charcoal font-medium">{row.worker}</td>
                      <td className="px-4 py-3 text-charcoal text-sm">
                        {row.locationName || '—'}
                      </td>
                      <td className="px-4 py-3 text-charcoal">{row.totalHours.toFixed(2)}</td>
                      <td className="px-4 py-3 text-charcoal text-sm">{row.regularHours.toFixed(2)}</td>
                      <td className="px-4 py-3 text-charcoal text-sm">
                        {row.overtimeHours > 0 && (
                          <span className="text-old-gold font-semibold">
                            {row.overtimeHours.toFixed(2)}
                          </span>
                        )}
                        {row.overtimeHours === 0 && '—'}
                      </td>
                      <td className="px-4 py-3 text-charcoal font-medium">
                        {row.hourlyRate > 0 ? `$${row.hourlyRate.toFixed(2)}/hr` : <span className="text-red-500 italic">No rate set</span>}
                      </td>
                      <td className="px-4 py-3 text-old-gold font-bold text-lg">
                        {row.grossPay > 0 ? `$${row.grossPay.toFixed(2)}` : <span className="text-red-500 italic">$0.00</span>}
                      </td>
                    </tr>
                    {expandedRows.has(row.userId) && row.entries && row.entries.length > 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-3 bg-gray-50">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-charcoal mb-2">Time Entries ({row.entries.length})</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left">Date</th>
                                    <th className="px-3 py-2 text-left">Clock In</th>
                                    <th className="px-3 py-2 text-left">Clock Out</th>
                                    <th className="px-3 py-2 text-left">Hours</th>
                                    <th className="px-3 py-2 text-left">Rate</th>
                                    <th className="px-3 py-2 text-left">Gross Pay</th>
                                    <th className="px-3 py-2 text-left">Notes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.entries.map((entry) => {
                                    const clockIn = new Date(entry.clockInAt);
                                    const clockOut = entry.clockOutAt ? new Date(entry.clockOutAt) : null;
                                    const hours = clockOut
                                      ? (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
                                      : 0;
                                    // Calculate gross pay for this entry (simplified - assumes regular rate)
                                    const entryGrossPay = hours * row.hourlyRate;
                                    return (
                                      <tr key={entry.id} className="border-b">
                                        <td className="px-3 py-2">{format(clockIn, 'MMM d, yyyy')}</td>
                                        <td className="px-3 py-2">{format(clockIn, 'h:mm a')}</td>
                                        <td className="px-3 py-2">
                                          {clockOut ? format(clockOut, 'h:mm a') : '—'}
                                        </td>
                                        <td className="px-3 py-2">{hours.toFixed(2)}</td>
                                        <td className="px-3 py-2 font-medium">
                                          {row.hourlyRate > 0 ? `$${row.hourlyRate.toFixed(2)}/hr` : <span className="text-red-500 italic">No rate</span>}
                                        </td>
                                        <td className="px-3 py-2 font-semibold text-old-gold">
                                          {entryGrossPay > 0 ? `$${entryGrossPay.toFixed(2)}` : '$0.00'}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">
                                          {entry.notes || '—'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {/* Summary row for expanded details */}
                                  <tr className="border-t-2 border-gray-300 bg-gray-100 font-semibold">
                                    <td colSpan={3} className="px-3 py-2 text-right">Total:</td>
                                    <td className="px-3 py-2">{row.totalHours.toFixed(2)}</td>
                                    <td className="px-3 py-2">
                                      {row.hourlyRate > 0 ? `$${row.hourlyRate.toFixed(2)}/hr` : <span className="text-red-500 italic">No rate</span>}
                                    </td>
                                    <td className="px-3 py-2 text-old-gold">
                                      {row.grossPay > 0 ? `$${row.grossPay.toFixed(2)}` : '$0.00'}
                                    </td>
                                    <td className="px-3 py-2"></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          {insights && (
            <div className="mt-6 p-4 bg-old-gold/10 border border-old-gold rounded-lg">
              <h3 className="font-semibold mb-2 text-charcoal">AI Insights</h3>
              <p className="text-sm whitespace-pre-wrap text-charcoal">{insights}</p>
            </div>
          )}
        </div>
      ) : !loading && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-500 text-lg">
            {error ? 'Error generating report. Please check your filters and try again.' : 'No report generated yet. Use the filters above to generate a payroll report.'}
          </p>
        </div>
      )}
    </div>
  );
}
