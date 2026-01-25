import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Step1Welcome from './Step1Welcome';
import Step2CreateBusiness from './Step2CreateBusiness';
import Step3Complete from './Step3Complete';

export default function BusinessSetupWizard() {
  const { refreshBusinesses } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Refresh user data to ensure businesses are loaded
    await refreshBusinesses();
    // Navigate to dashboard - the guard will allow it since user now has a business
    navigate('/dashboard', { replace: true });
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
          aria-label={`Business setup step ${currentStep} of ${totalSteps}`}
        />
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {currentStep === 1 && <Step1Welcome onNext={nextStep} />}
          {currentStep === 2 && (
            <Step2CreateBusiness
              onNext={nextStep}
              onPrevious={previousStep}
            />
          )}
          {currentStep === 3 && (
            <Step3Complete
              onComplete={handleComplete}
              onPrevious={previousStep}
            />
          )}
        </div>
      </div>

      {/* Step Indicators */}
      <div className="pb-8 flex justify-center gap-2" role="tablist" aria-label="Business setup steps">
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
