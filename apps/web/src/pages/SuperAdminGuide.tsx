import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface GuideSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export default function SuperAdminGuide() {
  const { user } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  // Only SUPERADMIN can access this guide
  if (!user || user.role !== 'SUPERADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const sections: GuideSection[] = [
    {
      id: 'overview',
      title: 'Super Admin Overview',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Welcome to the Tech eTime Super Admin Guide! As a SUPERADMIN, you have elevated privileges 
            that allow you to manage the entire system across all businesses.
          </p>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <p className="text-sm text-purple-700">
              <strong>Super Admin Access:</strong> This guide is exclusively for SUPERADMIN users. 
              You have system-wide access and can manage any business in the Tech eTime platform.
            </p>
          </div>
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mt-4">
            <p className="text-sm text-red-700">
              <strong>⚠️ Security Notice:</strong> With great power comes great responsibility. 
              Always exercise caution when performing administrative actions. All actions are logged 
              for security auditing purposes.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'privileges',
      title: 'Super Admin Privileges',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">What Makes SUPERADMIN Different?</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li><strong>Cross-Business Access:</strong> Access any business in the system without being a member</li>
            <li><strong>Bypass Restrictions:</strong> All business membership checks are bypassed</li>
            <li><strong>Full Admin Rights:</strong> All OWNER and MANAGER privileges across all businesses</li>
            <li><strong>System-Wide Operations:</strong> Perform administrative tasks on any business</li>
          </ul>

          <h4 className="font-semibold text-charcoal mt-6">Access Levels Comparison</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Feature</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">WORKER</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">MANAGER</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">OWNER</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-purple-700 uppercase bg-purple-50">SUPERADMIN</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">Clock In/Out</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm bg-purple-50">✓</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">View Own Time Entries</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm bg-purple-50">✓</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">Manage Workers</td>
                  <td className="px-4 py-3 text-center text-sm">✗</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm bg-purple-50">✓</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">Manage Locations</td>
                  <td className="px-4 py-3 text-center text-sm">✗</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm bg-purple-50">✓</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">View Payroll Reports</td>
                  <td className="px-4 py-3 text-center text-sm">✗</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm bg-purple-50">✓</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">Access Own Business Only</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm">✓</td>
                  <td className="px-4 py-3 text-center text-sm bg-purple-50">✗</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">Access ALL Businesses</td>
                  <td className="px-4 py-3 text-center text-sm">✗</td>
                  <td className="px-4 py-3 text-center text-sm">✗</td>
                  <td className="px-4 py-3 text-center text-sm">✗</td>
                  <td className="px-4 py-3 text-center text-sm bg-purple-50 font-semibold text-purple-700">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: 'business-management',
      title: 'Cross-Business Management',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">Accessing Multiple Businesses</h4>
          <p className="text-gray-700">
            As a SUPERADMIN, you can access any business in the system. Here's how:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Use the business selector (if available) to switch between businesses</li>
            <li>Use the <code className="bg-gray-100 px-2 py-1 rounded">x-business-id</code> header in API requests</li>
            <li>Specify <code className="bg-gray-100 px-2 py-1 rounded">businessId</code> as a query parameter</li>
            <li>No business membership required - you have access to all businesses</li>
          </ol>

          <h4 className="font-semibold text-charcoal mt-6">Managing Businesses</h4>
          <p className="text-gray-700">
            You can perform all administrative tasks on any business:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>View and manage all locations</li>
            <li>View and manage all workers</li>
            <li>Generate payroll reports</li>
            <li>Manage time entries</li>
            <li>Configure kiosk mode</li>
            <li>Set pay rates</li>
          </ul>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mt-4">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> When accessing a business, ensure you're working with the correct business ID. 
              Double-check business names before making changes.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'user-management',
      title: 'User & Role Management',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">Creating SUPERADMIN Users</h4>
          <p className="text-gray-700">
            To create additional SUPERADMIN users, use the script provided in the backend:
          </p>
          <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
            <code>cd apps/api</code><br />
            <code>npm run create-superadmin</code>
          </div>
          <p className="text-gray-700 mt-2">
            Edit the script file (<code className="bg-gray-100 px-2 py-1 rounded">src/scripts/create-superadmin.ts</code>) 
            to add new SUPERADMIN users by their Firebase UID.
          </p>

          <h4 className="font-semibold text-charcoal mt-6">Role Hierarchy</h4>
          <div className="space-y-2 text-gray-700">
            <p>The role hierarchy from lowest to highest privilege:</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li><strong>WORKER:</strong> Can clock in/out, view own time entries</li>
              <li><strong>MANAGER:</strong> Can manage workers, locations, view reports</li>
              <li><strong>OWNER:</strong> Full business control, same as MANAGER</li>
              <li><strong>SUPERADMIN:</strong> System-wide access, all privileges across all businesses</li>
            </ol>
          </div>

          <h4 className="font-semibold text-charcoal mt-6">Best Practices</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Limit SUPERADMIN access to trusted personnel only</li>
            <li>Regularly audit SUPERADMIN user list</li>
            <li>Remove SUPERADMIN access when no longer needed</li>
            <li>Use regular OWNER/MANAGER roles when possible</li>
            <li>Document all SUPERADMIN actions for compliance</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'api-access',
      title: 'API Access & Headers',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">API Authentication</h4>
          <p className="text-gray-700">
            All API requests require authentication. As a SUPERADMIN, you can access any business:
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
{`// Standard authentication header
Authorization: Bearer <firebase-id-token>

// Business selection (SUPERADMIN can use any business ID)
X-Business-Id: <business-id>
// OR
?businessId=<business-id>`}
            </pre>
          </div>

          <h4 className="font-semibold text-charcoal mt-6">Business Selection</h4>
          <p className="text-gray-700">
            SUPERADMIN users can specify any business ID in requests:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li><strong>Header:</strong> <code className="bg-gray-100 px-2 py-1 rounded">X-Business-Id: &lt;business-id&gt;</code></li>
            <li><strong>Query Param:</strong> <code className="bg-gray-100 px-2 py-1 rounded">?businessId=&lt;business-id&gt;</code></li>
            <li><strong>Default:</strong> If not specified, uses user's default business (if any)</li>
          </ul>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-4">
            <p className="text-sm text-yellow-700">
              <strong>Important:</strong> Always verify you're working with the correct business before making changes. 
              Use business names and IDs carefully.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'security',
      title: 'Security & Best Practices',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">Security Responsibilities</h4>
          <p className="text-gray-700">
            As a SUPERADMIN, you have access to sensitive data across all businesses. Follow these security practices:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li><strong>Protect Credentials:</strong> Never share your SUPERADMIN credentials</li>
            <li><strong>Use Strong Passwords:</strong> Ensure Firebase Auth uses strong passwords</li>
            <li><strong>Audit Regularly:</strong> Review access logs and user activities</li>
            <li><strong>Limit Access:</strong> Only grant SUPERADMIN to trusted personnel</li>
            <li><strong>Monitor Changes:</strong> Keep track of all administrative actions</li>
            <li><strong>Report Issues:</strong> Immediately report any suspicious activity</li>
          </ul>

          <h4 className="font-semibold text-charcoal mt-6">Data Privacy</h4>
          <p className="text-gray-700">
            When accessing multiple businesses, respect data privacy:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Only access businesses when necessary for support or administration</li>
            <li>Do not share data between businesses without authorization</li>
            <li>Follow company policies and legal requirements (GDPR, etc.)</li>
            <li>Document reasons for accessing specific business data</li>
          </ul>

          <h4 className="font-semibold text-charcoal mt-6">Audit Trail</h4>
          <p className="text-gray-700">
            All SUPERADMIN actions should be logged:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>API requests are logged with user ID and business ID</li>
            <li>Firestore operations maintain timestamps</li>
            <li>Consider implementing additional audit logging for sensitive operations</li>
            <li>Regularly review logs for unusual patterns</li>
          </ul>

          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mt-4">
            <p className="text-sm text-red-700">
              <strong>⚠️ Critical:</strong> Any misuse of SUPERADMIN privileges may result in account termination 
              and legal consequences. Use these privileges responsibly.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">Common Issues</h4>
          
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold text-gray-800">Cannot Access a Business</h5>
              <p className="text-gray-700">
                As a SUPERADMIN, you should be able to access any business. If you're having issues:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Verify your role is set to 'SUPERADMIN' in Firestore</li>
                <li>Check that the business ID is correct</li>
                <li>Ensure your Firebase Auth token is valid</li>
                <li>Check browser console for error messages</li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-gray-800">API Returns 403 Forbidden</h5>
              <p className="text-gray-700">
                If you receive 403 errors:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Verify your authentication token is included</li>
                <li>Check that your user document has role: 'SUPERADMIN'</li>
                <li>Ensure isActive: true in your user document</li>
                <li>Try refreshing your Firebase Auth token</li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-gray-800">Business Not Found</h5>
              <p className="text-gray-700">
                If a business doesn't appear:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Verify the business ID exists in Firestore</li>
                <li>Check the businesses collection in Firebase Console</li>
                <li>Ensure the business hasn't been deleted</li>
              </ul>
            </div>
          </div>

          <h4 className="font-semibold text-charcoal mt-6">Verifying SUPERADMIN Status</h4>
          <p className="text-gray-700">
            To verify your SUPERADMIN status:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Check your user document in Firestore: <code className="bg-gray-100 px-2 py-1 rounded">users/&lt;your-uid&gt;</code></li>
            <li>Verify <code className="bg-gray-100 px-2 py-1 rounded">role: "SUPERADMIN"</code></li>
            <li>Ensure <code className="bg-gray-100 px-2 py-1 rounded">isActive: true</code></li>
            <li>Check Firebase Auth user exists and is active</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'scripts',
      title: 'Backend Scripts',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">Available Scripts</h4>
          <p className="text-gray-700">
            The backend includes several utility scripts for SUPERADMIN operations:
          </p>

          <div className="space-y-4">
            <div className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded">
              <h5 className="font-semibold text-gray-800">create-superadmin</h5>
              <p className="text-sm text-gray-700 mt-1">
                Creates or updates SUPERADMIN users
              </p>
              <div className="bg-gray-100 p-3 rounded mt-2 font-mono text-xs">
                <code>npm run create-superadmin</code>
              </div>
            </div>

            <div className="border-l-4 border-green-400 bg-green-50 p-4 rounded">
              <h5 className="font-semibold text-gray-800">seed</h5>
              <p className="text-sm text-gray-700 mt-1">
                Seeds the database with test data (demo business, workers, locations)
              </p>
              <div className="bg-gray-100 p-3 rounded mt-2 font-mono text-xs">
                <code>npm run seed</code>
              </div>
            </div>

            <div className="border-l-4 border-purple-400 bg-purple-50 p-4 rounded">
              <h5 className="font-semibold text-gray-800">backfill-pay-rates</h5>
              <p className="text-sm text-gray-700 mt-1">
                Backfills pay rates for workers who don't have them set
              </p>
              <div className="bg-gray-100 p-3 rounded mt-2 font-mono text-xs">
                <code>npm run backfill-pay-rates</code>
              </div>
            </div>
          </div>

          <h4 className="font-semibold text-charcoal mt-6">Running Scripts</h4>
          <p className="text-gray-700">
            All scripts are located in <code className="bg-gray-100 px-2 py-1 rounded">apps/api/src/scripts/</code>
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Navigate to the API directory: <code className="bg-gray-100 px-2 py-1 rounded">cd apps/api</code></li>
            <li>Ensure environment variables are set in <code className="bg-gray-100 px-2 py-1 rounded">.env</code></li>
            <li>Run the script: <code className="bg-gray-100 px-2 py-1 rounded">npm run &lt;script-name&gt;</code></li>
          </ol>
        </div>
      ),
    },
    {
      id: 'support',
      title: 'Support & Resources',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">Documentation</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li><strong>SUPERADMIN_SETUP.md:</strong> Setup and configuration guide</li>
            <li><strong>EMAIL_TEMPLATES.md:</strong> Email template documentation</li>
            <li><strong>README.md:</strong> General project documentation</li>
            <li><strong>DEPLOYMENT_GUIDE.md:</strong> Deployment instructions</li>
          </ul>

          <h4 className="font-semibold text-charcoal mt-6">Getting Help</h4>
          <p className="text-gray-700">
            If you encounter issues or need assistance:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Check the troubleshooting section above</li>
            <li>Review Firebase Console logs</li>
            <li>Check API server logs</li>
            <li>Contact the development team</li>
          </ul>

          <h4 className="font-semibold text-charcoal mt-6">System Information</h4>
          <div className="bg-gray-100 p-4 rounded-lg">
            <ul className="space-y-1 text-sm text-gray-700">
              <li><strong>Platform:</strong> Tech eTime</li>
              <li><strong>Backend:</strong> Node.js + Express + TypeScript</li>
              <li><strong>Database:</strong> Firebase Firestore</li>
              <li><strong>Authentication:</strong> Firebase Auth</li>
              <li><strong>Email:</strong> Postmark</li>
              <li><strong>AI:</strong> Google Gemini</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          to="/admin-settings"
          className="inline-flex items-center text-royal-purple hover:text-old-gold transition-colors mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Admin Settings
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-royal-purple">Super Admin Guide</h1>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
            SUPERADMIN ONLY
          </span>
        </div>
        <p className="text-gray-600 mt-2">Master guide for Tech eTime Super Administrators</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {sections.map((section) => (
          <div key={section.id} className="border-b last:border-b-0">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <h2 className="text-xl font-semibold text-charcoal">{section.title}</h2>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedSection === section.id ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSection === section.id && (
              <div className="px-6 py-4 bg-gray-50">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="font-semibold text-purple-900 mb-2">Remember</h3>
        <p className="text-sm text-purple-800">
          As a SUPERADMIN, you have the highest level of access in the Tech eTime system. 
          Use your privileges responsibly and always prioritize security and data privacy.
        </p>
      </div>
    </div>
  );
}
