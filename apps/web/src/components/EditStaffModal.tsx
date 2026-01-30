/**
 * Edit Staff Modal - Edit existing staff member
 */

import { useState, useEffect } from 'react';
import { X, UserPlus, DollarSign, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { Location, User } from '@shared/types';

interface EditStaffModalProps {
  user: User;
  locations: Location[];
  onClose: () => void;
  onSuccess: () => void;
  onDelete: () => void;
}

export function EditStaffModal({ user, locations, onClose, onSuccess, onDelete }: EditStaffModalProps) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    email: user.email || '',
    role: user.role as 'MANAGER' | 'WORKER',
    locationId: user.locationId || locations[0]?.id || '',
    pin: '', // Don't pre-fill PIN for security
  });
  const [payRateDollars, setPayRateDollars] = useState('');
  const [payRateDate, setPayRateDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Get current pay rate
  useEffect(() => {
    if (user.payRates && user.payRates.length > 0) {
      const latestRate = [...user.payRates].sort(
        (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
      )[0];
      setPayRateDollars((latestRate.amount / 100).toFixed(2));
      setPayRateDate(latestRate.effectiveDate);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.displayName.trim()) {
      setError('Name is required');
      return;
    }

    if (formData.pin && !formData.pin.match(/^\d{4,8}$/)) {
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

    setLoading(true);

    try {
      const updateData: any = {
        displayName: formData.displayName.trim(),
        role: formData.role,
        locationId: formData.locationId,
      };

      if (formData.email?.trim()) {
        updateData.email = formData.email.trim();
      }

      if (formData.pin) {
        updateData.pin = formData.pin;
      }

      // Add pay rate if changed
      if (payRateDollars && parseFloat(payRateDollars) > 0) {
        const amountInCents = Math.round(parseFloat(payRateDollars) * 100);
        updateData.payRate = {
          amount: amountInCents,
          effectiveDate: payRateDate,
        };
      }

      await api.updateUser(user.id, updateData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update staff member');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteUser(user.id);
      onDelete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete staff member');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-brand-purple" />
            <h2 className="text-xl font-semibold text-gray-900">Edit Staff Member</h2>
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
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email {formData.role === 'MANAGER' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                required={formData.role === 'MANAGER'}
              />
            </div>

            {/* PIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN (leave blank to keep current)
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
                placeholder="Leave blank to keep current"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent text-center text-2xl tracking-widest"
              />
              <p className="mt-1 text-xs text-gray-500">4-8 digits. Leave blank to keep current PIN.</p>
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
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pay Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Update Pay Rate (Optional)
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
                  />
                  <p className="mt-1 text-xs text-gray-500">Per hour (USD)</p>
                </div>
                <div className="flex-1">
                  <input
                    type="date"
                    value={payRateDate}
                    onChange={(e) => setPayRateDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">Effective date</p>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Only fill if updating pay rate. Leave blank to keep current rate.
              </p>
            </div>
          </div>

          {/* Delete Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Staff Member
            </button>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 mb-3">
                Are you sure you want to delete <strong>{user.displayName}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}

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
              disabled={loading || showDeleteConfirm}
              className="flex-1 px-6 py-3 bg-brand-purple text-white rounded-lg font-medium shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
