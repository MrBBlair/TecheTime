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
          <p>Tech eTime ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our workforce time clock and payroll reporting application ("the Service").</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">2. Information We Collect</h2>
          <p>We collect information that you provide directly to us, including: account information (business name, email, password); employee information (names, PINs hashed, hourly rates); time tracking data; location information; and payment information when you subscribe to a paid plan. We may also automatically collect device information, usage data, IP address, and cookies.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">3. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve the Service; process and manage time tracking and payroll data; authenticate users; send administrative information and notifications; respond to inquiries; detect and prevent security threats; and comply with legal obligations.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">4. Data Security</h2>
          <p>We implement appropriate technical and organizational security measures to protect your information against unauthorized access, alteration, disclosure, or destruction, including encryption, secure authentication, and hashing of sensitive information such as PINs.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-royal-purple mb-4">5. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy or our data practices, please contact us at Tech ePhi — Email: privacy@techephi.com — Website: <a href="https://techephi.com" className="text-royal-purple hover:underline">https://techephi.com</a></p>
        </section>
      </div>
    </div>
  );
}
