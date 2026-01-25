import Logo from '../Logo';

interface Step1WelcomeProps {
  onNext: () => void;
}

export default function Step1Welcome({ onNext }: Step1WelcomeProps) {
  return (
    <div className="text-center space-y-8 animate-fade-in">
      <div>
        <Logo variant="onboarding" alt="Tech eTime" className="mx-auto mb-8" priority />
        <h1 className="text-4xl md:text-5xl font-bold text-royal-purple mb-4">
          Welcome to Tech eTime
        </h1>
        <p className="text-2xl text-old-gold mb-6 font-semibold">
          Time, looped into payroll.
        </p>
      </div>

      <div className="space-y-4 text-charcoal">
        <div className="flex items-start gap-4 text-left">
          <div className="flex-shrink-0 w-12 h-12 bg-royal-purple/10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Track Time Easily</h3>
            <p className="text-sm text-gray-600">Simple PIN-based clock in/out for your workforce</p>
          </div>
        </div>

        <div className="flex items-start gap-4 text-left">
          <div className="flex-shrink-0 w-12 h-12 bg-royal-purple/10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Generate Reports</h3>
            <p className="text-sm text-gray-600">Automated payroll reports with AI insights</p>
          </div>
        </div>

        <div className="flex items-start gap-4 text-left">
          <div className="flex-shrink-0 w-12 h-12 bg-royal-purple/10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Secure & Simple</h3>
            <p className="text-sm text-gray-600">Enterprise-grade security with an intuitive interface</p>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="btn-primary w-full text-lg py-4 mt-8"
        aria-label="Get started with Tech eTime"
      >
        Get Started
      </button>
    </div>
  );
}
