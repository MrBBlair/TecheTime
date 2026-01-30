/**
 * Setup Wizard - 3-step form (Business Name -> Location/Timezone -> Admin PIN)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FloatingBackground } from '../components/FloatingBackground';
import { Logo } from '../components/Logo';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { api } from '../lib/api';
import { OnboardingProgress } from '../components/OnboardingProgress';

type Step = 1 | 2 | 3;

export function Setup() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();

  // Form data persisted to localStorage
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('setup_wizard_data');
    return saved
      ? JSON.parse(saved)
      : {
          businessName: '',
          locationName: '',
          locationTimezone: '',
          pin: '',
        };
  });

  // Auto-detect browser timezone
  useEffect(() => {
    if (!formData.locationTimezone) {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setFormData((prev: any) => ({ ...prev, locationTimezone: detectedTimezone }));
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem('setup_wizard_data', JSON.stringify(formData));
  }, [formData]);

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as Step);
      setError('');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!user?.email) {
      setError('User email not found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Basic validation
      if (!formData.businessName || !formData.locationName || !formData.locationTimezone || !formData.pin || formData.pin.length < 4) {
        setError('Please fill in all fields correctly');
        setLoading(false);
        return;
      }

      // Call complete-setup API (creates business, location, and updates existing user)
      await api.completeSetup({
        businessName: formData.businessName,
        locationName: formData.locationName,
        locationTimezone: formData.locationTimezone,
        pin: formData.pin,
      });

      // Clear localStorage
      localStorage.removeItem('setup_wizard_data');

      // Refresh user data and navigate
      await refreshUserData();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <FloatingBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col container-padding section-spacing">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Logo variant="kioskBackground" />
        </div>

        {/* Overall Onboarding Progress */}
        <div className="max-w-2xl mx-auto mb-8">
          <OnboardingProgress
            currentStep={2}
            totalSteps={2}
            stepLabels={['Welcome', 'Setup']}
          />
        </div>

        {/* Setup Wizard Progress */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-brand-purple' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="text-center text-xs text-gray-500">
            Setup Step {step} of 3
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Step 1: Business Name */}
            {step === 1 && (
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                  What's your business name?
                </h2>
                <p className="text-gray-600 mb-6">
                  This will be displayed throughout your account.
                </p>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  placeholder="Acme Corporation"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent text-lg"
                  autoFocus
                />
              </div>
            )}

            {/* Step 2: Location & Timezone */}
            {step === 2 && (
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                  Where is your primary location?
                </h2>
                <p className="text-gray-600 mb-6">
                  We've detected your timezone automatically.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location Name
                    </label>
                    <input
                      type="text"
                      value={formData.locationName}
                      onChange={(e) =>
                        setFormData({ ...formData, locationName: e.target.value })
                      }
                      placeholder="Main Office"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.locationTimezone}
                        onChange={(e) =>
                          setFormData({ ...formData, locationTimezone: e.target.value })
                        }
                        placeholder="America/New_York"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Detected: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Admin PIN */}
            {step === 3 && (
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                  Set your admin PIN
                </h2>
                <p className="text-gray-600 mb-6">
                  This PIN will be used for kiosk access and administrative functions.
                </p>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={formData.pin}
                  onChange={(e) =>
                    setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="4-8 digits"
                  maxLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent text-lg text-center tracking-widest"
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Enter 4-8 digits
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex gap-4">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="touch-target flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
              )}
              <button
                onClick={step === 3 ? handleSubmit : handleNext}
                disabled={
                  loading ||
                  (step === 1 && !formData.businessName) ||
                  (step === 2 && (!formData.locationName || !formData.locationTimezone)) ||
                  (step === 3 && !formData.pin || formData.pin.length < 4)
                }
                className="touch-target flex-1 px-6 py-3 bg-brand-purple text-white rounded-lg font-medium shadow-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Setting up...'
                ) : step === 3 ? (
                  'Complete Setup'
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
