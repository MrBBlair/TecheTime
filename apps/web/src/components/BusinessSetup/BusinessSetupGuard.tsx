import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BusinessSetupWizard from './BusinessSetupWizard';

interface BusinessSetupGuardProps {
  children: ReactNode;
}

export default function BusinessSetupGuard({ children }: BusinessSetupGuardProps) {
  const { user, loading, businesses } = useAuth();
  const navigate = useNavigate();

  // Check if user needs business setup
  const needsBusinessSetup = user && !loading && businesses.length === 0;

  useEffect(() => {
    // If user is logged in but has no businesses, they need to complete setup
    // Don't redirect if already on setup page or dashboard (dashboard handles its own business creation)
    // Don't redirect kiosk mode - it doesn't require business setup
    // Don't redirect if already on setup page to avoid loops
    if (needsBusinessSetup && 
        window.location.pathname !== '/setup' && 
        window.location.pathname !== '/onboarding' &&
        window.location.pathname !== '/dashboard' &&
        window.location.pathname !== '/kiosk') {
      navigate('/setup', { replace: true });
    }
  }, [needsBusinessSetup, navigate]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-royal-purple text-lg">Loading...</div>
      </div>
    );
  }

  // If user needs business setup, show the wizard
  // But don't interfere with kiosk mode
  if (needsBusinessSetup && window.location.pathname !== '/kiosk') {
    return <BusinessSetupWizard />;
  }

  // Otherwise, render children normally
  return <>{children}</>;
}
