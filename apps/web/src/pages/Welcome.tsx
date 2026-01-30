/**
 * Welcome Tour Page - Carousel/Slideshow with value props
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FloatingBackground } from '../components/FloatingBackground';
import { Logo } from '../components/Logo';
import { Clock, Users, TrendingUp, ChevronRight, X } from 'lucide-react';
import { OnboardingProgress } from '../components/OnboardingProgress';

const slides = [
  {
    icon: Clock,
    title: 'Simple Time Tracking',
    description: 'Replace traditional time clocks with a modern, mobile-first solution. Your team clocks in and out with just a PIN.',
  },
  {
    icon: Users,
    title: 'Manage Your Workforce',
    description: 'Add staff members, set pay rates, and manage multiple locations all from one dashboard.',
  },
  {
    icon: TrendingUp,
    title: 'Automated Payroll',
    description: 'Get instant payroll calculations with overtime and double-time support. Export reports with one click.',
  },
];

export function Welcome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleSkip = () => {
    // Mark welcome tour as seen (even if not logged in)
    localStorage.setItem('has_seen_welcome_tour', 'true');
    // Redirect to login - setup wizard requires authentication
    navigate('/login');
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // After last slide, mark as seen and redirect to login
      localStorage.setItem('has_seen_welcome_tour', 'true');
      navigate('/login');
    }
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <FloatingBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Skip Button */}
        <div className="container-padding pt-8">
          <button
            onClick={handleSkip}
            className="ml-auto flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Skip tour"
          >
            <X className="w-5 h-5" />
            Skip
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center container-padding section-spacing">
          <div className="w-full max-w-2xl text-center">
            {/* Progress Bar */}
            <div className="mb-8">
              <OnboardingProgress
                currentStep={1}
                totalSteps={2}
                stepLabels={['Welcome', 'Setup']}
              />
            </div>

            {/* Logo */}
            <div className="mb-12">
              <Logo variant="kioskBackground" />
            </div>

            {/* Slide Content */}
            <div className="mb-12 min-h-[300px] flex flex-col items-center justify-center">
              {slides.map((slide, index) => {
                const Icon = slide.icon;
                return (
                  <div
                    key={index}
                    className={`transition-all duration-500 ${
                      index === currentSlide
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 absolute translate-y-4'
                    }`}
                  >
                    <div className="mb-8 flex justify-center">
                      <div className="w-24 h-24 rounded-full bg-brand-purple/10 flex items-center justify-center">
                        <Icon className="w-12 h-12 text-brand-purple" />
                      </div>
                    </div>
                    <h2 className="text-4xl font-semibold text-gray-900 mb-4">
                      {slide.title}
                    </h2>
                    <p className="text-xl text-gray-600 leading-relaxed">
                      {slide.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center gap-2 mb-12">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? 'w-8 bg-brand-purple'
                      : 'w-2 bg-gray-300'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleNext}
                className="touch-target px-8 py-4 bg-brand-purple text-white rounded-lg font-medium shadow-lg hover:opacity-90 transition-opacity duration-200 flex items-center gap-2"
              >
                {currentSlide < slides.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </>
                ) : (
                  'Get Started'
                )}
              </button>
              {currentSlide === slides.length - 1 && (
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <a href="/login" className="text-brand-purple hover:underline font-medium">
                    Sign in
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
