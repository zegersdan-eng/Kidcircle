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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchQuery) params.q = searchQuery;
      const categoryId = CATEGORY_SLUG_MAP[activeCategory];
      if (categoryId) params.category_id = categoryId;
      if (filters.minRating > 0) params.min_rating = filters.minRating;

      const data = await api.getProviders(params);
      // API returns { providers: [...] }
      const list = Array.isArray(data) ? data : (data.providers || []);

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
        </div>
      ) : (
        <div>
          {sortedProviders.map((provider, index) => (
            <ProviderCard
              key={provider.id || index}
              provider={provider}
              featured={provider.featured}
            />
          ))}
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