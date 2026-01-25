import { useState } from 'react';

interface Step4TourProps {
  onComplete: () => void;
  onPrevious: () => void;
}

export default function Step4Tour({ onComplete, onPrevious }: Step4TourProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleComplete = () => {
    // Request notification permission if enabled
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    onComplete();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="w-16 h-16 bg-old-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-old-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-royal-purple mb-2">You're All Set!</h2>
        <p className="text-gray-600">Here's what you can do with Tech eTime</p>
      </div>

      <div className="space-y-4">
        <div className="bg-royal-purple/5 rounded-lg p-4 border border-royal-purple/10">
          <h3 className="font-semibold text-charcoal mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Manage Your Workforce
          </h3>
          <p className="text-sm text-gray-600">Add locations, workers, and set up PIN-based time clock</p>
        </div>

        <div className="bg-royal-purple/5 rounded-lg p-4 border border-royal-purple/10">
          <h3 className="font-semibold text-charcoal mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Track Time Entries
          </h3>
          <p className="text-sm text-gray-600">Workers clock in/out with secure PIN codes</p>
        </div>

        <div className="bg-royal-purple/5 rounded-lg p-4 border border-royal-purple/10">
          <h3 className="font-semibold text-charcoal mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Reports
          </h3>
          <p className="text-sm text-gray-600">Create payroll reports with AI-powered insights</p>
        </div>
      </div>

      {/* Notifications Permission */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start gap-3">
          <input
            id="enable-notifications"
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="mt-1 h-4 w-4 text-royal-purple focus:ring-royal-purple border-gray-300 rounded"
          />
          <div className="flex-1">
            <label htmlFor="enable-notifications" className="block text-sm font-semibold text-charcoal mb-1">
              Enable Notifications
            </label>
            <p className="text-xs text-gray-600">
              Get notified about important updates and reminders (optional)
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onPrevious}
          className="btn-outline flex-1"
          aria-label="Go back to previous step"
        >
          Back
        </button>
        <button
          onClick={handleComplete}
          className="btn-primary flex-1 text-lg py-4"
          aria-label="Complete onboarding and enter the app"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
