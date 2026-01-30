import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FormField from '../FormField';
import { api } from '../../lib/api';

interface Step2CreateBusinessProps {
  onNext: () => void;
  onPrevious: () => void;
}

export default function Step2CreateBusiness({ onNext, onPrevious }: Step2CreateBusinessProps) {
  const { user, refreshUserData } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateBusinessName = (name: string): string | undefined => {
    if (!name.trim()) return 'Business name is required';
    if (name.trim().length < 2) return 'Business name must be at least 2 characters';
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nameError = validateBusinessName(businessName);
    if (nameError) {
      setError(nameError);
      return;
    }

    if (!user) {
      setError('You must be logged in to create a business');
      return;
    }

    setLoading(true);

    try {
      await api.completeSetup({
        businessName: businessName.trim(),
        locationName: 'Main',
        locationTimezone: timezone,
        pin: '0000',
      });

      await refreshUserData();
      await new Promise((resolve) => setTimeout(resolve, 500));
      onNext();
    } catch (err: any) {
      setError(err.message || 'Failed to create business. Please try again.');
      console.error('Business creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const commonTimezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-royal-purple mb-2">
          Create Your Business
        </h2>
        <p className="text-gray-600">
          Set up your business profile to start tracking time
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField
          label="Business Name"
          type="text"
          name="businessName"
          value={businessName}
          onChange={(value) => {
            setBusinessName(value);
            if (error) setError('');
          }}
          placeholder="Your Business Name"
          required
          autoComplete="organization"
          error={error && error.includes('name') ? error : undefined}
          autoFocus
        />

        <FormField
          label="Address"
          type="text"
          name="address"
          value={address}
          onChange={(value) => setAddress(value)}
          placeholder="123 Main Street"
          autoComplete="street-address"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            label="City"
            type="text"
            name="city"
            value={city}
            onChange={(value) => setCity(value)}
            placeholder="City"
            autoComplete="address-level2"
          />
          <FormField
            label="State"
            type="text"
            name="state"
            value={state}
            onChange={(value) => setState(value)}
            placeholder="State"
            autoComplete="address-level1"
          />
          <FormField
            label="ZIP Code"
            type="text"
            name="zipCode"
            value={zipCode}
            onChange={(value) => setZipCode(value)}
            placeholder="12345"
            autoComplete="postal-code"
          />
        </div>

        <FormField
          label="Phone Number"
          type="tel"
          name="phone"
          value={phone}
          onChange={(value) => setPhone(value)}
          placeholder="(555) 123-4567"
          autoComplete="tel"
        />

        <div>
          <label className="block text-sm font-semibold text-charcoal mb-2">
            Timezone <span className="text-red-500">*</span>
          </label>
          <select
            value={timezone}
            onChange={(e) => {
              setTimezone(e.target.value);
              if (error) setError('');
            }}
            className="w-full px-4 py-3 text-base rounded-lg border border-light-gray focus:outline-none focus:ring-2 focus:ring-royal-purple focus:border-transparent bg-white"
            required
          >
            {commonTimezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Used for time tracking and reports
          </p>
          {error && error.includes('timezone') && (
            <p className="text-red-600 text-sm mt-1">{error}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onPrevious}
            className="btn-outline flex-1"
            aria-label="Go back"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 text-lg py-4"
          >
            {loading ? 'Creating...' : 'Create Business'}
          </button>
        </div>
      </form>
    </div>
  );
}
