export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-royal-purple mb-6">Privacy Policy</h1>
      
      <div className="prose prose-lg max-w-none text-charcoal space-y-6">
        <p className="text-sm text-gray-600 mb-8">
          Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">1. Introduction</h2>
          <p>
            Tech eTime ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you use our workforce time clock and payroll reporting application 
            ("the Service"). Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, 
            please do not access the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold text-royal-purple mb-3 mt-4">2.1 Information You Provide</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Business name, email address, password, and other registration details</li>
            <li><strong>Employee Information:</strong> Names, PINs (hashed), hourly rates, and employment details</li>
            <li><strong>Time Tracking Data:</strong> Clock-in/clock-out times, locations, and related notes</li>
            <li><strong>Location Information:</strong> Business locations and addresses</li>
            <li><strong>Payment Information:</strong> Billing details if you subscribe to a paid plan (processed through secure third-party payment processors)</li>
          </ul>

          <h3 className="text-xl font-semibold text-royal-purple mb-3 mt-4">2.2 Automatically Collected Information</h3>
          <p>When you use the Service, we may automatically collect certain information, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Device information (device type, operating system, browser type)</li>
            <li>Usage data (pages visited, features used, time spent on the Service)</li>
            <li>IP address and general location information</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve the Service</li>
            <li>Process and manage time tracking and payroll data</li>
            <li>Authenticate users and prevent unauthorized access</li>
            <li>Send administrative information, updates, and notifications</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Detect, prevent, and address technical issues and security threats</li>
            <li>Comply with legal obligations and enforce our Terms and Conditions</li>
            <li>Generate aggregated, anonymized reports and analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">4. How We Share Your Information</h2>
          <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
          
          <h3 className="text-xl font-semibold text-royal-purple mb-3 mt-4">4.1 Service Providers</h3>
          <p>
            We may share information with third-party service providers who perform services on our behalf, such as:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Cloud hosting and data storage providers (Firebase/Google Cloud)</li>
            <li>Email service providers (Postmark)</li>
            <li>Payment processors</li>
            <li>Analytics and monitoring services</li>
          </ul>
          <p>These service providers are contractually obligated to protect your information and use it only for the purposes we specify.</p>

          <h3 className="text-xl font-semibold text-royal-purple mb-3 mt-4">4.2 Legal Requirements</h3>
          <p>
            We may disclose your information if required to do so by law or in response to valid requests by public authorities 
            (e.g., a court or government agency).
          </p>

          <h3 className="text-xl font-semibold text-royal-purple mb-3 mt-4">4.3 Business Transfers</h3>
          <p>
            In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. 
            We will notify you of any such change in ownership or control.
          </p>

          <h3 className="text-xl font-semibold text-royal-purple mb-3 mt-4">4.4 With Your Consent</h3>
          <p>We may share your information with your explicit consent or at your direction.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your information against unauthorized 
            access, alteration, disclosure, or destruction. These measures include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption of data in transit and at rest</li>
            <li>Secure authentication and access controls</li>
            <li>Regular security assessments and updates</li>
            <li>Hashing of sensitive information such as PINs</li>
            <li>Firewall and intrusion detection systems</li>
          </ul>
          <p>
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use 
            commercially acceptable means to protect your information, we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">6. Data Retention</h2>
          <p>
            We retain your information for as long as necessary to provide the Service, comply with legal obligations, resolve disputes, 
            and enforce our agreements. When you delete your account, we will delete or anonymize your personal information, except 
            where we are required to retain it for legal or legitimate business purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">7. Your Rights and Choices</h2>
          <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Request access to your personal information</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
            <li><strong>Opt-out:</strong> Opt out of certain data processing activities</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">8. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on the Service and hold certain information. 
            Cookies are files with a small amount of data that may include an anonymous unique identifier. You can instruct your 
            browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, 
            you may not be able to use some portions of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">9. Children's Privacy</h2>
          <p>
            The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information 
            from children. If you become aware that a child has provided us with personal information, please contact us, and 
            we will take steps to delete such information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">10. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence. These countries 
            may have data protection laws that differ from those in your country. By using the Service, you consent to the transfer 
            of your information to these countries.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
            on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. 
            Changes to this Privacy Policy are effective when they are posted on this page.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">12. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <p>
            Tech ePhi<br />
            Email: privacy@techephi.com<br />
            Website: <a href="https://techephi.com" className="text-royal-purple hover:underline">https://techephi.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
