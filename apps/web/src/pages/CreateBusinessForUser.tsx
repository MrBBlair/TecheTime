import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import FormField from '../components/FormField';

type AssignmentType = 'existing' | 'new';

export default function CreateBusinessForUser() {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('existing');
  const [formData, setFormData] = useState({
    // Business fields
    businessName: '',
    timezone: 'America/New_York',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    // Existing user assignment
    userId: '',
    userEmail: '',
    // New user creation
    newUserEmail: '',
    newUserPassword: '',
    newUserFirstName: '',
    newUserLastName: '',
    newUserRole: 'OWNER' as 'OWNER' | 'MANAGER' | 'WORKER',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdData, setCreatedData] = useState<any>(null);

  // Only OWNER, MANAGER, and SUPERADMIN can access
  if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER' && user.role !== 'SUPERADMIN')) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">You do not have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'businessName':
        if (!value.trim()) return 'Business name is required';
        if (value.length > 100) return 'Business name is too long';
        return undefined;
      case 'userEmail':
        if (assignmentType === 'existing' && !value) return 'Email is required';
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return undefined;
      case 'userId':
        // userId is optional if userEmail is provided
        return undefined;
      case 'newUserEmail':
        if (assignmentType === 'new' && !value) return 'Email is required';
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return undefined;
      case 'newUserPassword':
        if (assignmentType === 'new' && !value) return 'Password is required';
        if (assignmentType === 'new' && value.length < 8) return 'Password must be at least 8 characters';
        return undefined;
      case 'newUserFirstName':
        if (assignmentType === 'new' && !value.trim()) return 'First name is required';
        return undefined;
      case 'newUserLastName':
        if (assignmentType === 'new' && !value.trim()) return 'Last name is required';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    
    // Always validate business name
    const businessNameError = validateField('businessName', formData.businessName);
    if (businessNameError) newErrors.businessName = businessNameError;
    
    if (assignmentType === 'existing') {
      // Must have either userId or userEmail
      if (!formData.userId && !formData.userEmail) {
        newErrors.userEmail = 'Either User ID or Email is required';
      } else {
        if (formData.userEmail) {
          const emailError = validateField('userEmail', formData.userEmail);
          if (emailError) newErrors.userEmail = emailError;
        }
      }
    } else {
      // Must have all new user fields
      const newUserEmailError = validateField('newUserEmail', formData.newUserEmail);
      if (newUserEmailError) newErrors.newUserEmail = newUserEmailError;
      
      const newUserPasswordError = validateField('newUserPassword', formData.newUserPassword);
      if (newUserPasswordError) newErrors.newUserPassword = newUserPasswordError;
      
      const newUserFirstNameError = validateField('newUserFirstName', formData.newUserFirstName);
      if (newUserFirstNameError) newErrors.newUserFirstName = newUserFirstNameError;
      
      const newUserLastNameError = validateField('newUserLastName', formData.newUserLastName);
      if (newUserLastNameError) newErrors.newUserLastName = newUserLastNameError;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const headers = await getAuthHeaders(true);
      
      // Build request body
      const requestBody: any = {
        businessName: formData.businessName.trim(),
        timezone: formData.timezone,
      };
      
      // Add optional business fields
      if (formData.address) requestBody.address = formData.address.trim();
      if (formData.city) requestBody.city = formData.city.trim();
      if (formData.state) requestBody.state = formData.state.trim();
      if (formData.zipCode) requestBody.zipCode = formData.zipCode.trim();
      if (formData.phone) requestBody.phone = formData.phone.trim();
      
      if (assignmentType === 'existing') {
        if (formData.userId) {
          requestBody.userId = formData.userId.trim();
        } else if (formData.userEmail) {
          requestBody.userEmail = formData.userEmail.toLowerCase().trim();
        }
      } else {
        requestBody.createNewUser = true;
        requestBody.newUserEmail = formData.newUserEmail.toLowerCase().trim();
        requestBody.newUserPassword = formData.newUserPassword;
        requestBody.newUserFirstName = formData.newUserFirstName.trim();
        requestBody.newUserLastName = formData.newUserLastName.trim();
        requestBody.newUserRole = formData.newUserRole;
      }
      
      const res = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to create business');
      }
      
      setCreatedData(data);
      setSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setCreatedData(null);
        // Optionally reset form or navigate
      }, 5000);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create business. Please try again.';
      setError(errorMessage);
      console.error('Create business error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-royal-purple">Create Business for User</h1>
          <button
            onClick={() => navigate('/admin-settings')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Admin Settings
          </button>
        </div>
        
        {success && createdData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">✓ Business Created Successfully!</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Business:</strong> {createdData.business?.name}</p>
              <p><strong>Business ID:</strong> {createdData.business?.id}</p>
              {createdData.userCreated && (
                <p className="mt-2"><strong>New user created:</strong> {createdData.user?.email}</p>
              )}
              {createdData.user && !createdData.userCreated && (
                <p className="mt-2"><strong>Assigned to user:</strong> {createdData.user?.email || createdData.user?.id}</p>
              )}
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-charcoal mb-4">Business Information</h2>
            <div className="space-y-4">
              <FormField
                label="Business Name *"
                name="businessName"
                value={formData.businessName}
                onChange={(value) => setFormData({ ...formData, businessName: value })}
                error={errors.businessName}
                required
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold mb-2 text-charcoal">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal-purple focus:border-transparent"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  </select>
                </div>
                
                <FormField
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <FormField
                label="Address"
                name="address"
                value={formData.address}
                onChange={(value) => setFormData({ ...formData, address: value })}
                placeholder="123 Main St"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={(value) => setFormData({ ...formData, city: value })}
                />
                
                <FormField
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={(value) => setFormData({ ...formData, state: value })}
                  placeholder="CA"
                />
                
                <FormField
                  label="ZIP Code"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={(value) => setFormData({ ...formData, zipCode: value })}
                  placeholder="12345"
                />
              </div>
            </div>
          </section>
          
          <section className="border-t pt-6">
            <h2 className="text-2xl font-semibold text-charcoal mb-4">User Assignment</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="assignmentType"
                    value="existing"
                    checked={assignmentType === 'existing'}
                    onChange={(e) => setAssignmentType(e.target.value as AssignmentType)}
                    className="mr-2"
                  />
                  Assign to Existing User
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="assignmentType"
                    value="new"
                    checked={assignmentType === 'new'}
                    onChange={(e) => setAssignmentType(e.target.value as AssignmentType)}
                    className="mr-2"
                  />
                  Create New User
                </label>
              </div>
            </div>
            
            {assignmentType === 'existing' ? (
              <div className="space-y-4">
                <FormField
                  label="User Email"
                  name="userEmail"
                  type="email"
                  value={formData.userEmail}
                  onChange={(value) => setFormData({ ...formData, userEmail: value })}
                  error={errors.userEmail}
                  placeholder="user@example.com"
                />
                <p className="text-xs text-gray-500">Enter the email of an existing user to assign this business to them</p>
                
                <div className="text-sm text-gray-600 mb-2 text-center">OR</div>
                
                <FormField
                  label="User ID"
                  name="userId"
                  value={formData.userId}
                  onChange={(value) => setFormData({ ...formData, userId: value })}
                  placeholder="Firebase User ID"
                />
                <p className="text-xs text-gray-500">Enter the Firebase User ID of an existing user</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Email *"
                    name="newUserEmail"
                    type="email"
                    value={formData.newUserEmail}
                    onChange={(value) => setFormData({ ...formData, newUserEmail: value })}
                    error={errors.newUserEmail}
                    required
                  />
                  
                  <FormField
                    label="Password *"
                    name="newUserPassword"
                    type="password"
                    value={formData.newUserPassword}
                    onChange={(value) => setFormData({ ...formData, newUserPassword: value })}
                    error={errors.newUserPassword}
                    required
                    minLength={8}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="First Name *"
                    name="newUserFirstName"
                    value={formData.newUserFirstName}
                    onChange={(value) => setFormData({ ...formData, newUserFirstName: value })}
                    error={errors.newUserFirstName}
                    required
                  />
                  
                  <FormField
                    label="Last Name *"
                    name="newUserLastName"
                    value={formData.newUserLastName}
                    onChange={(value) => setFormData({ ...formData, newUserLastName: value })}
                    error={errors.newUserLastName}
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-semibold mb-2 text-charcoal">
                    Role *
                  </label>
                  <select
                    value={formData.newUserRole}
                    onChange={(e) => setFormData({ ...formData, newUserRole: e.target.value as 'OWNER' | 'MANAGER' | 'WORKER' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal-purple focus:border-transparent"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="MANAGER">Manager</option>
                    <option value="WORKER">Worker</option>
                  </select>
                </div>
              </div>
            )}
          </section>
          
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-royal-purple text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Business'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin-settings')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
