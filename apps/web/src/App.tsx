import { Component, lazy, Suspense, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { AuthGuard } from './components/guards/AuthGuard';
import { OnboardingGuard } from './components/guards/OnboardingGuard';
import { KioskGuard } from './components/guards/KioskGuard';
import BusinessSetupGuard from './components/BusinessSetup/BusinessSetupGuard';
import Layout from './components/Layout';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';

function DeferredRouteContent({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  if (!ready) return <>{fallback}</>;
  return <>{children}</>;
}

class RouteErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError = () => ({ hasError: true });
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.default })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(m => ({ default: m.AdminLogin })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Welcome = lazy(() => import('./pages/Welcome').then(m => ({ default: m.Welcome })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const UserProfile = lazy(() => import('./pages/UserProfile').then(m => ({ default: m.UserProfile })));
const AdminGuidePage = lazy(() => import('./pages/AdminGuidePage').then(m => ({ default: m.AdminGuidePage })));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage').then(m => ({ default: m.SuperAdminPage })));
const PayrollReports = lazy(() => import('./pages/PayrollReports').then(m => ({ default: m.PayrollReports })));
const BusinessDetail = lazy(() => import('./pages/BusinessDetail').then(m => ({ default: m.BusinessDetail })));
const Kiosk = lazy(() => import('./pages/Kiosk').then(m => ({ default: m.Kiosk })));
const RoleBasedDashboard = lazy(() => import('./components/RoleBasedDashboard').then(m => ({ default: m.RoleBasedDashboard })));
const TimeClock = lazy(() => import('./pages/TimeClock').then(m => ({ default: m.default })));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions').then(m => ({ default: m.default })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.default })));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-royal-purple text-lg">Loading...</div>
    </div>
  );
}

function OnboardingRoute() {
  const { user, loading } = useAuth();
  const completed = typeof window !== 'undefined' && localStorage.getItem('techetime_onboarding_completed') === 'true';
  const skipped = typeof window !== 'undefined' && localStorage.getItem('techetime_onboarding_skipped') === 'true';

  if (loading) return <PageLoader />;
  if (!completed && !skipped) return <OnboardingFlow />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/" replace />;
}

function SetupRoute() {
  return (
    <AuthGuard>
      <BusinessSetupGuard>
        <Navigate to="/dashboard" replace />
      </BusinessSetupGuard>
    </AuthGuard>
  );
}

function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <OnboardingGuard>
        <BusinessSetupGuard>
          <Layout>{children}</Layout>
        </BusinessSetupGuard>
      </OnboardingGuard>
    </AuthGuard>
  );
}

function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <RouteErrorBoundary
            fallback={
              <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
                <p className="text-gray-600">Something went wrong. This can happen after a hot reload.</p>
                <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800" aria-label="Refresh page">Refresh page</button>
              </div>
            }
          >
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/register" element={<Register />} />
                <Route path="/onboarding" element={<OnboardingRoute />} />
                <Route path="/terms" element={<Layout><TermsAndConditions /></Layout>} />
                <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />

                <Route path="/setup" element={<SetupRoute />} />

                <Route path="/dashboard" element={<ProtectedLayout><DeferredRouteContent fallback={<PageLoader />}><Suspense fallback={<PageLoader />}><RoleBasedDashboard /></Suspense></DeferredRouteContent></ProtectedLayout>} />
                <Route path="/time-clock" element={<ProtectedLayout><DeferredRouteContent fallback={<PageLoader />}><Suspense fallback={<PageLoader />}><TimeClock /></Suspense></DeferredRouteContent></ProtectedLayout>} />
                <Route path="/payroll" element={<ProtectedLayout><DeferredRouteContent fallback={<PageLoader />}><Suspense fallback={<PageLoader />}><PayrollReports /></Suspense></DeferredRouteContent></ProtectedLayout>} />
                <Route path="/payroll-reports" element={<Navigate to="/payroll" replace />} />
                <Route path="/settings" element={<ProtectedLayout><DeferredRouteContent fallback={<PageLoader />}><Suspense fallback={<PageLoader />}><Settings /></Suspense></DeferredRouteContent></ProtectedLayout>} />
                <Route path="/profile" element={<ProtectedLayout><DeferredRouteContent fallback={<PageLoader />}><Suspense fallback={<PageLoader />}><UserProfile /></Suspense></DeferredRouteContent></ProtectedLayout>} />
                <Route path="/admin-guide" element={<ProtectedLayout><DeferredRouteContent fallback={<PageLoader />}><Suspense fallback={<PageLoader />}><AdminGuidePage /></Suspense></DeferredRouteContent></ProtectedLayout>} />
                <Route path="/business/:businessId" element={<ProtectedLayout><DeferredRouteContent fallback={<PageLoader />}><Suspense fallback={<PageLoader />}><BusinessDetail /></Suspense></DeferredRouteContent></ProtectedLayout>} />
                <Route path="/super-admin" element={<ProtectedLayout><DeferredRouteContent fallback={<PageLoader />}><Suspense fallback={<PageLoader />}><SuperAdminPage /></Suspense></DeferredRouteContent></ProtectedLayout>} />

                <Route path="/kiosk" element={<KioskGuard><DeferredRouteContent fallback={<PageLoader />}><Suspense fallback={<PageLoader />}><Kiosk /></Suspense></DeferredRouteContent></KioskGuard>} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </RouteErrorBoundary>
        </BrowserRouter>
      </OnboardingProvider>
    </AuthProvider>
  );
}

export default App;
