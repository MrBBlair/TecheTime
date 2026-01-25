import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import Step1Welcome from './Step1Welcome';
import Step2Auth from './Step2Auth';
import Step3Profile from './Step3Profile';
import Step4Tour from './Step4Tour';

export default function OnboardingFlow() {
  const { currentStep, totalSteps, nextStep, previousStep, skipOnboarding, completeOnboarding } = useOnboarding();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleComplete = () => {
    completeOnboarding();
    // Auto-login and navigate based on business status
    // Use setTimeout to ensure onboarding state is saved before navigation
    setTimeout(() => {
      if (user) {
        // Check if user has businesses - if not, redirect to setup wizard
        const businessIds = user.businessIds || (user.businessId ? [user.businessId] : []);
        if (businessIds.length === 0) {
          navigate('/setup', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        // Redirect to landing page after completing onboarding
        navigate('/', { replace: true });
      }
    }, 100);
  };

  const handleSkip = () => {
    skipOnboarding();
    // Redirect to landing page when skipping
    navigate('/', { replace: true });
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-1">
        <div
          className="bg-royal-purple h-1 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Onboarding step ${currentStep} of ${totalSteps}`}
        />
      </div>

      {/* Skip Button */}
      {currentStep < totalSteps && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleSkip}
            className="text-gray-600 hover:text-charcoal text-sm font-medium focus:outline-none focus:ring-2 focus:ring-royal-purple focus:ring-offset-2 rounded px-3 py-2 transition-colors"
            aria-label="Skip onboarding"
          >
            Skip
          </button>
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {currentStep === 1 && <Step1Welcome onNext={nextStep} />}
          {currentStep === 2 && (
            <Step2Auth
              onNext={nextStep}
              onPrevious={previousStep}
              onComplete={handleComplete}
            />
          )}
          {currentStep === 3 && (
            <Step3Profile
              onNext={nextStep}
              onPrevious={previousStep}
            />
          )}
          {currentStep === 4 && (
            <Step4Tour
              onComplete={handleComplete}
              onPrevious={previousStep}
            />
          )}
        </div>
      </div>

      {/* Step Indicators */}
      <div className="pb-8 flex justify-center gap-2" role="tablist" aria-label="Onboarding steps">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const step = index + 1;
          return (
            <button
              key={step}
              onClick={() => {}}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === currentStep
                  ? 'w-8 bg-royal-purple'
                  : step < currentStep
                  ? 'w-2 bg-old-gold'
                  : 'w-2 bg-gray-300'
              }`}
              aria-label={`Step ${step}${step === currentStep ? ', current step' : ''}`}
              aria-selected={step === currentStep}
              tabIndex={-1}
            />
          );
        })}
      </div>
    </div>
  );
}
