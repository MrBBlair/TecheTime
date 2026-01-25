import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FormField from '../components/FormField';
import RememberMe from '../components/RememberMe';
import Logo from '../components/Logo';
import TestCredentials from '../components/TestCredentials';
import Footer from '../components/Footer';
import FloatingBackground from '../components/FloatingBackground';

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Load saved email if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, []);

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setLoading(true);

    try {
      await login(formData.email, formData.password);
      
      // Save email if remember me is checked
      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-white" aria-hidden>
          <div className="relative w-full h-full">
            <FloatingBackground />
          </div>
        </div>
        <TestCredentials />
        <div className="relative z-10 max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <Logo variant="adminLogin" alt="Tech eTime" className="mx-auto mb-6" priority />
              <h1 className="text-3xl font-bold text-royal-purple mb-2">Admin Sign In</h1>
              <p className="text-gray-600">Sign in to manage your workforce</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <FormField
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={(value) => {
                  setFormData({ ...formData, email: value });
                  if (errors.email) {
                    setErrors({ ...errors, email: validateEmail(value) });
                  }
                }}
                placeholder="admin@example.com"
                required
                autoComplete="email"
                error={errors.email}
                autoFocus
              />
              <FormField
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={(value) => {
                  setFormData({ ...formData, password: value });
                  if (errors.password) {
                    setErrors({ ...errors, password: validatePassword(value) });
                  }
                }}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                error={errors.password}
              />
              <RememberMe
                checked={formData.rememberMe}
                onChange={(checked) => setFormData({ ...formData, rememberMe: checked })}
              />
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-lg py-4"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
