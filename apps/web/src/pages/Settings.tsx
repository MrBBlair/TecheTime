/**
 * Admin Settings - Business, Locations, Notifications, Security, Time & Payroll, Admin Guide
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { FloatingBackground } from '../components/FloatingBackground';
import { Logo } from '../components/Logo';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Bell,
  Shield,
  Clock,
  Plug,
  LogOut,
  Save,
  Plus,
  Trash2,
  X,
  User,
} from 'lucide-react';

const NOTIFY_KEY = 'settings_notifications';
const PAYROLL_KEY = 'settings_payroll';

function loadNotify(): { emailSummary: boolean; pushEnabled: boolean } {
  try {
    const s = localStorage.getItem(NOTIFY_KEY);
    if (s) return JSON.parse(s);
  } catch (_) {}
  return { emailSummary: true, pushEnabled: false };
}

function loadPayroll(): { overtimeAfterHours: number; payPeriod: 'weekly' | 'biweekly' | 'monthly' } {
  try {
    const s = localStorage.getItem(PAYROLL_KEY);
    if (s) return JSON.parse(s);
  } catch (_) {}
  return { overtimeAfterHours: 40, payPeriod: 'weekly' };
}

function saveNotify(v: { emailSummary: boolean; pushEnabled: boolean }) {
  localStorage.setItem(NOTIFY_KEY, JSON.stringify(v));
}

function savePayroll(v: { overtimeAfterHours: number; payPeriod: 'weekly' | 'biweekly' | 'monthly' }) {
  localStorage.setItem(PAYROLL_KEY, JSON.stringify(v));
}

export function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, userData, logout, changePassword } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessError, setBusinessError] = useState('');

  const [notify, setNotify] = useState(loadNotify);
  const [payroll, setPayroll] = useState(loadPayroll);

  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocTz, setNewLocTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [newLocSaving, setNewLocSaving] = useState(false);
  const [newLocError, setNewLocError] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  // Business
  const { data: business } = useQuery({
    queryKey: ['business'],
    queryFn: () => api.getBusiness(),
    enabled: !!userData?.businessId,
  });

  useEffect(() => {
    if (business) {
      setBusinessName(business.name || '');
      setBusinessAddress((business as any).address || '');
      setBusinessPhone((business as any).phone || '');
    }
  }, [business]);

  const saveBusiness = async () => {
    setBusinessSaving(true);
    setBusinessError('');
    try {
      await api.updateBusiness({
        name: businessName || undefined,
        address: businessAddress || undefined,
        phone: businessPhone || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['business'] });
    } catch (e: any) {
      setBusinessError(e.message || 'Failed to save');
    } finally {
      setBusinessSaving(false);
    }
  };

  // Locations
  const { data: locData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => api.getLocations(),
    enabled: !!userData?.businessId,
  });
  const locations = locData?.locations || [];

  const addLocation = async () => {
    if (!newLocName.trim() || !newLocTz.trim()) return;
    setNewLocSaving(true);
    setNewLocError('');
    try {
      await api.createLocation({ name: newLocName.trim(), timezone: newLocTz.trim() });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setNewLocName('');
      setNewLocTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
      setShowAddLocation(false);
    } catch (e: any) {
      setNewLocError(e.message || 'Failed to add location');
    } finally {
      setNewLocSaving(false);
    }
  };

  const deleteLocation = async (id: string) => {
    if (!confirm('Delete this location? Staff assigned to it will need to be reassigned.')) return;
    try {
      await api.deleteLocation(id);
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    } catch (e: any) {
      alert(e.message || 'Failed to delete');
    }
  };

  // Notifications (local)
  const setNotifyAndSave = (patch: Partial<{ emailSummary: boolean; pushEnabled: boolean }>) => {
    const next = { ...notify, ...patch };
    setNotify(next);
    saveNotify(next);
  };

  // Payroll (local)
  const setPayrollAndSave = (patch: Partial<{ overtimeAfterHours: number; payPeriod: 'weekly' | 'biweekly' | 'monthly' }>) => {
    const next = { ...payroll, ...patch };
    setPayroll(next);
    savePayroll(next);
  };

  // Change password
  const handleChangePassword = async () => {
    if (pwNew !== pwConfirm) {
      setPwError('New passwords do not match');
      return;
    }
    if (pwNew.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    setPwSaving(true);
    setPwError('');
    try {
      await changePassword(pwCurrent, pwNew);
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
      setShowPasswordModal(false);
    } catch (e: any) {
      setPwError(e.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <FloatingBackground />
      <div className="relative z-10 min-h-screen">
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="container-padding py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="p-2 text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <Logo variant="kioskBackground" className="w-12 h-12" />
                <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to="/profile"
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Profile"
                >
                  <User className="w-6 h-6" />
                </Link>
                <button onClick={handleLogout} className="p-2 text-gray-600 hover:text-gray-900" aria-label="Logout">
                  <LogOut className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="container-padding section-spacing max-w-3xl mx-auto">
          {/* Business Profile */}
          <section id="business" className="mb-10">
            <div className="flex items-center gap-2 text-brand-purple mb-4">
              <Building2 className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Business profile</h2>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              {businessError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{businessError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
              <button
                onClick={saveBusiness}
                disabled={businessSaving}
                className="touch-target inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {businessSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </section>

          {/* Locations */}
          <section id="locations" className="mb-10">
            <div className="flex items-center gap-2 text-brand-purple mb-4">
              <MapPin className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Locations</h2>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {locations.map((loc: any) => (
                  <li key={loc.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{loc.name}</p>
                      <p className="text-sm text-gray-500">{loc.timezone}</p>
                    </div>
                    <button
                      onClick={() => deleteLocation(loc.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              {!showAddLocation ? (
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowAddLocation(true)}
                    className="touch-target inline-flex items-center gap-2 text-brand-purple font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add location
                  </button>
                </div>
              ) : (
                <div className="p-4 border-t border-gray-200 space-y-3">
                  {newLocError && (
                    <p className="text-sm text-red-600">{newLocError}</p>
                  )}
                  <input
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    placeholder="Location name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    value={newLocTz}
                    onChange={(e) => setNewLocTz(e.target.value)}
                    placeholder="America/New_York"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addLocation}
                      disabled={newLocSaving || !newLocName.trim()}
                      className="px-4 py-2 bg-brand-purple text-white rounded-lg font-medium disabled:opacity-50"
                    >
                      {newLocSaving ? 'Adding…' : 'Add'}
                    </button>
                    <button
                      onClick={() => { setShowAddLocation(false); setNewLocError(''); }}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Notifications */}
          <section id="notifications" className="mb-10">
            <div className="flex items-center gap-2 text-brand-purple mb-4">
              <Bell className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700">Email summary</span>
                <input
                  type="checkbox"
                  checked={notify.emailSummary}
                  onChange={(e) => setNotifyAndSave({ emailSummary: e.target.checked })}
                  className="rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
                />
              </label>
              <p className="text-sm text-gray-500">Receive weekly payroll and activity summaries by email.</p>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700">Push notifications</span>
                <input
                  type="checkbox"
                  checked={notify.pushEnabled}
                  onChange={(e) => setNotifyAndSave({ pushEnabled: e.target.checked })}
                  className="rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
                />
              </label>
              <p className="text-sm text-gray-500">Browser push for punches and alerts. (Requires permission.)</p>
            </div>
          </section>

          {/* Security */}
          <section id="security" className="mb-10">
            <div className="flex items-center gap-2 text-brand-purple mb-4">
              <Shield className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Security</h2>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <p className="text-sm text-gray-600">Logged in as <strong>{user?.email}</strong></p>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="touch-target px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Change password
              </button>
            </div>
          </section>

          {/* Time & Payroll */}
          <section id="time" className="mb-10">
            <div className="flex items-center gap-2 text-brand-purple mb-4">
              <Clock className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Time &amp; payroll</h2>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overtime after (hours/week)</label>
                <input
                  type="number"
                  min={1}
                  max={80}
                  value={payroll.overtimeAfterHours}
                  onChange={(e) => setPayrollAndSave({ overtimeAfterHours: parseInt(e.target.value, 10) || 40 })}
                  className="w-full max-w-[120px] px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pay period</label>
                <select
                  value={payroll.payPeriod}
                  onChange={(e) => setPayrollAndSave({ payPeriod: e.target.value as any })}
                  className="w-full max-w-[200px] px-4 py-3 border border-gray-300 rounded-lg"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <p className="text-sm text-gray-500">Used for reports and exports. Overtime calculations use this threshold.</p>
            </div>
          </section>

          {/* Integrations */}
          <section id="integrations" className="mb-10">
            <div className="flex items-center gap-2 text-brand-purple mb-4">
              <Plug className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Integrations</h2>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-gray-500">QuickBooks, accounting, and other integrations are coming soon.</p>
            </div>
          </section>

          {/* Admin Guide */}
          <section id="guide" className="mb-10">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Admin guide</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    A step-by-step interactive checklist to set up your business, staff, and kiosk.
                  </p>
                </div>
                <Link
                  to="/admin-guide"
                  className="touch-target inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90"
                >
                  Open guide
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Change password modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Change password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {pwError && <p className="mb-4 text-sm text-red-600">{pwError}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
                <input
                  type="password"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <input
                  type="password"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                <input
                  type="password"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleChangePassword}
                disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm}
                className="flex-1 py-3 bg-brand-purple text-white rounded-lg font-medium disabled:opacity-50"
              >
                {pwSaving ? 'Updating…' : 'Update password'}
              </button>
              <button onClick={() => setShowPasswordModal(false)} className="px-4 py-3 border border-gray-300 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
