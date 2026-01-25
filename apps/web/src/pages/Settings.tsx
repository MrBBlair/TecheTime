import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user, business } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-royal-purple">Settings</h1>
      
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-charcoal mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
              <p className="text-charcoal">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <p className="text-charcoal">{user?.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Business</label>
              <p className="text-charcoal">{business?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
              <p className="text-charcoal capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
        </section>

        <section className="border-t pt-6">
          <h2 className="text-2xl font-semibold text-charcoal mb-4">Help & Support</h2>
          <div className="space-y-4">
            <Link
              to="/user-guide"
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-royal-purple/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal group-hover:text-royal-purple transition-colors">User Guide</h3>
                  <p className="text-sm text-gray-600">Learn how to use Tech eTime</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-royal-purple transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
