import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import FormField from '../FormField';
import RememberMe from '../RememberMe';

interface Step2AuthProps {
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
}

export default function Step2Auth({ onNext, onPrevious }: Step2AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    firstName: '',
    lastName: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loading: authLoading } = useAuth();

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email';
        return undefined;
      case 'password':
        if (!value) return 'Password is required';
        if (isSignUp && value.length < 8) return 'Password must be at least 8 characters';
        return undefined;
      case 'businessName':
        if (isSignUp && !value.trim()) return 'Business name is required';
        return undefined;
      case 'firstName':
        if (isSignUp && !value.trim()) return 'First name is required';
        return undefined;
      case 'lastName':
        if (isSignUp && !value.trim()) return 'Last name is required';
        return undefined;
      default:
        return undefined;
    }
  };

  // Prevent iOS Safari pull-to-refresh from closing the form
  useEffect(() => {
    let touchStartY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const touchDiff = touchY - touchStartY;
      
      // Only prevent pull-to-refresh when scrolling down from the top
      // Allow normal scrolling otherwise
      if (touchDiff > 0 && window.scrollY === 0) {
        const target = e.target as HTMLElement;
        // Prevent pull-to-refresh on form elements
        if (target.closest('form') || 
            target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'BUTTON') {
          e.preventDefault();
        }
      }
    };

    // Add touch event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setErrors({});

    const newErrors: { [key: string]: string } = {};
    if (isSignUp) {
      ['email', 'password', 'businessName', 'firstName', 'lastName'].forEach((field) => {
        const value = formData[field as keyof typeof formData];
        if (typeof value === 'string') {
          const error = validateField(field, value);
          if (error) newErrors[field] = error;
        }
      });
    } else {
      ['email', 'password'].forEach((field) => {
        const value = formData[field as keyof typeof formData];
        if (typeof value === 'string') {
          const error = validateField(field, value);
          if (error) newErrors[field] = error;
        }
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prevent multiple simultaneous submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      if (isSignUp) {
        await api.register({
          email: formData.email,
          password: formData.password,
          displayName: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim() || formData.email,
        });
        await login(formData.email, formData.password);
      } else {
        await login(formData.email, formData.password);
        if (formData.rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        }
      }
      
      // Wait for auth state to update and user data to load
      // The register/login functions now handle loading user data
      // Give it a moment to ensure everything is synced
      let attempts = 0;
      const maxAttempts = 50; // 50 * 100ms = 5 seconds max wait
      
      // Wait briefly for auth state change to trigger
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Wait for loading to complete (user data loaded)
      while (authLoading && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      // Proceed to next step - the OnboardingGuard will ensure user data is loaded
      // before allowing access to protected routes
      setIsSubmitting(false);
      setLoading(false);
      onNext();
    } catch (err: any) {
      // Display user-friendly error message
      const errorMessage = err.message || (isSignUp ? 'Registration failed. Please try again.' : 'Login failed. Please check your credentials.');
      setError(errorMessage);
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-royal-purple mb-2">
          {isSignUp ? 'Create Your Account' : 'Sign In'}
        </h2>
        <p className="text-gray-600">
          {isSignUp
            ? 'Get started with Tech eTime in seconds'
            : 'Welcome back! Sign in to continue'}
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setErrors({});
            setError('');
          }}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
            !isSignUp
              ? 'bg-royal-purple text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          aria-pressed={!isSignUp}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(true);
            setErrors({});
            setError('');
          }}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
            isSignUp
              ? 'bg-royal-purple text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          aria-pressed={isSignUp}
        >
          Sign Up
        </button>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className="space-y-5" 
        noValidate
        style={{ touchAction: 'manipulation', overscrollBehavior: 'contain' }}
      >
        {isSignUp && (
          <FormField
            label="Business Name"
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={(value) => {
              setFormData({ ...formData, businessName: value });
              if (errors.businessName) {
                const error = validateField('businessName', value);
                setErrors({ ...errors, businessName: error || '' });
              }
            }}
            placeholder="Your Business Name"
            required
            autoComplete="organization"
            error={errors.businessName}
            autoFocus
          />
        )}

        {isSignUp && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="First Name"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={(value) => {
                setFormData({ ...formData, firstName: value });
                if (errors.firstName) {
                  const error = validateField('firstName', value);
                  setErrors({ ...errors, firstName: error || '' });
                }
              }}
              placeholder="John"
              required
              autoComplete="given-name"
              error={errors.firstName}
            />
            <FormField
              label="Last Name"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={(value) => {
                setFormData({ ...formData, lastName: value });
                if (errors.lastName) {
                  const error = validateField('lastName', value);
                  setErrors({ ...errors, lastName: error || '' });
                }
              }}
              placeholder="Doe"
              required
              autoComplete="family-name"
              error={errors.lastName}
            />
          </div>
        )}

        <FormField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={(value) => {
            setFormData({ ...formData, email: value });
            if (errors.email) {
              const error = validateField('email', value);
              setErrors({ ...errors, email: error || '' });
            }
          }}
          placeholder="your.email@example.com"
          required
          autoComplete="email"
          error={errors.email}
          autoFocus={!isSignUp}
        />

        <FormField
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={(value) => {
            setFormData({ ...formData, password: value });
            if (errors.password) {
              const error = validateField('password', value);
              setErrors({ ...errors, password: error || '' });
            }
          }}
          placeholder={isSignUp ? 'Create a secure password' : 'Enter your password'}
          required
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          error={errors.password}
          minLength={isSignUp ? 8 : undefined}
        />

        {!isSignUp && (
          <RememberMe
            checked={formData.rememberMe}
            onChange={(checked) => setFormData({ ...formData, rememberMe: checked })}
          />
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onPrevious}
            className="btn-outline flex-1"
            aria-label="Go back to previous step"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading || isSubmitting || authLoading}
            className="btn-primary flex-1 text-lg py-4"
          >
            {loading || isSubmitting || authLoading ? (isSignUp ? 'Creating...' : 'Signing in...') : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  );
}
