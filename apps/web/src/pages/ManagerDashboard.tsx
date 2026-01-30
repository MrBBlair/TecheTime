/**
 * Manager Dashboard - View team time entries and manage staff
 */

import { useState, useMemo, Fragment } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { FloatingBackground } from '../components/FloatingBackground';
import { Logo } from '../components/Logo';
import { Clock, Users as UsersIcon, FileText, Settings, LogOut, User, Plus, Edit, DollarSign, TrendingUp, Search, Download, BarChart3, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { AddStaffModal } from '../components/AddStaffModal';
import { EditStaffModal } from '../components/EditStaffModal';

export function ManagerDashboard() {
  const { userData, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'all'>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [reportView, setReportView] = useState<'entries' | 'performance' | 'attendance'>('entries');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Fetch users (team members)
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    enabled: !!userData?.businessId,
  });

  // Fetch locations
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => api.getLocations(),
    enabled: !!userData?.businessId,
  });

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'week':
        return {
          startDate: format(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd'),
        };
      case 'month':
        return {
          startDate: format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd'),
        };
      default:
        return {
          startDate: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'), // Start of year
          endDate: format(now, 'yyyy-MM-dd'),
        };
    }
  };

  const dateRange = getDateRange();

  // Fetch time entries
  const { data: entriesData } = useQuery({
    queryKey: ['time-entries', dateRange.startDate, dateRange.endDate, selectedUserId],
    queryFn: () =>
      api.getTimeEntries({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        userId: selectedUserId || undefined,
      }),
    enabled: !!userData?.businessId,
  });

  // Fetch payroll summaries for summary stats
  const { data: summariesData } = useQuery({
    queryKey: ['payroll-summaries', dateRange.startDate, dateRange.endDate],
    queryFn: () =>
      api.getPayrollSummaries({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
    enabled: !!userData?.businessId,
  });

  const users = usersData?.users || [];
  const locations = locationsData?.locations || [];
  const allEntries = entriesData?.entries || [];
  const summaries = summariesData?.summaries || [];
  const workers = users.filter((u: any) => u.role === 'WORKER');
  const managers = users.filter((u: any) => u.role === 'MANAGER');

  // Filter entries by search query
  const filteredEntries = allEntries.filter((e: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      e.userName?.toLowerCase().includes(query) ||
      e.id?.toLowerCase().includes(query)
    );
  });

  // Get active clock-ins (entries without clockOutAt)
  const activeClockIns = allEntries.filter((e: any) => !e.clockOutAt);

  // Calculate totals from summaries
  const totals = summaries.reduce(
    (acc, s) => ({
      totalHours: acc.totalHours + (s.totalHours || 0),
      totalPay: acc.totalPay + (s.totalPay || 0),
    }),
    { totalHours: 0, totalPay: 0 }
  );

  const handleEditStaff = (user: any) => {
    setEditingUser(user);
  };

  const handleDeleteStaff = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    setEditingUser(null);
  };

  // Calculate team performance metrics
  const teamPerformance = useMemo(() => {
    const userStats: Record<string, { name: string; hours: number; pay: number; shifts: number; avgHours: number }> = {};
    
    allEntries.forEach((entry: any) => {
      if (!entry.clockOutAt) return;
      const userId = entry.userId;
      if (!userStats[userId]) {
        userStats[userId] = { name: entry.userName, hours: 0, pay: 0, shifts: 0, avgHours: 0 };
      }
      userStats[userId].hours += entry.calculatedHours || 0;
      userStats[userId].pay += entry.calculatedPay || 0;
      userStats[userId].shifts += 1;
    });
    
    Object.values(userStats).forEach((stat) => {
      stat.avgHours = stat.shifts > 0 ? stat.hours / stat.shifts : 0;
    });
    
    return Object.values(userStats).sort((a, b) => b.hours - a.hours);
  }, [allEntries]);

  // Calculate attendance metrics
  const attendanceMetrics = useMemo(() => {
    const userAttendance: Record<string, { name: string; totalShifts: number; completedShifts: number; activeShifts: number }> = {};
    
    allEntries.forEach((entry: any) => {
      const userId = entry.userId;
      if (!userAttendance[userId]) {
        userAttendance[userId] = { name: entry.userName, totalShifts: 0, completedShifts: 0, activeShifts: 0 };
      }
      userAttendance[userId].totalShifts += 1;
      if (entry.clockOutAt) {
        userAttendance[userId].completedShifts += 1;
      } else {
        userAttendance[userId].activeShifts += 1;
      }
    });
    
    return Object.values(userAttendance);
  }, [allEntries]);

  // Export team data to CSV
  const exportTeamCSV = () => {
    const headers = ['Employee', 'Total Hours', 'Total Pay ($)', 'Shifts', 'Avg Hours/Shift'];
    const rows = teamPerformance.map((stat) => [
      stat.name,
      stat.hours.toFixed(2),
      (stat.pay / 100).toFixed(2),
      stat.shifts.toString(),
      stat.avgHours.toFixed(2),
    ]);
    
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-performance-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export time entries CSV
  const exportEntriesCSV = () => {
    const headers = ['Date', 'Employee', 'Clock In', 'Clock Out', 'Hours', 'Pay ($)'];
    const rows = filteredEntries
      .filter((e: any) => e.clockOutAt)
      .map((entry: any) => {
        const clockIn = new Date(entry.clockInAt);
        const clockOut = entry.clockOutAt ? new Date(entry.clockOutAt) : null;
        return [
          format(clockIn, 'yyyy-MM-dd'),
          entry.userName,
          format(clockIn, 'HH:mm'),
          clockOut ? format(clockOut, 'HH:mm') : '',
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

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <FloatingBackground />

      {/* Add Staff Modal */}
      {showAddStaff && (
        <AddStaffModal
          locations={locations}
          onClose={() => setShowAddStaff(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}

      {/* Edit Staff Modal */}
      {editingUser && (
        <EditStaffModal
          user={editingUser}
          locations={locations}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['payroll-summaries'] });
            setEditingUser(null);
          }}
          onDelete={handleDeleteStaff}
        />
      )}

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
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-semibold text-gray-900 mb-2">
                Welcome{userData?.displayName ? `, ${userData.displayName}` : ''}
              </h1>
              <p className="text-gray-600">Manage your team and view time entries</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Team Members</p>
                    <p className="text-3xl font-semibold text-gray-900">{workers.length}</p>
                    <p className="text-xs text-gray-500 mt-1">{managers.length} manager{managers.length !== 1 ? 's' : ''}</p>
                  </div>
                  <UsersIcon className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Clock-Ins</p>
                    <p className="text-3xl font-semibold text-gray-900">{activeClockIns.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Currently working</p>
                  </div>
                  <Clock className="w-12 h-12 text-green-500/20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Hours</p>
                    <p className="text-3xl font-semibold text-gray-900">{totals.totalHours.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {dateFilter === 'week' ? 'This week' : dateFilter === 'month' ? 'This month' : 'This year'}
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
              <Link
                to="/payroll-reports"
                className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-brand-purple transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Pay</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${(totals.totalPay / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">View Reports</p>
                  </div>
                  <FileText className="w-12 h-12 text-brand-purple/20" />
                </div>
              </Link>
            </div>

            {/* Active Clock-Ins */}
            {activeClockIns.length > 0 && (
              <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-green-500" />
                    Active Clock-Ins ({activeClockIns.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {activeClockIns.map((entry: any) => {
                    const clockIn = new Date(entry.clockInAt);
                    const hoursSince = (Date.now() - clockIn.getTime()) / (1000 * 60 * 60);
                    return (
                      <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{entry.userName}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Clocked in: {format(clockIn, 'MMM d, yyyy HH:mm')}
                            </p>
                            <p className="text-sm text-green-600 mt-1 font-medium">
                              {hoursSince.toFixed(1)} hours active
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-sm text-gray-500">Active</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Team Management */}
            <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">Team Members</h2>
                <button
                  onClick={() => setShowAddStaff(true)}
                  disabled={locations.length === 0}
                  className="touch-target px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                  Add Staff
                </button>
              </div>

              {usersLoading ? (
                <div className="p-8 text-center text-gray-600">Loading...</div>
              ) : workers.length === 0 ? (
                <div className="p-8 text-center">
                  <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No team members yet</p>
                  <button
                    onClick={() => setShowAddStaff(true)}
                    disabled={locations.length === 0}
                    className="touch-target px-6 py-3 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Your First Team Member
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {workers.map((user: any) => {
                    const userPayRate = user.payRates && user.payRates.length > 0
                      ? [...user.payRates].sort(
                          (a: any, b: any) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
                        )[0]
                      : null;
                    const userLocation = locations.find((l: any) => l.id === user.locationId);
                    const isActive = activeClockIns.some((e: any) => e.userId === user.id);
                    
                    return (
                      <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
                              {isActive && (
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              )}
                            </div>
                            {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
                            {userLocation && (
                              <p className="text-sm text-gray-500 mt-1">
                                Location: {userLocation.name}
                              </p>
                            )}
                            {userPayRate && (
                              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                ${(userPayRate.amount / 100).toFixed(2)}/hr
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              {user.role}
                            </span>
                            <button
                              onClick={() => handleEditStaff(user)}
                              className="p-2 text-gray-400 hover:text-brand-purple transition-colors"
                              aria-label="Edit staff member"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reports Section */}
            <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h2>
                  <div className="flex items-center gap-2">
                    {reportView === 'entries' && (
                      <button
                        onClick={exportEntriesCSV}
                        className="px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Entries
                      </button>
                    )}
                    {reportView === 'performance' && (
                      <button
                        onClick={exportTeamCSV}
                        className="px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Performance
                      </button>
                    )}
                  </div>
                </div>
                {/* Report View Tabs */}
                <div className="flex items-center gap-2 border-b border-gray-200">
                  <button
                    onClick={() => setReportView('entries')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      reportView === 'entries'
                        ? 'text-brand-purple border-b-2 border-brand-purple'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Time Entries
                  </button>
                  <button
                    onClick={() => setReportView('performance')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      reportView === 'performance'
                        ? 'text-brand-purple border-b-2 border-brand-purple'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Team Performance
                  </button>
                  <button
                    onClick={() => setReportView('attendance')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      reportView === 'attendance'
                        ? 'text-brand-purple border-b-2 border-brand-purple'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Attendance
                  </button>
                </div>
              </div>

              {/* Time Entries View */}
              {reportView === 'entries' && (
                <Fragment>
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Time Entries</h3>
                      <div className="flex items-center gap-3">
                        {/* Date Filter */}
                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setDateFilter('week')}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                          dateFilter === 'week'
                            ? 'bg-brand-purple text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => setDateFilter('month')}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                          dateFilter === 'month'
                            ? 'bg-brand-purple text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Month
                      </button>
                      <button
                        onClick={() => setDateFilter('all')}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                          dateFilter === 'all'
                            ? 'bg-brand-purple text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        All
                      </button>
                    </div>
                    {/* Employee Filter */}
                    <div className="relative">
                      <select
                        value={selectedUserId || ''}
                        onChange={(e) => setSelectedUserId(e.target.value || null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                      >
                        <option value="">All Employees</option>
                        {workers.map((u: any) => (
                          <option key={u.id} value={u.id}>
                            {u.displayName}
                          </option>
                        ))}
                      </select>
                      </div>
                    </div>
                  </div>
                    {/* Search */}
                    <div className="relative mt-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search entries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                      />
                    </div>
                  </div>

                  {filteredEntries.length === 0 ? (
                    <div className="p-8 text-center">
                      <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {searchQuery || selectedUserId
                          ? 'No entries match your filters.'
                          : 'No time entries found.'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                      {filteredEntries
                        .filter((e: any) => e.clockOutAt)
                        .sort((a: any, b: any) => {
                          return new Date(b.clockInAt).getTime() - new Date(a.clockInAt).getTime();
                        })
                        .slice(0, 50)
                        .map((entry: any) => {
                          const clockIn = new Date(entry.clockInAt);
                          const clockOut = entry.clockOutAt ? new Date(entry.clockOutAt) : null;
                          const hours = entry.calculatedHours || 0;
                          const pay = entry.calculatedPay || 0;
                          
                          return (
                            <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-gray-900">{entry.userName}</h3>
                                    <span className="text-xs text-gray-500">
                                      {format(clockIn, 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-gray-400" />
                                      <p className="text-sm text-gray-600">
                                        {format(clockIn, 'HH:mm')} - {clockOut ? format(clockOut, 'HH:mm') : 'In Progress'}
                                      </p>
                                    </div>
                                    {hours > 0 && (
                                      <p className="text-sm text-gray-500">
                                        {hours.toFixed(2)} hours
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {pay > 0 && (
                                  <div className="text-right">
                                    <p className="text-lg font-semibold text-gray-900">
                                      ${(pay / 100).toFixed(2)}
                                    </p>
                                    {hours > 0 && (
                                      <p className="text-xs text-gray-500">
                                        ${((pay / 100) / hours).toFixed(2)}/hr
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </Fragment>
              )}

              {/* Team Performance View */}
              {reportView === 'performance' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Team Performance Metrics
                  </h3>
                  {teamPerformance.length === 0 ? (
                    <div className="p-8 text-center">
                      <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No performance data available.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teamPerformance.map((stat, index) => {
                        const maxHours = Math.max(...teamPerformance.map((s) => s.hours));
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">{stat.name}</h4>
                                <p className="text-sm text-gray-500">{stat.shifts} shift{stat.shifts !== 1 ? 's' : ''}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-gray-900">
                                  ${(stat.pay / 100).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500">{stat.hours.toFixed(2)} hours</p>
                              </div>
                            </div>
                            {/* Performance bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-brand-purple h-full rounded-full transition-all"
                                  style={{
                                    width: `${maxHours > 0 ? (stat.hours / maxHours) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 w-20 text-right">
                                Avg: {stat.avgHours.toFixed(1)}h/shift
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Attendance View */}
              {reportView === 'attendance' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Attendance Tracking
                  </h3>
                  {attendanceMetrics.length === 0 ? (
                    <div className="p-8 text-center">
                      <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No attendance data available.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {attendanceMetrics.map((metric, index) => {
                        const completionRate = metric.totalShifts > 0
                          ? (metric.completedShifts / metric.totalShifts) * 100
                          : 0;
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">{metric.name}</h4>
                                <p className="text-sm text-gray-500">
                                  {metric.activeShifts > 0 && (
                                    <span className="text-green-600 font-medium">
                                      {metric.activeShifts} active shift{metric.activeShifts !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-gray-900">
                                  {metric.completedShifts}/{metric.totalShifts}
                                </p>
                                <p className="text-sm text-gray-500">Completed</p>
                              </div>
                            </div>
                            {/* Attendance bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-green-500 h-full rounded-full transition-all"
                                  style={{ width: `${completionRate}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 w-16 text-right">
                                {completionRate.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
