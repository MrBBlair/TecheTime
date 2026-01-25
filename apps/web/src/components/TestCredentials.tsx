import { useState } from 'react';

/**
 * Component to display test credentials for development
 * Only shows in development mode
 */
export default function TestCredentials() {
  const [showCredentials, setShowCredentials] = useState(false);

  if (import.meta.env.PROD) {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!showCredentials ? (
        <button
          onClick={() => setShowCredentials(true)}
          className="bg-old-gold text-charcoal px-4 py-2 rounded-lg shadow-lg text-sm font-semibold hover:bg-opacity-90 transition-all"
          aria-label="Show test credentials"
        >
          Test Account
        </button>
      ) : (
        <div className="bg-white border-2 border-royal-purple rounded-lg shadow-xl p-4 max-w-sm">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-royal-purple text-sm">Test Credentials</h3>
            <button
              onClick={() => setShowCredentials(false)}
              className="text-gray-500 hover:text-charcoal"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Email:</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-charcoal block">
                admin@techetime.demo
              </code>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Password:</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-charcoal block">
                demo1234
              </code>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">
                Run <code className="bg-gray-100 px-1 rounded">npm run seed</code> to create test data
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
