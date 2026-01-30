export default function TermsAndConditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-royal-purple mb-6">Terms and Conditions</h1>
      <div className="prose prose-lg max-w-none text-charcoal space-y-6">
        <p className="text-sm text-gray-600 mb-8">
          Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">1. Acceptance of Terms</h2>
          <p>By accessing and using Tech eTime ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">2. Description of Service</h2>
          <p>Tech eTime is a workforce time clock and payroll reporting application provided by Tech ePhi. The Service allows businesses to manage employee time tracking, generate payroll reports, and export data in various formats. The Service is provided "as is" and "as available" without warranties of any kind.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">3. User Accounts and Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials, including PINs and passwords. You agree to: provide accurate, current, and complete information during registration; maintain and promptly update your account information; maintain the security of your account and notify us immediately of any unauthorized access; accept responsibility for all activities that occur under your account; ensure that all users under your business account comply with these Terms.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">4. Acceptable Use</h2>
          <p>You agree not to use the Service to: violate any applicable laws or regulations; infringe upon the rights of others; transmit any harmful, offensive, or illegal content; attempt to gain unauthorized access to the Service or related systems; interfere with or disrupt the Service or servers; use automated systems to access the Service without authorization; manipulate or falsify time tracking data.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">5. Data and Privacy</h2>
          <p>Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of information as described in the Privacy Policy.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">6. Intellectual Property</h2>
          <p>The Service, including its original content, features, and functionality, is owned by Tech ePhi and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">7. Termination</h2>
          <p>We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">8. Disclaimers and Limitations of Liability</h2>
          <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">9. Contact Information</h2>
          <p>If you have any questions about these Terms and Conditions, please contact us at Tech ePhi — Email: support@techephi.com — Website: <a href="https://techephi.com" className="text-royal-purple hover:underline">https://techephi.com</a></p>
        </section>
      </div>
    </div>
  );
}
