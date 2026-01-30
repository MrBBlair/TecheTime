/**
 * User Profile - View and edit user profile
 */

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { FloatingBackground } from '../components/FloatingBackground';
import { Logo } from '../components/Logo';
import { ArrowLeft, User, Mail, Phone, Building2, MapPin, Shield, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export function UserProfile() {
  const { userData, refreshUserData } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  type ProfileData = {
    id: string;
    displayName?: string;
    email?: string;
    phoneNumber?: string;
    role: string;
    businessId?: string; // Optional for CLIENT_ADMIN
    locationId?: string;
    payRates?: Array<{ amount: number; effectiveDate: string; createdAt: string }>;
    createdAt?: string;
  };

  // Fetch profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getProfile(),
  }) as { data: ProfileData | undefined; isLoading: boolean };

  // Update form fields when profile data loads
  useEffect(() => {
    if (profileData) {
      setDisplayName(profileData.displayName || '');
      setPhoneNumber(profileData.phoneNumber || '');
    }
  }, [profileData]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.updateProfile({
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      });

      // Invalidate queries and refresh auth data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      await refreshUserData();

      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setDisplayName(profileData.displayName || '');
      setPhoneNumber(profileData.phoneNumber || '');
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-white overflow-hidden">
        <FloatingBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  const profile: ProfileData | null = profileData || (userData as ProfileData | null);

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
                <Logo variant="kioskBackground" className="w-10 h-10" />
                <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container-padding section-spacing">
          <div className="max-w-2xl mx-auto">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Profile Information</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-brand-purple border border-brand-purple rounded-lg font-medium hover:bg-brand-purple/10 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  {success}
                </div>
              )}

              <div className="space-y-4">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {profile?.displayName || userData?.displayName || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600">
                    {profile?.email || userData?.email || 'No email'}
                  </p>
                  {!profile?.email && profile?.role === 'WORKER' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Email is optional for workers
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {profile?.phoneNumber || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Role (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Shield className="w-4 h-4 inline mr-1" />
                    Role
                  </label>
                  <p className="px-4 py-3 bg-gray-50 rounded-lg">
                    <span className="px-3 py-1 bg-brand-purple/10 text-brand-purple rounded-full text-sm font-medium">
                      {profile?.role || 'Unknown'}
                    </span>
                  </p>
                </div>

                {/* Business Info (read-only) */}
                {profile?.businessId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="w-4 h-4 inline mr-1" />
                      Business
                    </label>
                    <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600 text-sm">
                      Business ID: {profile.businessId}
                    </p>
                  </div>
                )}

                {/* Location (read-only) */}
                {profile?.locationId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Location
                    </label>
                    <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600 text-sm">
                      Location ID: {profile.locationId}
                    </p>
                  </div>
                )}

                {/* Pay Rates (read-only) */}
                {profile?.payRates && profile.payRates.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Pay Rate
                    </label>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      {(() => {
                        const latestRate = [...profile.payRates].sort(
                          (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
                        )[0];
                        return (
                          <div>
                            <p className="text-gray-900 font-medium">
                              ${(latestRate.amount / 100).toFixed(2)}/hour
                            </p>
                            <p className="text-sm text-gray-600">
                              Effective: {format(new Date(latestRate.effectiveDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Account Created */}
                {profile?.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Since
                    </label>
                    <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600 text-sm">
                      {format(new Date(profile.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}

                {/* Edit Actions */}
                {isEditing && (
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleCancel}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading || !displayName.trim()}
                      className="flex-1 px-6 py-3 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
