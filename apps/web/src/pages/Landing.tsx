import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import FloatingBackground from '../components/FloatingBackground';

export default function Landing() {
  const navigate = useNavigate();
  const { resetOnboarding } = useOnboarding();
  const { user } = useAuth();

  const handleSignIn = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    // Reset onboarding to ensure we can access it, then navigate to auth step
    resetOnboarding();
    // Navigate to onboarding with state indicating we want to skip to auth step
    setTimeout(() => {
      navigate('/onboarding', { state: { skipToAuth: true } });
    }, 0);
  };

  const handleGetStarted = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('Get Started button clicked');
    
    // If user is already logged in, check onboarding status
    if (user) {
      const onboardingCompleted = localStorage.getItem('techetime_onboarding_completed') === 'true';
      const onboardingSkipped = localStorage.getItem('techetime_onboarding_skipped') === 'true';
      
      // If onboarding is completed or skipped, go to dashboard
      if (onboardingCompleted || onboardingSkipped) {
        navigate('/dashboard', { replace: true });
        return;
      }
      
      // If user is logged in but onboarding not completed, go to onboarding
      // Don't reset onboarding - let them continue where they left off
      navigate('/onboarding', { replace: true });
      return;
    }
    
    // New user - reset onboarding and start fresh
    resetOnboarding();
    // Use setTimeout to ensure state updates propagate before navigation
    setTimeout(() => {
      console.log('Navigating to /onboarding');
      navigate('/onboarding');
    }, 0);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-white" aria-hidden>
          <div className="relative w-full h-full">
            <FloatingBackground />
          </div>
        </div>
        <div className="relative z-10 max-w-2xl w-full text-center">
          <Logo variant="landing" alt="Tech eTime" className="mx-auto mb-6" priority />
          <h1 className="sr-only">Tech eTime</h1>
          <p className="text-2xl text-old-gold mb-6 font-semibold">Time, looped into payroll.</p>
          <p className="text-lg mb-8 text-charcoal leading-relaxed">
            A featured application under the Tech ePhi platform. Manage your workforce time clock
            and generate payroll reports with ease.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleGetStarted}
              className="btn-primary bg-old-gold text-charcoal text-lg px-8 py-4 relative z-20 cursor-pointer"
              aria-label="Get started with Tech eTime"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={handleSignIn}
              className="text-royal-purple hover:text-purple-700 text-lg font-medium px-8 py-4 relative z-20 cursor-pointer underline underline-offset-4"
              aria-label="Sign in to Tech eTime"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
