/**
 * Super Admin Portal - List businesses and impersonate owners
 * Hidden route: /super-admin (no nav link)
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { api } from '../lib/api';
import { UserCog, LogOut, Building2, AlertCircle, Users, MapPin, RefreshCw } from 'lucide-react';

type BusinessRow = {
  id: string;
  name?: string;
  locationCount: number;
  userCount: number;
  ownerId: string | null;
};

export function SuperAdminPage() {
  const { impersonateUser, logout, userData } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getBusinesses();
        if (!cancelled) {
          setBusinesses(data.businesses);
          setAccessDenied(false);
          setError(null);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Request failed';
        if (msg.includes('403') || msg.includes('Forbidden')) {
          setAccessDenied(true);
          setBusinesses([]);
          setError(null);
        } else {
          setError(msg);
          setAccessDenied(false);
          setBusinesses([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleImpersonate = async (ownerId: string) => {
    if (!ownerId) return;
    setImpersonatingId(ownerId);
    try {
      const { customToken } = await api.impersonate(ownerId);
      await impersonateUser(customToken);
      navigate('/dashboard');
    } catch (e) {
      console.error('Impersonate error:', e);
      setImpersonatingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await api.getBusinesses();
      setBusinesses(data.businesses);
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Request failed';
      setError(msg);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate totals
  const totals = businesses.reduce(
    (acc, b) => ({
      totalBusinesses: acc.totalBusinesses + 1,
      totalLocations: acc.totalLocations + b.locationCount,
      totalUsers: acc.totalUsers + b.userCount,
    }),
    { totalBusinesses: 0, totalLocations: 0, totalUsers: 0 }
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo variant="kioskBackground" className="w-12 h-12" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-sm text-gray-600">
                {userData?.displayName || 'Super Admin'} • Platform Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        {!loading && !accessDenied && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Businesses</p>
                  <p className="text-3xl font-semibold text-gray-900">{totals.totalBusinesses}</p>
                </div>
                <Building2 className="w-12 h-12 text-brand-purple/20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Locations</p>
                  <p className="text-3xl font-semibold text-gray-900">{totals.totalLocations}</p>
                </div>
                <MapPin className="w-12 h-12 text-brand-purple/20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-semibold text-gray-900">{totals.totalUsers}</p>
                </div>
                <Users className="w-12 h-12 text-brand-purple/20" />
              </div>
            </div>
          </div>
        )}
        {loading && (
          <p className="text-gray-500">Loading businesses…</p>
        )}

        {accessDenied && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-amber-900">Access denied</h2>
              <p className="text-amber-800 mt-1">
                You don’t have permission to access Super Admin. If you believe this is an error, ensure your account has Super Admin access.
              </p>
              <Link to="/dashboard" className="inline-block mt-3 text-amber-800 underline font-medium">
                Back to dashboard
              </Link>
            </div>
          </div>
        )}

        {error && !accessDenied && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-red-900">Error</h2>
              <p className="text-red-800 mt-1">{error}</p>
              <Link to="/dashboard" className="inline-block mt-3 text-red-800 underline font-medium">
                Back to dashboard
              </Link>
            </div>
          </div>
        )}

        {!loading && !accessDenied && !error && businesses.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Business</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Locations</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Users</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Impersonate</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-900">{b.name || '(Unnamed)'}</span>
                      </div>
                      <span className="text-xs text-gray-500 block mt-0.5">{b.id}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{b.locationCount}</td>
                    <td className="py-3 px-4 text-gray-600">{b.userCount}</td>
                    <td className="py-3 px-4 text-right">
                      {b.ownerId ? (
                        <button
                          type="button"
                          onClick={() => handleImpersonate(b.ownerId!)}
                          disabled={impersonatingId !== null}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-purple text-white text-sm font-medium hover:bg-brand-purple/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <UserCog className="w-4 h-4" />
                          {impersonatingId === b.ownerId ? 'Signing in…' : 'Impersonate'}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No owner</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !accessDenied && !error && businesses.length === 0 && (
          <p className="text-gray-500">No businesses yet.</p>
        )}
      </main>
    </div>
  );
}
