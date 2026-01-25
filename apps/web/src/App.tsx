import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import Layout from './components/Layout';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import BusinessSetupWizard from './components/BusinessSetup/BusinessSetupWizard';
import BusinessSetupGuard from './components/BusinessSetup/BusinessSetupGuard';

// Lazy load pages for code splitting
const Landing = lazy(() => import('./pages/Landing'));
const CreateBusiness = lazy(() => import('./pages/CreateBusiness'));
const Login = lazy(() => import('./pages/Login'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TimeClock = lazy(() => import('./pages/TimeClock'));
const PayrollReports = lazy(() => import('./pages/PayrollReports'));
const KioskMode = lazy(() => import('./pages/KioskMode'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const UserGuide = lazy(() => import('./pages/UserGuide'));
const AdminGuide = lazy(() => import('./pages/AdminGuide'));
const SuperAdminGuide = lazy(() => import('./pages/SuperAdminGuide'));

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white" role="status" aria-label="Loading">
      <div className="text-royal-purple text-lg">Loading...</div>
      <span className="sr-only">Loading page...</span>
    </div>
  );
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  // Don't intercept - let routes handle navigation
  // Onboarding will be shown via /onboarding route when user clicks "Get Started"
  return <>{children}</>;
}

function BusinessSetupRoute() {
  const { user, loading, businesses } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-royal-purple text-lg">Loading...</div>
      </div>
    );
  }

  // If user has businesses, redirect to dashboard
  if (user && businesses.length > 0) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is not logged in, redirect to landing
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Show setup wizard
  return <BusinessSetupWizard />;
}

function OnboardingRoute() {
  const { user, loading } = useAuth();

  // Check localStorage directly as source of truth
  // This ensures we catch resetOnboarding() immediately, even before state updates
  const localStorageCompleted = localStorage.getItem('techetime_onboarding_completed') === 'true';
  const localStorageSkipped = localStorage.getItem('techetime_onboarding_skipped') === 'true';
  
  // Use localStorage as source of truth (it's updated synchronously by resetOnboarding)
  // State values are used for reactivity, but localStorage is checked first
  const actuallyCompleted = localStorageCompleted;
  const actuallySkipped = localStorageSkipped;

  if (loading) {
    return <LoadingSpinner />;
  }

  // Show onboarding if not completed and not skipped
  // Allow logged-in users to access onboarding if they haven't completed it
  if (!actuallyCompleted && !actuallySkipped) {
    return <OnboardingFlow />;
  }

  // If onboarding is completed or skipped, redirect based on user status
  if (user) {
    // Logged in user with completed/skipped onboarding -> go to dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  // Not logged in and onboarding completed/skipped -> go to landing
  return <Navigate to="/" replace />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  const requireAuth = (element: React.ReactElement, allowNoBusiness = false) => {
    // If not logged in, redirect to landing
    if (!user) {
      return <Navigate to="/" replace />;
    }
    
    // If logged in but has no businesses
    const businessIds = user.businessIds || (user.businessId ? [user.businessId] : []);
    if (businessIds.length === 0) {
      // Allow Dashboard through - it handles business creation itself
      if (allowNoBusiness) {
        return element;
      }
      // Other routes redirect to setup wizard
      return <Navigate to="/setup" replace />;
    }
    
    // User is logged in and has businesses - allow access
    return element;
  };

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OnboardingGuard>
        <BusinessSetupGuard>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route path="/setup" element={<BusinessSetupRoute />} />
            <Route path="/create-business" element={<CreateBusiness />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/dashboard"
              element={requireAuth(<Layout><Dashboard /></Layout>, true)}
            />
            <Route
              path="/time-clock"
              element={requireAuth(<Layout><TimeClock /></Layout>)}
            />
            <Route
              path="/payroll"
              element={requireAuth(<Layout><PayrollReports /></Layout>)}
            />
            <Route path="/kiosk" element={<KioskMode />} />
            <Route path="/terms" element={<Layout><TermsAndConditions /></Layout>} />
            <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
            <Route
              path="/settings"
              element={requireAuth(<Layout><Settings /></Layout>)}
            />
            <Route
              path="/admin-settings"
              element={
                user && (user.role === 'OWNER' || user.role === 'MANAGER' || user.role === 'SUPERADMIN') 
                  ? <Layout><AdminSettings /></Layout> 
                  : <Navigate to="/dashboard" replace />
              }
            />
            <Route
              path="/user-guide"
              element={requireAuth(<Layout><UserGuide /></Layout>)}
            />
            <Route
              path="/admin-guide"
              element={
                user && (user.role === 'OWNER' || user.role === 'MANAGER' || user.role === 'SUPERADMIN') 
                  ? <Layout><AdminGuide /></Layout> 
                  : <Navigate to="/dashboard" replace />
              }
            />
            <Route
              path="/super-admin-guide"
              element={
                user && user.role === 'SUPERADMIN'
                  ? <Layout><SuperAdminGuide /></Layout> 
                  : <Navigate to="/dashboard" replace />
              }
            />
          </Routes>
        </BusinessSetupGuard>
      </OnboardingGuard>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <AppRoutes />
      </OnboardingProvider>
    </AuthProvider>
  );
}

export default App;
