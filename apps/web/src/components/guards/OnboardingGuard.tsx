/**
 * OnboardingGuard: Allows dashboard access - setup wizard will be shown as modal in Dashboard
 * This guard now only ensures user data is loaded, but doesn't redirect away from dashboard
 */

import { useAuth } from '../../contexts/AuthContext';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { userData, loading } = useAuth();

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Allow access to dashboard - Dashboard component will handle showing setup wizard modal
  return <>{children}</>;
}
