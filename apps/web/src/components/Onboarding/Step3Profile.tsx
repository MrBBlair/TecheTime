import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface Step3ProfileProps {
  onNext: () => void;
  onPrevious: () => void;
}

export default function Step3Profile({ onNext, onPrevious }: Step3ProfileProps) {
  const { user, firebaseUser, refreshBusinesses } = useAuth();
  const [username, setUsername] = useState(user?.username || user?.firstName?.toLowerCase() || '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing data when user changes
  useEffect(() => {
    if (user) {
      if (user.username) {
        setUsername(user.username);
      }
      if (user.avatarUrl) {
        setAvatar(user.avatarUrl);
      }
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!firebaseUser || !user) {
      setError('You must be logged in to save your profile');
      return;
    }

    setSaving(true);

    try {
      if (!db) {
        throw new Error('Firestore is not initialized');
      }

      const updateData: { username?: string | null; avatarUrl?: string | null } = {};
      
      // Only update fields that have changed or are being set
      if (username.trim() !== (user.username || '')) {
        updateData.username = username.trim() || null;
      }
      
      if (avatar !== (user.avatarUrl || null)) {
        updateData.avatarUrl = avatar;
      }

      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(db, 'users', firebaseUser.uid), updateData);
        // Refresh user data to get the updated profile
        await refreshBusinesses();
      }

      // Proceed to next step
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
        {/* Avatar Upload */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-royal-purple/10 flex items-center justify-center overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-old-gold text-charcoal rounded-full p-2 shadow-lg hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-royal-purple focus:ring-offset-2"
              aria-label="Upload profile picture"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              aria-label="Profile picture upload"
            />
          </div>
          <p className="text-sm text-gray-600">Tap to add a profile picture (optional)</p>
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-semibold mb-2 text-charcoal">
            Username (optional)
          </label>
          <input
            id="username"
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="johndoe"
            autoComplete="username"
            className="w-full"
            onFocus={(e) => {
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onNext();
              }
            }}
          />
          <p className="text-xs text-gray-500 mt-1">This will be used to identify you in the app</p>
        </div>

        <div className="flex gap-4 pt-4">
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
