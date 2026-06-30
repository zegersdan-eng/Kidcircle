import { useState } from 'react';

export default function FilterSheet({ isOpen, onClose, filters, onApply }) {
  const [local, setLocal] = useState({ ...filters });

  if (!isOpen) return null;

  const handleApply = () => {
    onApply?.(local);
    onClose();
  };

  const handleReset = () => {
    const reset = { sortBy: 'distance', minRating: 0, verifiedOnly: false, priceRange: 'all' };
    setLocal(reset);
    onApply?.(reset);
    onClose();
  };

  const SortOption = ({ value, label }) => (
    <button
      onClick={() => setLocal(prev => ({ ...prev, sortBy: value }))}
      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
        local.sortBy === value
          ? 'bg-primary text-white'
          : 'bg-gray-50 text-text-light hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet-panel">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <h3 className="text-lg font-bold text-text mb-5">Filters & Sort</h3>

        {/* Sort options */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-text-light uppercase tracking-wider mb-2 block">
            Sort by
          </label>
          <div className="flex gap-2">
            <SortOption value="distance" label="Distance" />
            <SortOption value="rating" label="Rating" />
            <SortOption value="referrals" label="Top Referred" />
          </div>
        </div>

        {/* Rating filter */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-text-light uppercase tracking-wider mb-2 block">
            Minimum Rating
          </label>
          <div className="flex gap-2">
            {[0, 3, 3.5, 4, 4.5].map(rating => (
              <button
                key={rating}
                onClick={() => setLocal(prev => ({ ...prev, minRating: rating }))}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                  local.minRating === rating
                    ? 'bg-primary text-white'
                    : 'bg-gray-50 text-text-light hover:bg-gray-100'
                }`}
              >
                {rating === 0 ? 'Any' : `${rating}★`}
              </button>
            ))}
          </div>
        </div>

        {/* Verified only toggle */}
        <div className="mb-5">
          <label className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-2 text-sm font-medium text-text">
              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              KidCircle Verified Only
            </div>
            <div
              onClick={() => setLocal(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                local.verifiedOnly ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  local.verifiedOnly ? 'translate-x-5' : ''
                }`}
              />
            </div>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button onClick={handleReset} className="btn-secondary flex-1 text-sm">
            Reset
          </button>
          <button onClick={handleApply} className="btn-primary flex-1 text-sm">
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}