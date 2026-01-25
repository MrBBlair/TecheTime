import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminSettings() {
  const { user } = useAuth();

  // Only OWNER, MANAGER, and SUPERADMIN can access admin settings
  if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER' && user.role !== 'SUPERADMIN')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-royal-purple">Admin Settings</h1>
      
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-charcoal mb-4">Administrative Tools</h2>
          <p className="text-gray-600 mb-4">
            Manage your business settings and access administrative features.
          </p>
        </section>

        <section className="border-t pt-6">
          <h2 className="text-2xl font-semibold text-charcoal mb-4">Business Management</h2>
          <div className="space-y-4 mb-6">
            <Link
              to="/admin/create-business"
              className="flex items-center justify-between p-4 border-2 border-royal-purple rounded-lg hover:bg-purple-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-royal-purple/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal group-hover:text-royal-purple transition-colors">Create Business for User</h3>
                  <p className="text-sm text-gray-600">Create a new business and assign it to an existing user or create a new user</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-royal-purple transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        <section className="border-t pt-6">
          <h2 className="text-2xl font-semibold text-charcoal mb-4">Help & Documentation</h2>
          <div className="space-y-4">
            <Link
              to="/admin-guide"
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-old-gold/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-old-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal group-hover:text-royal-purple transition-colors">Admin Guide</h3>
                  <p className="text-sm text-gray-600">Complete guide for administrators</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-royal-purple transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            {user?.role === 'SUPERADMIN' && (
              <Link
                to="/super-admin-guide"
                className="flex items-center justify-between p-4 border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-charcoal group-hover:text-purple-700 transition-colors">Super Admin Guide</h3>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                        SUPERADMIN
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Master guide for system-wide administration</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
