import { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingContextType {
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  isSkipped: boolean;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_STORAGE_KEY = 'techetime_onboarding_completed';
const ONBOARDING_SKIPPED_KEY = 'techetime_onboarding_skipped';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [isCompleted, setIsCompleted] = useState(() => localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true');
  const [isSkipped, setIsSkipped] = useState(() => localStorage.getItem(ONBOARDING_SKIPPED_KEY) === 'true');

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep((s) => s + 1);
  };

  const previousStep = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const skipOnboarding = () => {
    setIsSkipped(true);
    localStorage.setItem(ONBOARDING_SKIPPED_KEY, 'true');
  };

  const completeOnboarding = () => {
    setIsCompleted(true);
    setIsSkipped(false);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    localStorage.removeItem(ONBOARDING_SKIPPED_KEY);
  };

  const resetOnboarding = () => {
    setIsCompleted(false);
    setIsSkipped(false);
    setCurrentStep(1);
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_SKIPPED_KEY);
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        totalSteps,
        isCompleted,
        isSkipped,
        goToStep,
        nextStep,
        previousStep,
        skipOnboarding,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
