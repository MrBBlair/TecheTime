/**
 * Onboarding Progress Bar Component
 */

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  stepLabels,
}: OnboardingProgressProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-purple transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step Labels */}
      {stepLabels && (
        <div className="flex justify-between text-xs text-gray-600">
          {stepLabels.map((label, index) => (
            <span
              key={index}
              className={`transition-colors ${
                index < currentStep
                  ? 'text-brand-purple font-medium'
                  : index === currentStep
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Step Number */}
      <div className="text-center text-sm text-gray-600 mt-2">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );
}
