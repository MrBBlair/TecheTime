import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Step3ProfileProps {
  onNext: () => void;
  onPrevious: () => void;
}

export default function Step3Profile({ onNext, onPrevious }: Step3ProfileProps) {
  const { user, userData, refreshUserData } = useAuth();
  const [displayName, setDisplayName] = useState((userData as any)?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userData?.displayName) setDisplayName(userData.displayName);
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user || !userData) {
      setError('You must be logged in to save your profile');
      return;
    }
    setSaving(true);
    try {
      if (!db) throw new Error('Firestore is not initialized');
      if (displayName.trim() !== ((userData as any).displayName || '')) {
        await updateDoc(doc(db, 'users', user.uid), { displayName: displayName.trim() || null });
        await refreshUserData();
      }
      onNext();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-royal-purple mb-2">Personalize Your Profile</h2>
        <p className="text-gray-600">Add a few details to customize your experience</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="displayName" className="block text-sm font-semibold mb-2 text-charcoal">
            Display name (optional)
          </label>
          <input
            id="displayName"
            type="text"
            name="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="w-full"
            onFocus={(e) => {
              setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
            }}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onPrevious} className="btn-outline flex-1" aria-label="Go back">
            Back
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
