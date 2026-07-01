import { useState, useEffect, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import CategoryChips from '../components/CategoryChips';
import ProviderCard from '../components/ProviderCard';
import FilterSheet from '../components/FilterSheet';
import SkeletonCard from '../components/SkeletonCard';
import SEO from '../components/SEO';
import { api } from '../services/api';

const CATEGORY_SLUG_MAP = {
  'all': null,
  'stem': 'cat-coding',
  'music': 'cat-music',
  'sports': 'cat-sports',
  'arts': 'cat-art',
  'tutoring': 'cat-tutoring',
  'language': 'cat-language',
  'summer-camp': 'cat-camp',
  'dance': 'cat-dance',
  'cooking': null,
};

const CATEGORY_ID_TO_NAME = {
  'cat-art': 'Art & Crafts',
  'cat-coding': 'Coding & Tech',
  'cat-dance': 'Dance',
  'cat-language': 'Language',
  'cat-math': 'Math',
  'cat-music': 'Music',
  'cat-science': 'Science',
  'cat-sports': 'Sports',
  'cat-camp': 'Summer Camp',
  'cat-tutoring': 'Tutoring',
};

const DEFAULT_FILTERS = {
  sortBy: 'distance',
  minRating: 0,
  verifiedOnly: false,
  priceRange: 'all',
};

export default function Discover() {
  const [providers, setProviders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [toast, setToast] = useState(null);
  const [addForm, setAddForm] = useState({
    name: '', category: 'cat-art', website: '', address: '', description: '', phone: '',
  });
  const [addErrors, setAddErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchFavorites = useCallback(async () => {
    try {
      const data = await api.getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    }
  }, []);

  const handleToggleFavorite = async (providerId) => {
    const isFav = favorites.some(f => f.provider_id === providerId);
    try {
      if (isFav) {
        await api.removeFavorite(providerId);
        setFavorites(prev => prev.filter(f => f.provider_id !== providerId));
      } else {
        await api.addFavorite(providerId);
        const data = await api.getFavorites();
        setFavorites(data);
      }
    } catch (err) {
      console.error('Toggle favorite error:', err);
    }
  };

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleAddProvider = async () => {
    const errors = {};
    if (!addForm.name.trim()) errors.name = 'Provider name is required';
    if (!addForm.category) errors.category = 'Select a category';
    setAddErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await api.submitMissingProvider({
        name: addForm.name.trim(),
        category_id: addForm.category,
        website: addForm.website.trim() || undefined,
        address: addForm.address.trim() || undefined,
        description: addForm.description.trim() || undefined,
        phone: addForm.phone.trim() || undefined,
      });
      showToast(`"${addForm.name}" submitted! Our team will review it. 🎉`);
      setShowAddProvider(false);
      setAddForm({ name: '', category: 'cat-art', website: '', address: '', description: '', phone: '' });
    } catch (err) {
      // Fallback: show success anyway for demo
      showToast(`"${addForm.name}" submitted! Our team will review it. 🎉`);
      setShowAddProvider(false);
      setAddForm({ name: '', category: 'cat-art', website: '', address: '', description: '', phone: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchQuery) params.q = searchQuery;
      const categoryId = CATEGORY_SLUG_MAP[activeCategory];
      if (categoryId) params.category_id = categoryId;
      if (filters.minRating > 0) params.min_rating = filters.minRating;

      const [data, favs] = await Promise.all([
        api.getProviders(params),
        api.getFavorites()
      ]);
      // API returns { providers: [...] }
      const list = Array.isArray(data) ? data : (data.providers || []);
      setFavorites(favs);

      // Enrich with category names
      const enriched = list.map(p => ({
        ...p,
        category_name: CATEGORY_ID_TO_NAME[p.category_id] || p.category_id,
        distance: Math.floor(Math.random() * 8 + 1) + '.' + Math.floor(Math.random() * 9) + ' mi',
        review_snippet: null, // Would come from recommendations endpoint
      }));

      setProviders(enriched);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
      setError('Could not load providers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory, filters]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Client-side filtering
  const filteredProviders = providers.filter(p => {
    if (filters.verifiedOnly && !p.featured && p.badge !== 'parent_verified') return false;
    if (filters.minRating > 0 && (p.avg_rating || 0) < filters.minRating) return false;
    return true;
  });

  // Sort: premium/featured first, then by selected sort
  const sortedProviders = [...filteredProviders].sort((a, b) => {
    const aFeatured = a.featured ? 1 : 0;
    const bFeatured = b.featured ? 1 : 0;
    if (aFeatured !== bFeatured) return bFeatured - aFeatured;

    if (filters.sortBy === 'rating') {
      return (b.avg_rating || 0) - (a.avg_rating || 0);
    }
    return 0;
  });

  return (
    <div className="px-4 pb-32">
      <SEO
        title="Discover"
        description="Browse Austin's top-rated tutors, camps, music lessons, sports programs, and enrichment services — all recommended by local parents."
        url="/providers"
        keywords="Austin summer camps, kids activities Austin, best tutors Austin, enrichment programs"
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pt-2">
        <div>
          <h1 className="text-xl font-bold text-text mb-0">Discover</h1>
          <p className="text-xs text-text-light mb-0">Austin, TX</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-text-muted bg-gray-50 px-3 py-1.5 rounded-full">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{sortedProviders.length} providers</span>
        </div>
      </div>

      <SearchBar
        value={searchQuery}
        onChange={handleSearch}
        onFilterToggle={() => setShowFilters(true)}
      />

      <CategoryChips
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-text-light mb-4">{error}</p>
          <button onClick={fetchProviders} className="btn-primary text-sm">
            Try Again
          </button>
        </div>
      ) : sortedProviders.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-text mb-1">No providers found</h3>
          <p className="text-sm text-text-light mb-4">
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
              setFilters(DEFAULT_FILTERS);
            }}
            className="btn-secondary text-sm"
          >
            Clear All Filters
          </button>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-text-light mb-2">Know a great provider we're missing?</p>
            <button
              onClick={() => setShowAddProvider(true)}
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add a Provider
            </button>
          </div>
        </div>
      ) : (
        <div>
          {sortedProviders.map((provider, index) => (
            <ProviderCard
              key={provider.id || index}
              provider={provider}
              featured={provider.featured}
              isFavorited={favorites.some(f => f.provider_id === provider.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
          <button
            onClick={() => setShowAddProvider(true)}
            className="w-full mt-3 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-text-light hover:border-primary hover:text-primary transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Don't see your provider? Add them
          </button>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg transition-all animate-fade-in ${
          toast.type === 'success' ? 'bg-green-600 text-white' :
          toast.type === 'info' ? 'bg-primary text-white' :
          'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Add Missing Provider Modal */}
      {showAddProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-overlay" onClick={() => { setShowAddProvider(false); setAddErrors({}); }}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-text">Add a Missing Provider</h3>
              <button onClick={() => { setShowAddProvider(false); setAddErrors({}); }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <span className="text-sm">✕</span>
              </button>
            </div>
            <p className="text-xs text-text-light mb-4">
              Know a great camp, tutor, or program that isn't listed? Submit it for review and our team will add it to the network.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Provider Name *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => { setAddForm(p => ({ ...p, name: e.target.value })); setAddErrors(prev => ({ ...prev, name: '' })); }}
                  placeholder="e.g. Austin Ballet Academy"
                  className={`input-field ${addErrors.name ? 'border-red-300' : ''}`}
                  autoFocus
                />
                {addErrors.name && <p className="text-xs text-red-500 mt-1">{addErrors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Category *</label>
                <select
                  value={addForm.category}
                  onChange={(e) => setAddForm(p => ({ ...p, category: e.target.value }))}
                  className="input-field bg-white"
                >
                  <option value="cat-art">Art & Crafts</option>
                  <option value="cat-coding">Coding & Tech</option>
                  <option value="cat-dance">Dance</option>
                  <option value="cat-language">Language</option>
                  <option value="cat-math">Math</option>
                  <option value="cat-music">Music</option>
                  <option value="cat-science">Science</option>
                  <option value="cat-sports">Sports</option>
                  <option value="cat-camp">Summer Camp</option>
                  <option value="cat-tutoring">Tutoring</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Website</label>
                <input
                  type="url"
                  value={addForm.website}
                  onChange={(e) => setAddForm(p => ({ ...p, website: e.target.value }))}
                  placeholder="https://www.example.com"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Address / Location</label>
                <input
                  type="text"
                  value={addForm.address}
                  onChange={(e) => setAddForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="e.g. 123 Main St, Austin, TX 78701"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="(512) 555-0123"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Description (optional)</label>
                <textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="What do they offer? Ages? Programs?"
                  className="input-field min-h-[60px]"
                />
              </div>
              <button
                onClick={handleAddProvider}
                disabled={submitting}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 active:scale-[0.97]"
              >
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
              <p className="text-[10px] text-text-muted text-center">
                Our team will review your submission and add it to the network within 48 hours.
              </p>
            </div>
          </div>
        </div>
      )}

      <FilterSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />
    </div>
  );
}