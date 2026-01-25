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
          <p>
            By accessing and using Tech eTime ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
            If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">2. Description of Service</h2>
          <p>
            Tech eTime is a workforce time clock and payroll reporting application provided by Tech ePhi. The Service allows businesses 
            to manage employee time tracking, generate payroll reports, and export data in various formats. The Service is provided 
            "as is" and "as available" without warranties of any kind.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">3. User Accounts and Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials, including PINs and passwords. 
            You agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security of your account and notify us immediately of any unauthorized access</li>
            <li>Accept responsibility for all activities that occur under your account</li>
            <li>Ensure that all users under your business account comply with these Terms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">4. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Transmit any harmful, offensive, or illegal content</li>
            <li>Attempt to gain unauthorized access to the Service or related systems</li>
            <li>Interfere with or disrupt the Service or servers connected to the Service</li>
            <li>Use automated systems to access the Service without authorization</li>
            <li>Manipulate or falsify time tracking data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">5. Data and Privacy</h2>
          <p>
            Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection 
            and use of information as described in the Privacy Policy. You are responsible for ensuring that you have obtained 
            all necessary consents from employees and other users whose data you input into the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">6. Intellectual Property</h2>
          <p>
            The Service, including its original content, features, and functionality, is owned by Tech ePhi and is protected by 
            international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not reproduce, 
            distribute, modify, create derivative works of, publicly display, or otherwise exploit any part of the Service without 
            our prior written permission.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">7. Payment and Billing</h2>
          <p>
            If you subscribe to a paid plan, you agree to pay all fees associated with your subscription. Fees are billed in advance 
            on a recurring basis. You are responsible for providing accurate billing information. We reserve the right to change 
            our pricing with reasonable notice. Refunds are provided at our discretion and in accordance with applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">8. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that 
            we believe violates these Terms or is harmful to other users, us, or third parties. You may terminate your account 
            at any time by contacting us. Upon termination, your right to use the Service will immediately cease.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">9. Disclaimers and Limitations of Liability</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
            WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
            PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
            OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, 
            USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">10. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Tech ePhi, its officers, directors, employees, and agents from and 
            against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of 
            or in any way connected with your access to or use of the Service, your violation of these Terms, or your violation 
            of any rights of another.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the 
            new Terms on this page and updating the "Last Updated" date. Your continued use of the Service after such modifications 
            constitutes your acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">12. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Tech ePhi operates, 
            without regard to its conflict of law provisions. Any disputes arising under or in connection with these Terms shall be 
            subject to the exclusive jurisdiction of the courts in that jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">13. Contact Information</h2>
          <p>
            If you have any questions about these Terms and Conditions, please contact us at:
          </p>
          <p>
            Tech ePhi<br />
            Email: support@techephi.com<br />
            Website: <a href="https://techephi.com" className="text-royal-purple hover:underline">https://techephi.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
