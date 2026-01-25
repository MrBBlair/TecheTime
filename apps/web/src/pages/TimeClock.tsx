import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Removed direct auth import - use firebaseUser from AuthContext instead
import { format, parseISO } from 'date-fns';
import type { Location, User } from '@techetime/shared';

interface PayPeriodSummary {
  payPeriod: {
    startDate: string;
    endDate: string;
  };
  summary: Array<{
    date: string;
    entries: Array<{
      id: string;
      clockInAt: string;
      clockOutAt: string | null;
      hours: number | null;
      locationId: string;
    }>;
    totalHours: number;
  }>;
  totalHours: number;
}

export default function TimeClock() {
  const { user, getAuthHeaders, selectedBusinessId, firebaseUser } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [payPeriodSummary, setPayPeriodSummary] = useState<PayPeriodSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, selectedBusinessId]);

  useEffect(() => {
    if (selectedWorker) {
      loadPayPeriodSummary();
    }
  }, [selectedWorker, user]);

  async function loadData() {
    if (!user) return;
    const headers: HeadersInit = {};
    const authHeaders = await getAuthHeaders();
    Object.assign(headers, authHeaders);
    try {
      const [locRes, workerRes] = await Promise.all([
        fetch('/api/admin/locations', { headers }),
        fetch('/api/admin/users', { headers }),
      ]);
      const locs = locRes.ok ? await locRes.json() : [];
      const users = workerRes.ok ? await workerRes.json() : [];
      const workers = users.filter((u: User) => u.role === 'WORKER' && u.isActive);
      setLocations(locs.filter((l: Location) => l.isActive));
      setWorkers(workers);
      if (locs.length > 0) setSelectedLocation(locs[0].id);
      if (workers.length > 0) setSelectedWorker(workers[0].id);
    } catch (e) {
      console.error('Failed to load time clock data:', e);
      setLocations([]);
      setWorkers([]);
    }
  }

  async function loadPayPeriodSummary(retryCount = 0) {
    if (!selectedWorker || !user) return;
    setLoadingSummary(true);
    try {
      const headers: HeadersInit = { 'Cache-Control': 'no-store' };
      if (!firebaseUser) return;
      const token = await firebaseUser.getIdToken();
      if (!token) return;
      headers['Authorization'] = `Bearer ${token}`;
      const timestamp = Date.now();
      const res = await fetch(`/api/time-entries/pay-period-summary/${selectedWorker}?t=${timestamp}`, {
        headers,
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setPayPeriodSummary(data);
      }
    } catch (error) {
      console.error('Failed to load pay period summary:', error);
      // Retry up to 2 times with exponential backoff
      if (retryCount < 2) {
        setTimeout(() => {
          loadPayPeriodSummary(retryCount + 1);
        }, 500 * (retryCount + 1));
      }
    } finally {
      setLoadingSummary(false);
    }
  }

  async function handleClockIn() {
    if (!selectedLocation || !selectedWorker) {
      alert('Please select a location and worker');
      return;
    }

    const headers: HeadersInit = {};
    const authHeaders = await getAuthHeaders(true);
    Object.assign(headers, authHeaders);
    const res = await fetch('/api/time-entries/clock-in', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: selectedWorker,
        locationId: selectedLocation,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      // Optimistically update the UI immediately
      const now = new Date();
      const todayKey = now.toISOString().split('T')[0];
      
      if (payPeriodSummary) {
        const updatedSummary = { ...payPeriodSummary };
        const todayIndex = updatedSummary.summary.findIndex(day => day.date === todayKey);
        
        const newEntry = {
          id: data.id || `temp-${Date.now()}`,
          clockInAt: now.toISOString(),
          clockOutAt: null,
          hours: null,
          locationId: selectedLocation,
        };

        if (todayIndex >= 0) {
          // Add to existing day
          updatedSummary.summary[todayIndex].entries.unshift(newEntry);
        } else {
          // Create new day entry
          updatedSummary.summary.unshift({
            date: todayKey,
            entries: [newEntry],
            totalHours: 0,
          });
          updatedSummary.summary.sort((a, b) => b.date.localeCompare(a.date));
        }
        
        setPayPeriodSummary(updatedSummary);
      }
      
      alert('Clocked in successfully');
      
      // Refresh after a short delay to ensure Firestore has committed
      setTimeout(() => {
        loadPayPeriodSummary();
      }, 500);
    } else {
      alert(data.error || 'Failed to clock in');
    }
  }

  async function handleClockOut() {
    if (!selectedWorker) {
      alert('Please select a worker');
      return;
    }

    const headers: HeadersInit = {};
    const authHeaders = await getAuthHeaders(true);
    Object.assign(headers, authHeaders);
    const res = await fetch('/api/time-entries/clock-out', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: selectedWorker,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert('Clocked out successfully');
      
      // Refresh after a short delay to ensure Firestore has committed
      setTimeout(() => {
        loadPayPeriodSummary();
      }, 500);
    } else {
      alert(data.error || 'Failed to clock out');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-4xl font-bold text-royal-purple">Time Clock</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Clock In/Out Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-charcoal">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-charcoal">Worker</label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="w-full"
            >
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.firstName} {worker.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <button onClick={handleClockIn} className="btn-primary flex-1 text-lg py-4">Clock In</button>
            <button onClick={handleClockOut} className="btn-secondary flex-1 text-lg py-4">Clock Out</button>
          </div>
          <p className="text-center text-gray-600 text-sm">
            Use kiosk mode for PIN-based clock in/out
          </p>
        </div>

        {/* Pay Period Summary */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-royal-purple mb-4">Current Pay Period</h2>
          {loadingSummary ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : payPeriodSummary ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                {format(parseISO(payPeriodSummary.payPeriod.startDate), 'MMM d')} - {format(parseISO(payPeriodSummary.payPeriod.endDate), 'MMM d, yyyy')}
              </div>
              {payPeriodSummary.summary.length > 0 ? (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {payPeriodSummary.summary.map((day) => (
                      <div key={day.date} className="border-b border-light-gray pb-3 last:border-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-charcoal">
                            {format(parseISO(day.date), 'EEEE, MMM d')}
                          </span>
                          <span className="text-sm text-old-gold font-medium">
                            {day.totalHours.toFixed(2)} hrs
                          </span>
                        </div>
                        <div className="space-y-1 ml-2">
                          {day.entries.map((entry) => (
                            <div key={entry.id} className="text-sm text-gray-600 flex justify-between">
                              <span>
                                {format(parseISO(entry.clockInAt), 'h:mm a')}
                                {entry.clockOutAt && ` - ${format(parseISO(entry.clockOutAt), 'h:mm a')}`}
                                {!entry.clockOutAt && <span className="text-old-gold ml-1">(In Progress)</span>}
                              </span>
                              {entry.hours && (
                                <span className="text-gray-500">{entry.hours.toFixed(2)}h</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-light-gray mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-charcoal">Total Hours</span>
                      <span className="font-bold text-lg text-old-gold">
                        {payPeriodSummary.totalHours.toFixed(2)} hrs
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No time entries for this pay period
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select a worker to view pay period summary
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
