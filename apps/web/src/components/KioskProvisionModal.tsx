/**
 * Kiosk Provision Modal - Handshake UI
 * Allows admin to provision a kiosk device
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Smartphone } from 'lucide-react';
import { api } from '../lib/api';
import { Location } from '@shared/types';

interface KioskProvisionModalProps {
  businessId: string;
  locations: Location[];
  onClose: () => void;
}

export function KioskProvisionModal({
  businessId,
  locations,
  onClose,
}: KioskProvisionModalProps) {
  const navigate = useNavigate();
  const [deviceName, setDeviceName] = useState('');
  const [locationId, setLocationId] = useState(locations[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!deviceName.trim()) {
      setError('Device name is required');
      return;
    }

    if (!locationId) {
      setError('Please select a location');
      return;
    }

    setLoading(true);

    try {
      const result = await api.registerKiosk({
        businessId,
        locationId,
        deviceName: deviceName.trim(),
      });

      // Store device credentials in localStorage
      localStorage.setItem('kiosk_device_id', result.deviceId);
      localStorage.setItem('kiosk_secret', result.secret);

      // Redirect to kiosk mode
      navigate('/kiosk');
    } catch (err: any) {
      setError(err.message || 'Failed to provision device');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-brand-purple" />
            <h2 className="text-xl font-semibold text-gray-900">Provision Kiosk Device</h2>
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
            {/* Device Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Name
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g., Front Desk Tablet"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                autoFocus
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                A friendly name to identify this device
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
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
              <p className="mt-1 text-xs text-gray-500">
                Select the location where this kiosk will be used
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> After provisioning, this device will be redirected to kiosk
              mode. Staff can clock in/out using their PIN. To exit kiosk mode, long-press the
              Exit button for 3 seconds.
            </p>
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
              disabled={loading || !deviceName.trim() || !locationId}
              className="flex-1 px-6 py-3 bg-brand-purple text-white rounded-lg font-medium shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Provisioning...' : 'Provision Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
