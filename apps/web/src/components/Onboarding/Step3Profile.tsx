import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Step3ProfileProps {
  onNext: () => void;
  onPrevious: () => void;
}

export default function Step3Profile({ onNext, onPrevious }: Step3ProfileProps) {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.firstName?.toLowerCase() || '');
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Profile data can be saved here if needed
    // For now, we'll just proceed to next step
    onNext();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-royal-purple mb-2">Personalize Your Profile</h2>
        <p className="text-gray-600">Add a few details to customize your experience</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-royal-purple/10 flex items-center justify-center overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
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
            className="btn-primary flex-1 text-lg py-4"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
