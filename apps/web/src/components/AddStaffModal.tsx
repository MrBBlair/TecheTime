/**
 * Add Staff Modal - Create new staff member (Worker or Manager)
 */

import { useState } from 'react';
import { X, UserPlus, DollarSign } from 'lucide-react';
import { Location, CreateStaffPayload } from '@shared/types';
import { api } from '../lib/api';

interface AddStaffModalProps {
  locations: Location[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStaffModal({ locations, onClose, onSuccess }: AddStaffModalProps) {
  const [formData, setFormData] = useState<CreateStaffPayload>({
    displayName: '',
    email: '',
    pin: '',
    role: 'WORKER',
    locationId: locations[0]?.id || '',
    payRate: {
      amount: 0, // Will be converted from dollars to cents
      effectiveDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
    },
  });
  const [payRateDollars, setPayRateDollars] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.displayName.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.pin.match(/^\d{4,8}$/)) {
      setError('PIN must be 4-8 digits');
      return;
    }

    if (!formData.locationId) {
      setError('Please select a location');
      return;
    }

    if (formData.role === 'MANAGER' && !formData.email?.trim()) {
      setError('Email is required for Manager role');
      return;
    }

    if (!payRateDollars || parseFloat(payRateDollars) <= 0) {
      setError('Pay rate must be greater than $0');
      return;
    }

    // Convert dollars to cents
    const amountInCents = Math.round(parseFloat(payRateDollars) * 100);

    setLoading(true);

    try {
      const payload: CreateStaffPayload = {
        displayName: formData.displayName.trim(),
        pin: formData.pin,
        role: formData.role,
        locationId: formData.locationId,
        payRate: {
          amount: amountInCents,
          effectiveDate: formData.payRate.effectiveDate,
        },
      };

      // Only include email if provided
      if (formData.email?.trim()) {
        payload.email = formData.email.trim();
      }

      await api.createUser(payload);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create staff member');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-brand-purple" />
            <h2 className="text-xl font-semibold text-gray-900">Add Staff Member</h2>
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
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                autoFocus
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as 'MANAGER' | 'WORKER' })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                required
              >
                <option value="WORKER">Worker</option>
                <option value="MANAGER">Manager</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Managers can access admin features. Email required for managers.
              </p>
            </div>

            {/* Email (required for Manager) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email {formData.role === 'MANAGER' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                required={formData.role === 'MANAGER'}
              />
              <p className="mt-1 text-xs text-gray-500">
                Required for managers. Optional for workers.
              </p>
            </div>

            {/* PIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setFormData({ ...formData, pin: value });
                }}
                placeholder="1234"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent text-center text-2xl tracking-widest"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                4-8 digits. Used for kiosk clock-in/out.
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                required
              >
                {locations.length === 0 ? (
                  <option value="">No locations available</option>
                ) : (
                  locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Pay Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Pay Rate <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={payRateDollars}
                    onChange={(e) => setPayRateDollars(e.target.value)}
                    placeholder="25.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Per hour (USD)</p>
                </div>
                <div className="flex-1">
                  <input
                    type="date"
                    value={formData.payRate.effectiveDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payRate: { ...formData.payRate, effectiveDate: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Effective date</p>
                </div>
              </div>
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
              {loading ? 'Creating...' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
