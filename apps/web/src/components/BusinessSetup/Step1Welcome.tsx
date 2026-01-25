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
          Complete Your Setup
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Let's get your business set up in just a few steps
        </p>
      </div>

      <div className="space-y-4 text-charcoal text-left">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-royal-purple/10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Create Your Business</h3>
            <p className="text-sm text-gray-600">Set up your business profile to get started</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-royal-purple/10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Quick & Easy</h3>
            <p className="text-sm text-gray-600">Takes less than 2 minutes to complete</p>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="btn-primary w-full text-lg py-4 mt-8"
        aria-label="Continue to business setup"
      >
        Continue
      </button>
    </div>
  );
}
