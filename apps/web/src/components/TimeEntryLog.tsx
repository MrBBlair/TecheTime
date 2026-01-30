import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import type { TimeEntry, Location } from '@shared/types';
import { useAuth } from '../contexts/AuthContext';

interface TimeEntryLogProps {
  userId: string;
  days?: number;
  locations: Location[];
  autoRefresh?: boolean;
  refreshTrigger?: number;
}

interface TimeEntryWithLocation extends TimeEntry {
  locationName: string;
}

function toDate(v: Date | string | null | undefined): Date | null {
  if (v == null) return null;
  return typeof v === 'string' ? new Date(v) : v;
}

function toDateTimeLocal(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

function fromDateTimeLocal(s: string): string {
  return new Date(s).toISOString();
}

export default function TimeEntryLog({
  userId,
  days = 21,
  locations,
  autoRefresh = false,
  refreshTrigger = 0,
}: TimeEntryLogProps) {
  const { getAuthHeaders } = useAuth();
  const [entries, setEntries] = useState<TimeEntryWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodInfo, setPeriodInfo] = useState<{ startDate: string; endDate: string } | null>(null);
  const [editing, setEditing] = useState<TimeEntryWithLocation | null>(null);
  const [editForm, setEditForm] = useState({ clockInAt: '', clockOutAt: '', notes: '', locationId: '' });
  const [deleting, setDeleting] = useState<TimeEntryWithLocation | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const headers = (await getAuthHeaders()) as HeadersInit;
      const res = await fetch(`/api/admin/users/${userId}/time-entries?days=${days}`, { headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to load time entries');
        setEntries([]);
        setPeriodInfo(null);
        return;
      }
      const data = await res.json();
      setEntries(data.entries || []);
      setPeriodInfo(data.period || null);
    } catch (e) {
      console.error('Failed to load time entries:', e);
      setError('Failed to load time entries');
      setEntries([]);
      setPeriodInfo(null);
    } finally {
      setLoading(false);
    }
  }, [userId, days, getAuthHeaders]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries, refreshTrigger]);

  useEffect(() => {
    if (autoRefresh) {
      const t = setInterval(loadEntries, 30000);
      return () => clearInterval(t);
    }
  }, [autoRefresh, loadEntries]);

  const byDate = new Map<string, TimeEntryWithLocation[]>();
  for (const e of entries) {
    const d = toDate(e.clockInAt);
    if (!d) continue;
    const key = d.toISOString().split('T')[0];
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(e);
  }
  const sortedDates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  function hoursFor(entry: TimeEntryWithLocation): number | null {
    const out = toDate(entry.clockOutAt);
    const start = toDate(entry.clockInAt);
    if (!start || !out) return null;
    return (out.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  async function handleUpdate() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const headers = (await getAuthHeaders(true)) as HeadersInit;
      const body: Record<string, unknown> = {
        clockInAt: fromDateTimeLocal(editForm.clockInAt),
        notes: editForm.notes || null,
        locationId: editForm.locationId || undefined,
      };
      if (editForm.clockOutAt) body.clockOutAt = fromDateTimeLocal(editForm.clockOutAt);
      else body.clockOutAt = null;
      const res = await fetch(`/api/admin/time-entries/${editing.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Update failed');
        return;
      }
      setEditing(null);
      setEditForm({ clockInAt: '', clockOutAt: '', notes: '', locationId: '' });
      await loadEntries();
    } catch (e) {
      setError('Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    setError(null);
    try {
      const headers = (await getAuthHeaders()) as HeadersInit;
      const res = await fetch(`/api/admin/time-entries/${deleting.id}`, { method: 'DELETE', headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Delete failed');
        return;
      }
      setDeleting(null);
      await loadEntries();
    } catch (e) {
      setError('Delete failed');
    } finally {
      setSaving(false);
    }
  }

  function openEdit(entry: TimeEntryWithLocation) {
    setEditing(entry);
    setEditForm({
      clockInAt: toDateTimeLocal(entry.clockInAt),
      clockOutAt: entry.clockOutAt ? toDateTimeLocal(entry.clockOutAt) : '',
      notes: entry.notes || '',
      locationId: entry.locationId || '',
    });
    setError(null);
  }

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-500">
        Loading time entries...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {periodInfo && (
        <div className="text-sm text-gray-600 pb-2 border-b border-gray-200">
          {format(parseISO(periodInfo.startDate), 'MMM d')} – {format(parseISO(periodInfo.endDate), 'MMM d, yyyy')}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      {entries.length === 0 ? (
        <div className="text-center py-6 text-gray-500">No time entries for this period</div>
      ) : (
        <div className="space-y-4 max-h-[32rem] overflow-y-auto">
          {sortedDates.map((dateKey) => {
            const dayEntries = byDate.get(dateKey)!;
            const dayTotal = dayEntries.reduce((sum, e) => sum + (hoursFor(e) ?? 0), 0);
            return (
              <div key={dateKey} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <span className="font-semibold text-charcoal">
                    {format(parseISO(dateKey), 'EEEE, MMM d')}
                  </span>
                  <span className="text-sm font-medium text-old-gold">{dayTotal.toFixed(2)} hrs</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {dayEntries.map((entry) => (
                    <div key={entry.id} className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex-1 min-w-0 text-sm">
                        <span className="text-gray-600">
                          {format(toDate(entry.clockInAt)!, 'h:mm a')}
                          {entry.clockOutAt ? ` – ${format(toDate(entry.clockOutAt)!, 'h:mm a')}` : ' (In Progress)'}
                        </span>
                        {hoursFor(entry) != null && (
                          <span className="ml-2 text-charcoal font-medium">{hoursFor(entry)!.toFixed(2)}h</span>
                        )}
                        <span className="ml-2 text-gray-500 text-xs">{entry.locationName}</span>
                        {entry.notes && (
                          <div className="text-xs text-gray-500 italic mt-0.5">{entry.notes}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => openEdit(entry)} className="text-sm font-medium text-royal-purple hover:underline">Edit</button>
                        <button type="button" onClick={() => setDeleting(entry)} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {entries.length > 0 && periodInfo && (
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <span className="font-bold text-charcoal">Total hours</span>
          <span className="font-bold text-old-gold">
            {entries.reduce((sum, e) => sum + (hoursFor(e) ?? 0), 0).toFixed(2)} hrs
          </span>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-royal-purple mb-4">Edit time entry</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Clock in</label>
                  <input type="datetime-local" value={editForm.clockInAt} onChange={(e) => setEditForm((f) => ({ ...f, clockInAt: e.target.value }))} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Clock out (leave empty if in progress)</label>
                  <input type="datetime-local" value={editForm.clockOutAt} onChange={(e) => setEditForm((f) => ({ ...f, clockOutAt: e.target.value }))} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Location</label>
                  <select value={editForm.locationId} onChange={(e) => setEditForm((f) => ({ ...f, locationId: e.target.value }))} className="w-full">
                    <option value="">Select location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Notes</label>
                  <input type="text" value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" className="w-full" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setEditing(null); setError(null); }} className="flex-1 btn-secondary">Cancel</button>
                <button type="button" onClick={handleUpdate} disabled={saving || !editForm.clockInAt} className="flex-1 btn-primary disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-royal-purple mb-2">Delete time entry?</h3>
            <p className="text-sm text-gray-600 mb-4">
              {format(toDate(deleting.clockInAt)!, 'MMM d, h:mm a')}
              {deleting.clockOutAt && ` – ${format(toDate(deleting.clockOutAt)!, 'h:mm a')}`}
              {deleting.locationName && ` · ${deleting.locationName}`}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleting(null)} className="flex-1 btn-secondary">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={saving} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50">{saving ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
