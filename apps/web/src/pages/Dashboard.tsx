/**
 * Owner Dashboard - Full admin dashboard for OWNER role
 * Staff Management & Kiosk Provisioning
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FloatingBackground } from '../components/FloatingBackground';
import { Logo } from '../components/Logo';
import { Plus, Settings, Clock, Users as UsersIcon, LogOut, FileText, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { User as UserType, OnboardingStatus } from '@shared/types';
import { SetupWizard } from '../components/SetupWizard';
import { KioskProvisionModal } from '../components/KioskProvisionModal';
import { AddStaffModal } from '../components/AddStaffModal';

export function Dashboard() {
  const { userData, logout, refreshUserData } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showKioskProvision, setShowKioskProvision] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);

  // Show setup wizard if user hasn't completed setup
  useEffect(() => {
    if (userData) {
      const status: OnboardingStatus = userData.onboardingStatus;
      if (status === 'NEW' || status === 'TOUR_COMPLETED') {
        setShowSetupWizard(true);
      }
    }
  }, [userData]);

  const handleSetupComplete = async () => {
    await refreshUserData();
    setShowSetupWizard(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
  });

  // Fetch locations
  const { data: locationsData } = useQuery<{ locations: any[] }>({
    queryKey: ['locations'],
    queryFn: () => api.getLocations(),
    enabled: !!userData?.businessId,
  });

  const users = usersData?.users || [];
  const locations = locationsData?.locations || [];

  const handleAddStaffSuccess = () => {
    // Invalidate users query to refresh the list
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <FloatingBackground />
      
      {/* Setup Wizard Modal */}
      {showSetupWizard && <SetupWizard onComplete={handleSetupComplete} />}

      {/* Kiosk Provision Modal */}
      {showKioskProvision && userData?.businessId && (
        <KioskProvisionModal
          businessId={userData.businessId}
          locations={locations}
          onClose={() => setShowKioskProvision(false)}
        />
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <AddStaffModal
          locations={locations}
          onClose={() => setShowAddStaff(false)}
          onSuccess={handleAddStaffSuccess}
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
                <Link to="/settings" className="p-2 text-gray-600 hover:text-gray-900 transition-colors" aria-label="Settings">
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
                Welcome back{userData?.displayName ? `, ${userData.displayName}` : ''}
              </h1>
              <p className="text-gray-600">Manage your workforce and time tracking</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Staff</p>
                    <p className="text-3xl font-semibold text-gray-900">{users.length}</p>
                  </div>
                  <UsersIcon className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Today</p>
                    <p className="text-3xl font-semibold text-gray-900">0</p>
                  </div>
                  <Clock className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Locations</p>
                    <p className="text-3xl font-semibold text-gray-900">{locations.length}</p>
                  </div>
                  <Settings className="w-12 h-12 text-brand-purple/20" />
                </div>
              </div>
              <Link
                to="/payroll-reports"
                className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-brand-purple transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Payroll Reports</p>
                    <p className="text-lg font-semibold text-gray-900">View & Export</p>
                  </div>
                  <FileText className="w-12 h-12 text-brand-purple/20" />
                </div>
              </Link>
            </div>

            {/* Staff Management Section */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">Staff</h2>
                <button
                  onClick={() => setShowAddStaff(true)}
                  disabled={locations.length === 0}
                  className="touch-target px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                  Add Staff
                </button>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-gray-600">Loading...</div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center">
                  <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No staff members yet</p>
                  <button
                    onClick={() => setShowAddStaff(true)}
                    disabled={locations.length === 0}
                    className="touch-target px-6 py-3 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Your First Staff Member
                  </button>
                  {locations.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      Create a location in Settings first
                    </p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {users.map((user: UserType) => (
                    <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
                          <p className="text-sm text-gray-600">{user.role}</p>
                          {user.email && (
                            <p className="text-sm text-gray-500">{user.email}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kiosk Provisioning */}
            <div className="mt-8 bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Kiosk Mode</h2>
              <p className="text-gray-600 mb-6">
                Set up a shared device for time clock access. Staff can clock in/out using their PIN.
              </p>
              <button
                onClick={() => setShowKioskProvision(true)}
                disabled={locations.length === 0}
                className="touch-target px-6 py-3 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Provision Kiosk Device
              </button>
              {locations.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  You need at least one location to provision a kiosk device.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
