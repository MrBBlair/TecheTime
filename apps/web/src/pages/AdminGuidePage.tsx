/**
 * Admin Guide Page
 */
 
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FloatingBackground } from '../components/FloatingBackground';
import { Logo } from '../components/Logo';
import { AdminGuideInteractive } from '../components/AdminGuideInteractive';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
 
export function AdminGuidePage() {
  const { userData } = useAuth();
 
  const role = userData?.role;
  const isAdmin = role === 'OWNER' || role === 'MANAGER' || role === 'SUPERADMIN';
 
  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <FloatingBackground />
      <div className="relative z-10 min-h-screen">
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="container-padding py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/settings" className="p-2 text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <Logo variant="kioskBackground" className="w-12 h-12" />
                <h1 className="text-xl font-semibold text-gray-900">Admin Guide</h1>
              </div>
            </div>
          </div>
        </header>
 
        <main className="container-padding section-spacing max-w-4xl mx-auto">
          {!isAdmin ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin access required</h2>
              <p className="text-gray-600">
                This guide is available to Owners and Managers.
              </p>
            </div>
          ) : (
            <AdminGuideInteractive />
          )}
        </main>
      </div>
    </div>
  );
}

