import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface GuideSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export default function AdminGuide() {
  const { user } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  // Only OWNER, MANAGER, and SUPERADMIN can access admin guide
  if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER' && user.role !== 'SUPERADMIN')) {
    return <Navigate to="/dashboard" replace />;
  }

  const sections: GuideSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Welcome to the Tech eTime Admin Guide! This comprehensive guide will help you manage your workforce, 
            locations, time tracking, and payroll reporting.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-sm text-blue-700">
              <strong>Admin Access:</strong> This guide is only accessible to users with OWNER, MANAGER, or SUPERADMIN roles.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'dashboard',
      title: 'Dashboard Management',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">Managing Locations</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Navigate to the <strong>Dashboard</strong> and select the <strong>"Locations"</strong> tab</li>
            <li>Click <strong>"Add Location"</strong> to create a new location</li>
            <li>Enter the location name (required) and address (optional)</li>
            <li>Click <strong>"Create Location"</strong> to save</li>
          </ol>
          
          <h4 className="font-semibold text-charcoal mt-6">Managing Workers</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Select the <strong>"Workers"</strong> tab in the Dashboard</li>
            <li>Click <strong>"Add Worker"</strong> to create a new worker</li>
            <li>Enter the worker's first name, last name, and optional hourly rate</li>
            <li>Click <strong>"Create Worker"</strong> to save</li>
            <li>After creating a worker, click <strong>"Set PIN"</strong> or <strong>"Reset PIN"</strong> to generate a 4-digit PIN</li>
            <li><strong>Important:</strong> Save the PIN immediately - it will only be shown once!</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'time-clock',
      title: 'Time Clock Features',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">Admin Clock View</h4>
          <p className="text-gray-700">
            As an administrator, you can manually clock workers in and out from the Time Clock page.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Navigate to <strong>Time Clock</strong> from the main menu</li>
            <li>Select a worker from the dropdown</li>
            <li>Choose the location</li>
            <li>Click <strong>"Clock In"</strong> or <strong>"Clock Out"</strong> as needed</li>
          </ol>
          
          <h4 className="font-semibold text-charcoal mt-6">Worker PIN System</h4>
          <p className="text-gray-700">
            Workers can clock in/out using their 4-digit PIN. The system automatically toggles between clock in and clock out.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-4">
            <p className="text-sm text-yellow-700">
              <strong>Security:</strong> PINs are hashed and never stored in plain text. Only one open shift is allowed per worker.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'kiosk-mode',
      title: 'Kiosk Mode Setup',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">Setting Up Kiosk Mode</h4>
          <p className="text-gray-700">
            Kiosk mode allows you to set up a dedicated device for workers to clock in/out using their PINs.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Navigate to the <strong>Dashboard</strong> and select the <strong>"Kiosk Mode"</strong> tab</li>
            <li>Click <strong>"Enable Kiosk on This Device"</strong></li>
            <li>Enter a name for the device (e.g., "Main Entrance Tablet")</li>
            <li>The device will automatically redirect to kiosk mode</li>
            <li>Workers can now use this device to clock in/out with their PINs</li>
          </ol>
          
          <h4 className="font-semibold text-charcoal mt-6">Managing Kiosk Sessions</h4>
          <p className="text-gray-700">
            You can revoke kiosk sessions at any time from the Dashboard. This is useful when:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>A device is lost or stolen</li>
            <li>You need to change kiosk settings</li>
            <li>A device needs to be reassigned</li>
          </ul>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mt-4">
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> Kiosk mode works on any device - tablets, phones, or computers. 
              It provides a full-screen, simplified interface perfect for shared workplace devices.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'payroll',
      title: 'Payroll Reports',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">Generating Payroll Reports</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Navigate to the <strong>Payroll</strong> page from the main menu</li>
            <li>Select a date range using the date picker</li>
            <li>Optionally filter by worker or location</li>
            <li>Click <strong>"Generate Report"</strong> to view the payroll data</li>
            <li>Click <strong>"Export CSV"</strong> to download the report</li>
          </ol>
          
          <h4 className="font-semibold text-charcoal mt-6">Report Features</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li><strong>Total Hours:</strong> Calculated from clock in/out times</li>
            <li><strong>Hourly Rate:</strong> Uses the effective rate for the selected period</li>
            <li><strong>Gross Pay:</strong> Hours × Hourly Rate</li>
            <li><strong>Filtering:</strong> Filter by worker, location, or date range</li>
            <li><strong>CSV Export:</strong> Download reports for payroll processing</li>
          </ul>
          
          <h4 className="font-semibold text-charcoal mt-6">AI Insights (Optional)</h4>
          <p className="text-gray-700">
            If AI features are enabled, you'll see:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Natural language summaries of payroll reports</li>
            <li>Anomaly detection (missing clock-outs, unusually long shifts)</li>
            <li>Smart insights and recommendations</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'pay-rates',
      title: 'Managing Pay Rates',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Pay rates can be set when creating a worker or updated later. The system tracks pay rate history, 
            so payroll calculations use the correct rate for each time period.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-sm text-yellow-700">
              <strong>Important:</strong> Pay rates are stored in cents to avoid floating-point precision issues. 
              When entering rates, use decimal format (e.g., 25.00 for $25/hour).
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'security',
      title: 'Security Best Practices',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">PIN Management</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>PINs are automatically generated as 4-digit numbers</li>
            <li>PINs are hashed using bcrypt before storage</li>
            <li>Reset PINs immediately if a worker's PIN is compromised</li>
            <li>Never share PINs via insecure channels</li>
          </ul>
          
          <h4 className="font-semibold text-charcoal mt-6">Account Security</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Use strong passwords for admin accounts</li>
            <li>Only grant MANAGER role to trusted users</li>
            <li>Regularly review active workers and locations</li>
            <li>Revoke kiosk sessions for unused or lost devices</li>
          </ul>
          
          <h4 className="font-semibold text-charcoal mt-6">Data Protection</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>All data is scoped by businessId for multi-tenant security</li>
            <li>Time entries are immutable - corrections require manual adjustment</li>
            <li>Regular backups are recommended for critical data</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">Common Issues</h4>
          <div className="space-y-3">
            <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded">
              <p className="font-semibold text-red-800 mb-1">Worker Can't Clock In</p>
              <p className="text-sm text-red-700">
                Check if the worker already has an open shift. Only one open shift is allowed per worker. 
                Manually clock them out if needed.
              </p>
            </div>
            <div className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded">
              <p className="font-semibold text-blue-800 mb-1">Payroll Report Shows Zero Hours</p>
              <p className="text-sm text-blue-700">
                Verify that workers have clocked out for all shifts. Open shifts are excluded from payroll totals. 
                Check the date range and ensure time entries exist for the selected period.
              </p>
            </div>
            <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded">
              <p className="font-semibold text-yellow-800 mb-1">Kiosk Mode Not Working</p>
              <p className="text-sm text-yellow-700">
                Ensure the kiosk session hasn't been revoked. Check the device's internet connection. 
                Try disabling and re-enabling kiosk mode.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

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
        <h1 className="text-4xl font-bold text-royal-purple">Admin Guide</h1>
        <p className="text-gray-600 mt-2">Complete guide for Tech eTime administrators</p>
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

      <div className="bg-old-gold/10 border border-old-gold/30 rounded-lg p-6">
        <h3 className="font-semibold text-charcoal mb-2">Need Additional Support?</h3>
        <p className="text-gray-700 mb-4">
          For technical support, feature requests, or questions about your account, visit our support page.
        </p>
        <a
          href="https://techephi.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-royal-purple hover:text-old-gold transition-colors font-semibold"
        >
          Visit Tech ePhi Support
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
