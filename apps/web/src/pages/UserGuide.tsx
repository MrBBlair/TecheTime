import { useState } from 'react';
import { Link } from 'react-router-dom';

interface GuideSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export default function UserGuide() {
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');

  const sections: GuideSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Welcome to Tech eTime! This guide will help you understand how to use the time clock system.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> You'll need a 4-digit PIN provided by your administrator to clock in and out.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'clocking-in-out',
      title: 'Clocking In and Out',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">Using the Time Clock</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Navigate to the <strong>Time Clock</strong> page from the main menu</li>
            <li>Enter your 4-digit PIN using the on-screen keypad</li>
            <li>Select your location (if multiple locations are available)</li>
            <li>Tap <strong>"Clock In"</strong> or <strong>"Clock Out"</strong> as appropriate</li>
            <li>You'll see a confirmation message when your time entry is recorded</li>
          </ol>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-4">
            <p className="text-sm text-yellow-700">
              <strong>Tip:</strong> Make sure to clock out at the end of your shift. If you forget, contact your administrator.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'kiosk-mode',
      title: 'Using Kiosk Mode',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Kiosk mode is a simplified interface designed for shared devices at your workplace.
          </p>
          <h4 className="font-semibold text-charcoal">Features:</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Full-screen PIN pad for easy entry</li>
            <li>Large, touch-friendly buttons</li>
            <li>Automatic location selection (if configured)</li>
            <li>Quick confirmation after clocking in/out</li>
          </ul>
          <p className="text-gray-700 mt-4">
            To use kiosk mode, simply enter your PIN and follow the on-screen prompts.
          </p>
        </div>
      ),
    },
    {
      id: 'viewing-hours',
      title: 'Viewing Your Hours',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            While workers typically use the time clock interface, administrators can view and manage time entries through the Dashboard.
          </p>
          <p className="text-gray-700">
            If you need to check your hours or time entries, please contact your administrator or manager.
          </p>
        </div>
      ),
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-charcoal">Common Issues:</h4>
          <div className="space-y-3">
            <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded">
              <p className="font-semibold text-red-800 mb-1">Invalid PIN</p>
              <p className="text-sm text-red-700">
                If you receive an "Invalid PIN" error, verify that you're entering the correct 4-digit PIN. 
                Contact your administrator if you need your PIN reset.
              </p>
            </div>
            <div className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded">
              <p className="font-semibold text-blue-800 mb-1">Can't Clock Out</p>
              <p className="text-sm text-blue-700">
                If you're unable to clock out, you may already be clocked out. Check with your administrator 
                to verify your current status.
              </p>
            </div>
            <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded">
              <p className="font-semibold text-yellow-800 mb-1">Location Not Available</p>
              <p className="text-sm text-yellow-700">
                If your location doesn't appear in the dropdown, contact your administrator to ensure 
                your location is properly configured.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-charcoal mb-1">Q: What if I forget my PIN?</p>
              <p className="text-gray-700">A: Contact your administrator or manager to have your PIN reset.</p>
            </div>
            <div>
              <p className="font-semibold text-charcoal mb-1">Q: Can I clock in from my phone?</p>
              <p className="text-gray-700">A: Yes! Tech eTime is mobile-friendly and works on any device with internet access.</p>
            </div>
            <div>
              <p className="font-semibold text-charcoal mb-1">Q: What happens if I forget to clock out?</p>
              <p className="text-gray-700">A: Contact your administrator as soon as possible. They can manually adjust your time entry.</p>
            </div>
            <div>
              <p className="font-semibold text-charcoal mb-1">Q: Can I edit my time entries?</p>
              <p className="text-gray-700">A: Only administrators can edit time entries. Contact your administrator if you need corrections.</p>
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
          to="/settings"
          className="inline-flex items-center text-royal-purple hover:text-old-gold transition-colors mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Settings
        </Link>
        <h1 className="text-4xl font-bold text-royal-purple">User Guide</h1>
        <p className="text-gray-600 mt-2">Learn how to use Tech eTime effectively</p>
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
        <h3 className="font-semibold text-charcoal mb-2">Need More Help?</h3>
        <p className="text-gray-700 mb-4">
          If you can't find what you're looking for, contact your administrator or visit our support page.
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
