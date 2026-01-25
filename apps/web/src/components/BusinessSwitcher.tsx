import { useAuth } from '../contexts/AuthContext';

export default function BusinessSwitcher() {
  const { businesses, selectedBusinessId, setSelectedBusinessId, business } = useAuth();

  // Don't show switcher if user only has one business
  if (!businesses || businesses.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="business-select" className="text-old-gold text-sm font-medium sr-only">
        Select Business
      </label>
      <select
        id="business-select"
        value={selectedBusinessId || ''}
        onChange={(e) => {
          if (e.target.value) {
            setSelectedBusinessId(e.target.value);
            // Trigger a custom event that components can listen to for refreshing data
            window.dispatchEvent(new CustomEvent('businessChanged', { detail: { businessId: e.target.value } }));
          }
        }}
        className="bg-old-gold/10 text-old-gold border border-old-gold/30 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-old-gold/20 focus:outline-none focus:ring-2 focus:ring-old-gold focus:ring-offset-2 focus:ring-offset-royal-purple transition-colors cursor-pointer"
        aria-label="Select business"
      >
        {businesses.map((b) => (
          <option key={b.id} value={b.id} className="bg-white text-charcoal">
            {b.name}
          </option>
        ))}
      </select>
      {business && (
        <span className="text-old-gold/80 text-xs hidden sm:inline" aria-label={`Current business: ${business.name}`}>
          {business.name}
        </span>
      )}
    </div>
  );
}
