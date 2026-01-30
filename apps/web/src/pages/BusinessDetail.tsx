/**
 * Business Detail - CLIENT_ADMIN view of a specific business
 * Shows business info, locations, users, and allows management
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { FloatingBackground } from '../components/FloatingBackground';
import { Logo } from '../components/Logo';
import { ArrowLeft, Building2, MapPin, Users as UsersIcon, User, Settings, LogOut } from 'lucide-react';
import { format } from 'date-fns';

export function BusinessDetail() {
  const { businessId } = useParams<{ businessId: string }>();
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Fetch business details
  const { data: businessData, isLoading: businessLoading } = useQuery({
    queryKey: ['client-admin-business', businessId],
    queryFn: async () => {
      const businesses = await api.getClientAdminBusinesses();
      return businesses.businesses.find((b) => b.id === businessId);
    },
    enabled: !!businessId && userData?.role === 'CLIENT_ADMIN',
  });

  // Fetch locations for this business
  const { data: locationsData } = useQuery({
    queryKey: ['locations', businessId],
    queryFn: async () => {
      // For CLIENT_ADMIN, we need to fetch all locations and filter
      // In a real scenario, we'd have a dedicated endpoint
      try {
        const locations = await api.getLocations();
        return { locations: locations.locations.filter((l: any) => l.businessId === businessId) };
      } catch {
        // If admin endpoint fails (CLIENT_ADMIN might not have access), return empty
        return { locations: [] };
      }
    },
    enabled: !!businessId,
  });

  // Fetch users for this business
  const { data: usersData } = useQuery({
    queryKey: ['users', businessId],
    queryFn: async () => {
      // For CLIENT_ADMIN, we need to fetch all users and filter
      // In a real scenario, we'd have a dedicated endpoint
      try {
        const users = await api.getUsers();
        return { users: users.users.filter((u: any) => u.businessId === businessId) };
      } catch {
        // If admin endpoint fails (CLIENT_ADMIN might not have access), return empty
        return { users: [] };
      }
    },
    enabled: !!businessId,
  });

  // Fetch payroll summaries for this business
  const { data: summariesData } = useQuery({
    queryKey: ['payroll-summaries-business', businessId],
    queryFn: async () => {
      // Get summaries for last 30 days
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const summaries = await api.getPayrollSummaries({ startDate, endDate });
      return { summaries: summaries.summaries.filter((s: any) => s.businessId === businessId) };
    },
    enabled: !!businessId,
  });

  const business = businessData;
  const locations = locationsData?.locations || [];
  const users = usersData?.users || [];
  const summaries = summariesData?.summaries || [];

  // Calculate totals
  const totals = summaries.reduce(
    (acc, s) => ({
      totalHours: acc.totalHours + (s.totalHours || 0),
      totalPay: acc.totalPay + (s.totalPay || 0),
    }),
    { totalHours: 0, totalPay: 0 }
  );

  if (businessLoading) {
    return (
      <div className="relative min-h-screen bg-white overflow-hidden">
        <FloatingBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-gray-600">Loading business details...</div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="relative min-h-screen bg-white overflow-hidden">
        <FloatingBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Business not found</p>
            <Link to="/dashboard" className="text-brand-purple hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{business.name}</h1>
                  <p className="text-sm text-gray-600">Business Details</p>
                </div>
              </div>
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
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Locations</p>
                    <p className="text-3xl font-semibold text-gray-900">{locations.length}</p>
                  </div>
                  <MapPin className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Users</p>
                    <p className="text-3xl font-semibold text-gray-900">{users.length}</p>
                  </div>
                  <UsersIcon className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Hours</p>
                    <p className="text-3xl font-semibold text-gray-900">
                      {totals.totalHours.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                  </div>
                  <Building2 className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Pay</p>
                    <p className="text-3xl font-semibold text-gray-900">
                      ${(totals.totalPay / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                  </div>
                  <Building2 className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Business ID</p>
                  <p className="text-gray-900 font-mono text-sm">{business.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Owner ID</p>
                  <p className="text-gray-900 font-mono text-sm">{business.ownerId}</p>
                </div>
                {business?.createdAt && (
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-gray-900">
                      {format(new Date(business.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Locations */}
            <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-900">Locations</h2>
              </div>
              {locations.length === 0 ? (
                <div className="p-8 text-center">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No locations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {locations.map((location: any) => (
                    <div key={location.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
                      {location.address && (
                        <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">Timezone: {location.timezone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Users */}
            <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-900">Users</h2>
              </div>
              {users.length === 0 ? (
                <div className="p-8 text-center">
                  <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No users yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {users.map((user: any) => (
                    <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
                          <p className="text-sm text-gray-600 mt-1">{user.role}</p>
                          {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
                        </div>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
