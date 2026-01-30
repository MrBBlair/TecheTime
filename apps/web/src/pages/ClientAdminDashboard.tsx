/**
 * Client Admin Dashboard - Manage multiple businesses
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { FloatingBackground } from '../components/FloatingBackground';
import { Logo } from '../components/Logo';
import { Building2, Plus, Users as UsersIcon, MapPin, Settings, LogOut, User, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { CreateBusinessModal } from '../components/CreateBusinessModal';

export function ClientAdminDashboard() {
  const { userData, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreateBusiness, setShowCreateBusiness] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Fetch businesses managed by this CLIENT_ADMIN
  const { data: businessesData, isLoading } = useQuery({
    queryKey: ['client-admin-businesses'],
    queryFn: () => api.getClientAdminBusinesses(),
    enabled: userData?.role === 'CLIENT_ADMIN',
  });

  const businesses = businessesData?.businesses || [];

  const handleCreateBusinessSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['client-admin-businesses'] });
    setShowCreateBusiness(false);
  };

  const handleSelectBusiness = (businessId: string) => {
    navigate(`/business/${businessId}`);
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <FloatingBackground />

      {/* Create Business Modal */}
      {showCreateBusiness && (
        <CreateBusinessModal
          onClose={() => setShowCreateBusiness(false)}
          onSuccess={handleCreateBusinessSuccess}
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
              <p className="text-gray-600">Manage your businesses and their teams</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Businesses</p>
                    <p className="text-3xl font-semibold text-gray-900">{businesses.length}</p>
                  </div>
                  <Building2 className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Locations</p>
                    <p className="text-3xl font-semibold text-gray-900">
                      {businesses.reduce((sum, b) => sum + b.locationCount, 0)}
                    </p>
                  </div>
                  <MapPin className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Users</p>
                    <p className="text-3xl font-semibold text-gray-900">
                      {businesses.reduce((sum, b) => sum + b.userCount, 0)}
                    </p>
                  </div>
                  <UsersIcon className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
            </div>

            {/* Businesses List */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">Businesses</h2>
                <button
                  onClick={() => setShowCreateBusiness(true)}
                  className="touch-target px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Business
                </button>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-gray-600">Loading...</div>
              ) : businesses.length === 0 ? (
                <div className="p-8 text-center">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No businesses yet</p>
                  <button
                    onClick={() => setShowCreateBusiness(true)}
                    className="touch-target px-6 py-3 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Create Your First Business
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {businesses.map((business) => (
                    <div
                      key={business.id}
                      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleSelectBusiness(business.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{business.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">Owner: {business.ownerName}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              {business.locationCount} location{business.locationCount !== 1 ? 's' : ''}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <UsersIcon className="w-4 h-4" />
                              {business.userCount} user{business.userCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
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
