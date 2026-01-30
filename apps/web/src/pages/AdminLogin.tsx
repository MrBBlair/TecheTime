/**
 * Super Admin Login - UUID-based authentication
 * Route: /admin
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { FloatingBackground } from '../components/FloatingBackground';
import { Logo } from '../components/Logo';
import { Shield, Lock, AlertCircle } from 'lucide-react';

export function AdminLogin() {
  const navigate = useNavigate();
  const { impersonateUser } = useAuth();
  const [uuid, setUuid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!uuid.trim()) {
        setError('UUID is required');
        setLoading(false);
        return;
      }

      const { customToken } = await api.adminLogin(uuid.trim());
      await impersonateUser(customToken);
      
      // Redirect to super admin dashboard
      navigate('/super-admin');
    } catch (err: any) {
      setError(err.message || 'Invalid UUID or authentication failed');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <FloatingBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center container-padding">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <Logo variant="kioskBackground" className="w-20 h-20 mx-auto mb-4" />
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-6 h-6 text-brand-purple" />
                <h1 className="text-3xl font-semibold text-gray-900">Super Admin</h1>
              </div>
              <p className="text-gray-600">Enter your UUID to access the admin dashboard</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="uuid" className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Admin UUID
                </label>
                <input
                  id="uuid"
                  type="text"
                  value={uuid}
                  onChange={(e) => setUuid(e.target.value)}
                  placeholder="Enter your UUID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent font-mono text-sm"
                  autoFocus
                  required
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-500">
                  This is a secure admin-only login. Only authorized UUIDs are accepted.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !uuid.trim()}
                className="touch-target w-full px-6 py-3 bg-brand-purple text-white rounded-lg font-medium shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Login
                  </>
                )}
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Security Notice:</strong> This is a restricted access area. Unauthorized access attempts are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
