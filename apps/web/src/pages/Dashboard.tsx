import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TimeEntryLog from '../components/TimeEntryLog';
import type { Location, User } from '@techetime/shared';

// Worker card component with collapsible time entry log
function WorkerCard({ worker, onResetPin, onEdit, locations }: { worker: User; onResetPin: (id: string) => void; onEdit: (worker: User) => void; locations: Location[] }) {
  const [showLog, setShowLog] = useState(false);
  
  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        <div className="flex-1">
          <button
            onClick={() => onEdit(worker)}
            className="text-left hover:text-royal-purple transition-colors cursor-pointer"
          >
            <h3 className="font-semibold text-charcoal text-lg hover:text-royal-purple transition-colors">{worker.firstName} {worker.lastName}</h3>
          </button>
          <div className="text-sm text-gray-600 space-y-1">
            {worker.workerId && (
              <p>ID#: {worker.workerId}</p>
            )}
            <p>PIN: {worker.pinEnabled ? 'Enabled' : 'Not Set'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLog(!showLog)}
            className="btn-secondary text-sm"
          >
            {showLog ? 'Hide' : 'Show'} Activity
          </button>
          <button
            onClick={() => onResetPin(worker.id)}
            className="btn-secondary text-sm"
          >
            {worker.pinEnabled ? 'Reset PIN' : 'Set PIN'}
          </button>
        </div>
      </div>
      {showLog && (
        <div className="p-4 bg-gray-50 border-t">
          <h4 className="text-sm font-semibold text-charcoal mb-3">Activity (Last 3 Weeks)</h4>
          <TimeEntryLog userId={worker.id} days={21} locations={locations} />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, getAuthHeaders, selectedBusinessId, firebaseUser, businesses } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'locations' | 'workers' | 'kiosk'>('locations');
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<User | null>(null);
  const [locationForm, setLocationForm] = useState({ name: '', address: '', timezone: 'America/New_York' });
  const [workerForm, setWorkerForm] = useState({ firstName: '', lastName: '', workerId: '', phoneNumber: '', hourlyRate: '' });
  const [editWorkerForm, setEditWorkerForm] = useState({ firstName: '', lastName: '', workerId: '', phoneNumber: '', hourlyRate: '' });
  const [showUpdateSummary, setShowUpdateSummary] = useState(false);
  const [updateSummary, setUpdateSummary] = useState<{ changes: string[]; updatedPin?: string } | null>(null);
  const [showEnableKioskModal, setShowEnableKioskModal] = useState(false);
  const [enableKioskDeviceName, setEnableKioskDeviceName] = useState('');

  useEffect(() => {
    loadData();
  }, [user, selectedBusinessId, firebaseUser]);

  // Listen for business changes
  useEffect(() => {
    const handleBusinessChange = () => {
      loadData();
    };
    window.addEventListener('businessChanged', handleBusinessChange);
    return () => window.removeEventListener('businessChanged', handleBusinessChange);
  }, []);

  async function loadData() {
    if (!user) {
      setLoading(false);
      return;
    }
    
    if (!firebaseUser) {
      console.log('Dashboard: Waiting for Firebase user authentication...');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Dashboard: Loading data with auth headers...');
      const headers = await getAuthHeaders();
      
      // Debug: Log headers (but not the token itself)
      const headersObj = headers as Record<string, string>;
      console.log('Dashboard: Auth headers prepared', {
        hasAuthorization: !!headersObj['Authorization'],
        hasBusinessId: !!headersObj['X-Business-Id'],
        businessId: headersObj['X-Business-Id']
      });
      
      // Verify Authorization header is present
      if (!headersObj['Authorization']) {
        console.error('Dashboard: No authorization token in headers');
        console.error('Dashboard: firebaseUser exists?', !!firebaseUser);
        setLoading(false);
        return;
      }
      
      const [locRes, workerRes] = await Promise.all([
        fetch('/api/admin/locations', { headers }),
        fetch('/api/admin/users', { headers }),
      ]);
      
      if (!locRes.ok || !workerRes.ok) {
        const errorText = await locRes.text().catch(() => '') || await workerRes.text().catch(() => '');
        console.error('Dashboard: API error', {
          locationsStatus: locRes.status,
          usersStatus: workerRes.status,
          errorText
        });
        throw new Error(`API error: ${locRes.status} ${workerRes.status}`);
      }
      
      setLocations(await locRes.json());
      setWorkers((await workerRes.json()).filter((u: User) => u.role === 'WORKER'));
      console.log('Dashboard: Data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createLocation() {
    const headers: HeadersInit = {};
    const authHeaders = await getAuthHeaders(true);
    Object.assign(headers, authHeaders);
    
    const res = await fetch('/api/admin/locations', {
      method: 'POST',
      headers,
      body: JSON.stringify(locationForm),
    });
    if (res.ok) {
      await loadData();
      setShowLocationForm(false);
      setLocationForm({ name: '', address: '', timezone: 'America/New_York' });
    }
  }

  async function createWorker() {
    const headers: HeadersInit = {};
    const authHeaders = await getAuthHeaders(true);
    Object.assign(headers, authHeaders);
    
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        role: 'WORKER',
        firstName: workerForm.firstName,
        lastName: workerForm.lastName,
        workerId: workerForm.workerId || undefined,
        phoneNumber: workerForm.phoneNumber || undefined,
        hourlyRate: workerForm.hourlyRate ? parseFloat(workerForm.hourlyRate) : undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      await loadData();
      setShowWorkerForm(false);
      setWorkerForm({ firstName: '', lastName: '', workerId: '', phoneNumber: '', hourlyRate: '' });
      
      // Show PIN if it was auto-generated from phone number
      if (data.initialPin) {
        alert(`Worker created successfully!\n\nInitial PIN: ${data.initialPin}\n(This is the last 4 digits of their phone number)`);
      }
    }
  }

  async function resetPin(workerId: string) {
    const headers: HeadersInit = {};
    const authHeaders = await getAuthHeaders();
    Object.assign(headers, authHeaders);
    
    const res = await fetch(`/api/admin/users/${workerId}/pin/reset`, {
      method: 'POST',
      headers,
    });
    const data = await res.json();
    if (res.ok) {
      alert(`PIN reset successfully. New PIN: ${data.pin}`);
      await loadData();
    }
  }

  function handleEditWorker(worker: User) {
    setEditingWorker(worker);
    // Get current hourly rate - we'll need to fetch it or use a default
    setEditWorkerForm({
      firstName: worker.firstName || '',
      lastName: worker.lastName || '',
      workerId: worker.workerId || '',
      phoneNumber: worker.phoneNumber || '',
      hourlyRate: '', // Will need to fetch current rate separately if needed
    });
  }

  async function updateWorker() {
    if (!editingWorker) return;

    const headers: HeadersInit = {};
    const authHeaders = await getAuthHeaders(true);
    Object.assign(headers, authHeaders);

    const updateData: any = {
      firstName: editWorkerForm.firstName,
      lastName: editWorkerForm.lastName,
      workerId: editWorkerForm.workerId || null,
      phoneNumber: editWorkerForm.phoneNumber,
    };

    if (editWorkerForm.hourlyRate) {
      updateData.hourlyRate = parseFloat(editWorkerForm.hourlyRate);
    }

    const res = await fetch(`/api/admin/users/${editingWorker.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updateData),
    });

    if (res.ok) {
      const data = await res.json();
      await loadData();
      setEditingWorker(null);
      setEditWorkerForm({ firstName: '', lastName: '', workerId: '', phoneNumber: '', hourlyRate: '' });
      
      // Show update summary popup if there are changes
      if (data.changes && data.changes.length > 0) {
        setUpdateSummary({
          changes: data.changes,
          updatedPin: data.updatedPin || undefined,
        });
        setShowUpdateSummary(true);
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
          setShowUpdateSummary(false);
          setUpdateSummary(null);
        }, 8000);
      }
    } else {
      const error = await res.json();
      alert(`Failed to update worker: ${error.error || 'Unknown error'}`);
    }
  }

  async function enableKiosk() {
    const deviceName = enableKioskDeviceName.trim();
    if (!deviceName) return;
    
    const headers: HeadersInit = {};
    const authHeaders = await getAuthHeaders(true);
    Object.assign(headers, authHeaders);
    
    const res = await fetch('/api/admin/kiosk/enable', {
      method: 'POST',
      headers,
      body: JSON.stringify({ deviceName }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('deviceSessionId', data.id);
      setShowEnableKioskModal(false);
      setEnableKioskDeviceName('');
      window.location.href = '/kiosk';
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to enable Kiosk mode');
    }
  }

  // Check if user has businesses - if not, redirect to setup wizard
  const userBusinessIds = user?.businessIds || (user?.businessId ? [user.businessId] : []);
  const hasBusiness = businesses.length > 0 || userBusinessIds.length > 0;

  // If no business, redirect to setup wizard (which handles business creation)
  useEffect(() => {
    if (!loading && user && !hasBusiness) {
      navigate('/setup', { replace: true });
    }
  }, [loading, user, hasBusiness, navigate]);

  // Show loading or redirect message while checking
  if (!loading && user && !hasBusiness) {
    return (
      <div className="text-center py-12 text-charcoal">
        <p>Redirecting to business setup...</p>
      </div>
    );
  }

  if (loading) return <div className="text-center py-12 text-charcoal">Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-royal-purple">Dashboard</h1>
      
      <div className="flex gap-2 border-b">
        <button
          className={`px-6 py-3 font-semibold ${activeTab === 'locations' ? 'border-b-2 border-royal-purple text-royal-purple' : 'text-gray-700'}`}
          onClick={() => setActiveTab('locations')}
        >
          Locations
        </button>
        <button
          className={`px-6 py-3 font-semibold ${activeTab === 'workers' ? 'border-b-2 border-royal-purple text-royal-purple' : 'text-gray-700'}`}
          onClick={() => setActiveTab('workers')}
        >
          Workers
        </button>
        <button
          className={`px-6 py-3 font-semibold ${activeTab === 'kiosk' ? 'border-b-2 border-royal-purple text-royal-purple' : 'text-gray-700'}`}
          onClick={() => setActiveTab('kiosk')}
        >
          Kiosk Mode
        </button>
      </div>

      {activeTab === 'locations' && (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-charcoal">Locations</h2>
            <button onClick={() => setShowLocationForm(!showLocationForm)} className="btn-primary">
              {showLocationForm ? 'Cancel' : 'Add Location'}
            </button>
          </div>
          {showLocationForm && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                createLocation();
              }}
              className="border-t pt-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold mb-2 text-charcoal">
                  Location Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="locationName"
                  placeholder="Main Office"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  required
                  autoComplete="organization"
                  className="w-full"
                  autoFocus
                  onFocus={(e) => {
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const nextInput = e.currentTarget.form?.querySelector('input[name="address"]') as HTMLInputElement;
                      nextInput?.focus();
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-charcoal">Address (optional)</label>
                <input
                  type="text"
                  name="address"
                  placeholder="123 Main St, City, State ZIP"
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                  autoComplete="street-address"
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      createLocation();
                    }
                  }}
                />
              </div>
              <button type="submit" className="btn-primary w-full">Create Location</button>
            </form>
          )}
          <div className="space-y-2">
            {locations.map((loc) => (
              <div key={loc.id} className="p-4 border rounded-lg bg-white">
                <h3 className="font-semibold text-charcoal">{loc.name}</h3>
                {loc.address && <p className="text-sm text-gray-600">{loc.address}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'workers' && (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-charcoal">Workers</h2>
            <button onClick={() => setShowWorkerForm(!showWorkerForm)} className="btn-primary">
              {showWorkerForm ? 'Cancel' : 'Add Worker'}
            </button>
          </div>
          {showWorkerForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createWorker();
              }}
              className="border-t pt-4 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-charcoal">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="John"
                    value={workerForm.firstName}
                    onChange={(e) => setWorkerForm({ ...workerForm, firstName: e.target.value })}
                    required
                    autoComplete="given-name"
                    className="w-full"
                    autoFocus
                    onFocus={(e) => {
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 300);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const nextInput = e.currentTarget.form?.querySelector('input[name="lastName"]') as HTMLInputElement;
                        nextInput?.focus();
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-charcoal">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Doe"
                    value={workerForm.lastName}
                    onChange={(e) => setWorkerForm({ ...workerForm, lastName: e.target.value })}
                    required
                    autoComplete="family-name"
                    className="w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const nextInput = e.currentTarget.form?.querySelector('input[name="workerId"]') as HTMLInputElement;
                        nextInput?.focus();
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-charcoal">
                  ID# (optional)
                </label>
                <input
                  type="text"
                  name="workerId"
                  placeholder="W001"
                  value={workerForm.workerId}
                  onChange={(e) => setWorkerForm({ ...workerForm, workerId: e.target.value })}
                  autoComplete="off"
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const nextInput = e.currentTarget.form?.querySelector('input[name="phoneNumber"]') as HTMLInputElement;
                      nextInput?.focus();
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-charcoal">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="(555) 123-4567"
                  value={workerForm.phoneNumber}
                  onChange={(e) => setWorkerForm({ ...workerForm, phoneNumber: e.target.value })}
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const nextInput = e.currentTarget.form?.querySelector('input[name="hourlyRate"]') as HTMLInputElement;
                      nextInput?.focus();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">PIN will be set to the last 4 digits of this number</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-charcoal">Hourly Rate (optional)</label>
                <input
                  type="number"
                  name="hourlyRate"
                  step="0.01"
                  min="0"
                  placeholder="25.00"
                  value={workerForm.hourlyRate}
                  onChange={(e) => setWorkerForm({ ...workerForm, hourlyRate: e.target.value })}
                  autoComplete="off"
                  inputMode="decimal"
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      createWorker();
                    }
                  }}
                />
              </div>
              <button type="submit" className="btn-primary w-full">Create Worker</button>
            </form>
          )}
          <div className="space-y-4">
            {workers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onResetPin={resetPin}
                onEdit={handleEditWorker}
                locations={locations}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edit Worker Modal */}
      {editingWorker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-royal-purple mb-6">Edit Worker Account</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateWorker();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-charcoal">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="John"
                      value={editWorkerForm.firstName}
                      onChange={(e) => setEditWorkerForm({ ...editWorkerForm, firstName: e.target.value })}
                      required
                      autoComplete="given-name"
                      className="w-full"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const nextInput = e.currentTarget.form?.querySelector('input[name="lastName"]') as HTMLInputElement;
                          nextInput?.focus();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-charcoal">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Doe"
                      value={editWorkerForm.lastName}
                      onChange={(e) => setEditWorkerForm({ ...editWorkerForm, lastName: e.target.value })}
                      required
                      autoComplete="family-name"
                      className="w-full"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const nextInput = e.currentTarget.form?.querySelector('input[name="workerId"]') as HTMLInputElement;
                          nextInput?.focus();
                        }
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-charcoal">
                    ID# (optional)
                  </label>
                  <input
                    type="text"
                    name="workerId"
                    placeholder="W001"
                    value={editWorkerForm.workerId}
                    onChange={(e) => setEditWorkerForm({ ...editWorkerForm, workerId: e.target.value })}
                    autoComplete="off"
                    className="w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const nextInput = e.currentTarget.form?.querySelector('input[name="phoneNumber"]') as HTMLInputElement;
                        nextInput?.focus();
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-charcoal">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="(555) 123-4567"
                    value={editWorkerForm.phoneNumber}
                    onChange={(e) => setEditWorkerForm({ ...editWorkerForm, phoneNumber: e.target.value })}
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    className="w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const nextInput = e.currentTarget.form?.querySelector('input[name="hourlyRate"]') as HTMLInputElement;
                        nextInput?.focus();
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">PIN will be updated only if the phone number changes</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-charcoal">Hourly Rate (optional)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    step="0.01"
                    min="0"
                    placeholder="25.00"
                    value={editWorkerForm.hourlyRate}
                    onChange={(e) => setEditWorkerForm({ ...editWorkerForm, hourlyRate: e.target.value })}
                    autoComplete="off"
                    inputMode="decimal"
                    className="w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        updateWorker();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingWorker(null);
                      setEditWorkerForm({ firstName: '', lastName: '', workerId: '', phoneNumber: '', hourlyRate: '' });
                    }}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'kiosk' && (
        <div className="bg-white rounded-xl shadow-lg p-6 text-center space-y-4">
          <h2 className="text-2xl font-bold text-charcoal">Kiosk Mode</h2>
          <p className="text-gray-600">Enable kiosk mode on this device for PIN-based clock in/out.</p>
          <button
            onClick={() => setShowEnableKioskModal(true)}
            className="btn-primary text-lg px-8 py-4"
          >
            Enable Kiosk on This Device
          </button>
        </div>
      )}

      {/* Enable Kiosk modal with warning */}
      {showEnableKioskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-royal-purple mb-4">Enable Kiosk Mode</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm font-semibold text-amber-800 mb-1">Important</p>
                <p className="text-sm text-amber-900">
                  You will need your <strong>admin email and password</strong> to leave Kiosk mode. Make sure you remember them before enabling.
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-charcoal">Device name</label>
                <input
                  type="text"
                  value={enableKioskDeviceName}
                  onChange={(e) => setEnableKioskDeviceName(e.target.value)}
                  placeholder="e.g. Front desk"
                  className="w-full"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEnableKioskModal(false);
                    setEnableKioskDeviceName('');
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => enableKiosk()}
                  disabled={!enableKioskDeviceName.trim()}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  Enable Kiosk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Summary Popup */}
      {showUpdateSummary && updateSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-royal-purple mb-4">Worker Updated Successfully</h2>
              <div className="space-y-3 mb-6">
                <p className="text-sm font-semibold text-charcoal mb-2">Changes made:</p>
                <ul className="space-y-2">
                  {updateSummary.changes.map((change, index) => (
                    <li key={index} className="text-sm text-charcoal flex items-start gap-2">
                      <span className="text-old-gold mt-1">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {updateSummary.updatedPin && (
                <div className="bg-old-gold/10 border border-old-gold rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-charcoal mb-1">New PIN:</p>
                  <p className="text-2xl font-bold text-old-gold">{updateSummary.updatedPin}</p>
                  <p className="text-xs text-gray-600 mt-1">(Last 4 digits of phone number)</p>
                </div>
              )}
              <button
                onClick={() => {
                  setShowUpdateSummary(false);
                  setUpdateSummary(null);
                }}
                className="w-full btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
