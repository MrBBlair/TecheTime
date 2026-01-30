/**
 * Create Business Modal - For CLIENT_ADMIN to create new businesses
 */

import { useState } from 'react';
import { X, Building2, UserPlus, MapPin } from 'lucide-react';
import { api } from '../lib/api';

interface CreateBusinessModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateBusinessModal({ onClose, onSuccess }: CreateBusinessModalProps) {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerEmail: '',
    ownerDisplayName: '',
    ownerPassword: '',
    locationName: '',
    locationTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Auto-detect timezone
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.businessName.trim()) {
      setError('Business name is required');
      return;
    }

    if (!formData.ownerEmail.trim() || !formData.ownerEmail.includes('@')) {
      setError('Valid owner email is required');
      return;
    }

    if (!formData.ownerDisplayName.trim()) {
      setError('Owner name is required');
      return;
    }

    if (!formData.ownerPassword || formData.ownerPassword.length < 6) {
      setError('Owner password must be at least 6 characters');
      return;
    }

    if (!formData.locationName.trim()) {
      setError('Location name is required');
      return;
    }

    if (!formData.locationTimezone) {
      setError('Location timezone is required');
      return;
    }

    setLoading(true);

    try {
      await api.createBusiness({
        name: formData.businessName.trim(),
        ownerEmail: formData.ownerEmail.trim(),
        ownerDisplayName: formData.ownerDisplayName.trim(),
        ownerPassword: formData.ownerPassword,
        locationName: formData.locationName.trim(),
        locationTimezone: formData.locationTimezone,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create business');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-brand-purple" />
            <h2 className="text-xl font-semibold text-gray-900">Create Business</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Acme Corporation"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                autoFocus
                required
              />
            </div>

            {/* Owner Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserPlus className="w-4 h-4 inline mr-1" />
                Owner Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                placeholder="owner@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be the OWNER account for the business
              </p>
            </div>

            {/* Owner Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ownerDisplayName}
                onChange={(e) => setFormData({ ...formData, ownerDisplayName: e.target.value })}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                required
              />
            </div>

            {/* Owner Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.ownerPassword}
                onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                required
                minLength={6}
              />
            </div>

            {/* Location Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                placeholder="Main Office"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                required
              />
            </div>

            {/* Location Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Timezone <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.locationTimezone}
                onChange={(e) => setFormData({ ...formData, locationTimezone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                required
              >
                <option value="America/New_York">Eastern Time (America/New_York)</option>
                <option value="America/Chicago">Central Time (America/Chicago)</option>
                <option value="America/Denver">Mountain Time (America/Denver)</option>
                <option value="America/Los_Angeles">Pacific Time (America/Los_Angeles)</option>
                <option value="America/Phoenix">Arizona (America/Phoenix)</option>
                <option value="America/Anchorage">Alaska (America/Anchorage)</option>
                <option value="Pacific/Honolulu">Hawaii (Pacific/Honolulu)</option>
                <option value="UTC">UTC</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Auto-detected: {formData.locationTimezone}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-brand-purple text-white rounded-lg font-medium shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Business'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
