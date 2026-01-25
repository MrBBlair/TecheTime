import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import FormField from '../components/FormField';

export default function CreateBusiness() {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerFirstName: '',
    ownerLastName: '',
  });
  const [errors, setErrors] = useState<{
    businessName?: string;
    ownerEmail?: string;
    ownerPassword?: string;
    ownerFirstName?: string;
    ownerLastName?: string;
  }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'businessName':
        if (!value.trim()) return 'Business name is required';
        return undefined;
      case 'ownerEmail':
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return undefined;
      case 'ownerPassword':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return undefined;
      case 'ownerFirstName':
        if (!value.trim()) return 'First name is required';
        return undefined;
      case 'ownerLastName':
        if (!value.trim()) return 'Last name is required';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const newErrors: typeof errors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key as keyof typeof errors] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.ownerEmail,
        formData.ownerPassword,
        formData.businessName,
        formData.ownerFirstName,
        formData.ownerLastName
      );
      // Registration successful - user data is now loaded in AuthContext
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      // Display user-friendly error message
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-12 mb-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-royal-purple mb-6">Create Business</h2>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FormField
              label="Business Name"
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={(value) => {
                setFormData({ ...formData, businessName: value });
                if (errors.businessName) {
                  setErrors({ ...errors, businessName: validateField('businessName', value) });
                }
              }}
              placeholder="Your Business Name"
              required
              autoComplete="organization"
              error={errors.businessName}
              autoFocus
            />
            <FormField
              label="Your Email"
              type="email"
              name="ownerEmail"
              value={formData.ownerEmail}
              onChange={(value) => {
                setFormData({ ...formData, ownerEmail: value });
                if (errors.ownerEmail) {
                  setErrors({ ...errors, ownerEmail: validateField('ownerEmail', value) });
                }
              }}
              placeholder="your.email@example.com"
              required
              autoComplete="email"
              error={errors.ownerEmail}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="First Name"
                type="text"
                name="ownerFirstName"
                value={formData.ownerFirstName}
                onChange={(value) => {
                  setFormData({ ...formData, ownerFirstName: value });
                  if (errors.ownerFirstName) {
                    setErrors({ ...errors, ownerFirstName: validateField('ownerFirstName', value) });
                  }
                }}
                placeholder="John"
                required
                autoComplete="given-name"
                error={errors.ownerFirstName}
              />
              <FormField
                label="Last Name"
                type="text"
                name="ownerLastName"
                value={formData.ownerLastName}
                onChange={(value) => {
                  setFormData({ ...formData, ownerLastName: value });
                  if (errors.ownerLastName) {
                    setErrors({ ...errors, ownerLastName: validateField('ownerLastName', value) });
                  }
                }}
                placeholder="Doe"
                required
                autoComplete="family-name"
                error={errors.ownerLastName}
              />
            </div>
            <FormField
              label="Password"
              type="password"
              name="ownerPassword"
              value={formData.ownerPassword}
              onChange={(value) => {
                setFormData({ ...formData, ownerPassword: value });
                if (errors.ownerPassword) {
                  setErrors({ ...errors, ownerPassword: validateField('ownerPassword', value) });
                }
              }}
              placeholder="Create a secure password"
              required
              autoComplete="new-password"
              error={errors.ownerPassword}
              minLength={8}
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
              {loading ? 'Creating...' : 'Create Business'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
