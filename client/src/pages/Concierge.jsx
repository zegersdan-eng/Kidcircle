import { useState, useEffect, useCallback } from 'react';
import SEO from '../components/SEO';
import { api } from '../services/api';

// Human-readable interest labels with emojis
const INTEREST_LABELS = {
  acting: '🎭 Acting',
  art: '🎨 Art',
  ballet: '🩰 Ballet',
  camping: '🏕️ Camping',
  chemistry: '🧪 Chemistry',
  coding: '💻 Coding',
  computer: '🖥️ Computer',
  cooking: '🍳 Cooking',
  crafts: '✂️ Crafts',
  dance: '💃 Dance',
  drama: '🎭 Drama',
  engineering: '⚙️ Engineering',
  french: '🥖 French',
  guitar: '🎸 Guitar',
  gymnastics: '🤸 Gymnastics',
  hiphop: '🎧 Hip Hop',
  improv: '🎪 Improv',
  language: '🗣️ Language',
  martial: '🥋 Martial Arts',
  math: '📐 Math',
  music: '🎵 Music',
  nature: '🌿 Nature',
  outdoor: '🏞️ Outdoor',
  painting: '🖌️ Painting',
  piano: '🎹 Piano',
  pottery: '🏺 Pottery',
  programming: '👨‍💻 Programming',
  reading: '📖 Reading',
  robotics: '🤖 Robotics',
  science: '🔬 Science',
  soccer: '⚽ Soccer',
  spanish: '💃 Spanish',
  sports: '🏅 Sports',
  stem: '🧩 STEM',
  swimming: '🏊 Swimming',
  theatre: '🎭 Theatre',
  writing: '✍️ Writing',
  yoga: '🧘 Yoga',
};

const TRAFFIC_OPTIONS = [
  { value: 'low', label: 'Low', desc: '< 15 mins, stay in neighborhood', icon: '🟢' },
  { value: 'medium', label: 'Medium', desc: '15-30 mins, can cross MoPac', icon: '🟡' },
  { value: 'high', label: 'High', desc: 'Austin Veteran — anywhere!', icon: '🔴' },
];

const STEP_ICONS = ['👤', '🎯', '📍', '✨'];

export default function Concierge() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({ interests: [], neighborhoods: [] });
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Form state
  const [childAge, setChildAge] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [zipCode, setZipCode] = useState('');
  const [trafficTolerance, setTrafficTolerance] = useState('low');
  const [showResults, setShowResults] = useState(false);

  const AGE_CHIPS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  // Fetch preferences on mount
  useEffect(() => {
    async function loadPrefs() {
      try {
        const data = await api.getConciergePreferences();
        setPreferences({
          interests: data.interests || [],
          neighborhoods: data.neighborhoods || [],
        });
      } catch (err) {
        console.error('Failed to load preferences:', err);
        // Fallback defaults
        setPreferences({
          interests: ['coding', 'art', 'music', 'sports', 'science', 'dance', 'cooking', 'language', 'drama', 'nature'],
          neighborhoods: [
            { zip_code: '78739', name: 'Circle C', area: 'south' },
            { zip_code: '78701', name: 'Downtown', area: 'central' },
            { zip_code: '78746', name: 'Westlake', area: 'west' },
            { zip_code: '78704', name: 'South Austin', area: 'south' },
            { zip_code: '78758', name: 'North Austin', area: 'north' },
          ],
        });
      }
    }
    loadPrefs();
  }, []);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getConciergeMatch({
        child_age: parseInt(childAge, 10),
        interests: selectedInterests,
        zip_code: zipCode,
        traffic_tolerance: trafficTolerance,
      });
      setResults(data);
      setStep(3); // Show results
      setShowResults(true);
    } catch (err) {
      setError(err.message || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setChildAge('');
    setSelectedInterests([]);
    setZipCode('');
    setTrafficTolerance('low');
    setResults(null);
    setShowResults(false);
    setError(null);
  };

  const canProceed = () => {
    if (step === 0) return childAge > 0 && childAge <= 18;
    if (step === 1) return selectedInterests.length > 0;
    if (step === 2) return zipCode.trim();
    return true;
  };

  return (
    <div className="px-4 pb-32">
      <SEO
        title="Enrichment Concierge"
        description="Get AI-powered personalized weekly itineraries for your kids in Austin. Optimized for Austin traffic with MoPac/I-35 artery logic."
        url="/concierge"
      />
      {/* Header */}
      <div className="pt-2 mb-6">
        {!showResults ? (
          <>
            <h1 className="text-xl font-bold text-text mb-0">Enrichment Concierge</h1>
            <p className="text-xs text-text-light">
              Step {step + 1} of 3: {['Tell us about your child', 'What do they love?', 'Where are you based?'][step]}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-text mb-0">Your Austin Plan</h1>
            <p className="text-xs text-text-light">
              Personalized enrichment recommendations for your child
            </p>
          </>
        )}
      </div>

      {/* Progress bar */}
      {!showResults && (
        <div className="flex items-center gap-2 mb-6">
          {[0, 1, 2].map((s) => (
            <div key={s} className="flex-1">
              <div
                className={`h-1 rounded-full transition-all duration-500 ${
                  s <= step ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Step content */}
      <div className="min-h-[360px]">
        {!showResults && (
          /* Step indicators */
          <div className="flex items-center justify-center gap-3 mb-6">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  s === step
                    ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20'
                    : s < step
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-50 text-text-muted'
                }`}
              >
                {s < step ? '✓' : STEP_ICONS[s]}
              </div>
            ))}
          </div>
        )}

        {/* Step 0: Child's Age */}
        {step === 0 && !showResults && (
          <div className="animate-slide-up">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
              <h2 className="text-lg font-bold text-text mb-1">How old is your child?</h2>
              <p className="text-sm text-text-light mb-5">
                Select their age so we can find the right programs.
              </p>

              <div className="flex flex-wrap gap-2 justify-center">
                {AGE_CHIPS.map(age => (
                  <button
                    key={age}
                    onClick={() => setChildAge(String(age))}
                    className={`w-14 h-14 rounded-2xl text-lg font-bold transition-all duration-150 border-2 ${
                      childAge === String(age)
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110'
                        : 'bg-white text-text border-gray-200 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
              {childAge && (
                <p className="text-center text-sm text-primary font-medium mt-4">
                  ✓ Age {childAge}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Interests */}
        {step === 1 && !showResults && (
          <div className="animate-slide-up">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
              <h2 className="text-lg font-bold text-text mb-1">What do they love?</h2>
              <p className="text-sm text-text-light mb-2">
                Select all the activities your child enjoys.
              </p>
              {selectedInterests.length > 0 && (
                <p className="text-xs text-primary font-medium mb-4">
                  {selectedInterests.length} selected
                </p>
              )}

              <div className="flex flex-wrap gap-2 max-h-[320px] overflow-y-auto">
                {preferences.interests.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 border ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-text-light border-gray-200 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {INTEREST_LABELS[interest] || interest}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location & Traffic */}
        {step === 2 && !showResults && (
          <div className="animate-slide-up">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
              <h2 className="text-lg font-bold text-text mb-1">Where are you based?</h2>
              <p className="text-sm text-text-light mb-5">
                We use your neighborhood to find nearby providers and plan routes.
              </p>

              <label className="block mb-5">
                <span className="text-sm font-medium text-text mb-1.5 block">Your Neighborhood</span>
                <select
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="input-field appearance-none bg-white"
                >
                  <option value="">Select a neighborhood...</option>
                  {preferences.neighborhoods.map((n) => (
                    <option key={n.zip_code} value={n.zip_code}>
                      {n.name} ({n.zip_code}) — {n.area}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="text-sm font-medium text-text mb-3 block">
                  Traffic Tolerance
                </span>
                <div className="space-y-2">
                  {TRAFFIC_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTrafficTolerance(opt.value)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 ${
                        trafficTolerance === opt.value
                          ? 'bg-primary/5 border-primary'
                          : 'bg-white border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-text">{opt.label}</div>
                        <div className="text-xs text-text-light">{opt.desc}</div>
                      </div>
                      {trafficTolerance === opt.value && (
                        <svg className="w-5 h-5 text-primary ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {showResults && results && (
          <div className="animate-slide-up">
            {/* Summary */}
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 text-white mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✨</span>
                <h2 className="text-lg font-bold">Your Enrichment Plan</h2>
              </div>
              <p className="text-sm text-white/90">
                Based on your child's interests and your{' '}
                {trafficTolerance === 'low' ? 'neighborhood' : trafficTolerance === 'medium' ? 'moderate' : 'flexible'} commute
                preference in {preferences.neighborhoods.find(n => n.zip_code === zipCode)?.name || 'Austin'}.
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-white/80">
                <span>{results.total_matches} matches found</span>
                <span>·</span>
                <span>Age {childAge}</span>
                {selectedInterests.length > 0 && (
                  <>
                    <span>·</span>
                    <span>{selectedInterests.slice(0, 2).join(', ')}{selectedInterests.length > 2 ? '...' : ''}</span>
                  </>
                )}
              </div>
            </div>

            {/* Match results */}
            <div className="space-y-3">
              {(results.recommendations || []).map((rec) => {
                // Handle both old format (rec.provider) and new flattened format (rec.name)
                const provider = rec.provider || {
                  id: rec.id,
                  name: rec.name,
                  description: rec.description,
                  category_id: rec.category_id,
                  zip_code: rec.zip_code,
                  avg_rating: rec.avg_rating,
                  review_count: rec.review_count,
                  tier: rec.tier,
                  price_range: rec.price_range,
                  logo_url: rec.logo_url,
                  website: rec.website,
                  address: rec.address,
                  lat: rec.lat,
                  lng: rec.lng,
                  start_date: rec.start_date,
                  end_date: rec.end_date,
                  provider_name: rec.provider_name,
                };
                const isEvent = rec.result_type === 'event';
                const initials = provider.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'KC';

                // Score color
                const scoreColor =
                  rec.match_score >= 70 ? 'text-green-600' :
                  rec.match_score >= 40 ? 'text-amber-500' :
                  'text-gray-500';

                return (
                  <div
                    key={provider.id || rec.rank}
                    className={`bg-white rounded-2xl border p-5 transition-all ${
                      rec.rank === 1 ? 'border-amber-200 border-2 shadow-md' : 'border-gray-100 shadow-sm'
                    }`}
                  >
                    {/* Rank badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Provider avatar */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0 flex items-center justify-center">
                          <span className="text-base font-bold text-primary/60">{initials}</span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-text">{provider.name}</h3>
                          <p className="text-xs text-text-light">{provider.description?.slice(0, 60)}</p>
                        </div>
                      </div>
                      {rec.rank === 1 && (
                        <span className="badge-featured text-xs">Best Match</span>
                      )}
                    </div>

                    {/* Match score */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`text-lg font-bold ${scoreColor}`}>{rec.match_score}%</div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            rec.match_score >= 70 ? 'bg-green-500' :
                            rec.match_score >= 40 ? 'bg-amber-400' :
                            'bg-gray-300'
                          }`}
                          style={{ width: `${rec.match_score}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted">Match</span>
                    </div>

                    {/* Provider details */}
                    <div className="flex items-center gap-3 mb-3 text-xs text-text-muted">
                      {provider.avg_rating && (
                        <span className="flex items-center gap-1">
                          <span className="text-amber-400">★</span>
                          {provider.avg_rating.toFixed(1)}
                        </span>
                      )}
                      {provider.tier === 'premium' && (
                        <span className="badge-verified text-[10px]">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                      {provider.website && (
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                          title="Visit website"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Website
                        </a>
                      )}
                    </div>

                    {/* Match reasons */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-text mb-1.5">Why this matches:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(rec.match_reasons || []).map((reason, i) => (
                          <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg">
                            ✓ {reason}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Logistics tip */}
                    {isEvent && provider.start_date && (
                      <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-xl mb-3">
                        <span className="text-sm">📅</span>
                        <p className="text-xs text-purple-800">
                          <strong>Event:</strong> {provider.name}{provider.provider_name ? ` hosted by ${provider.provider_name}` : ''} — 
                          {provider.start_date}{provider.end_date && provider.end_date !== provider.start_date ? ` to ${provider.end_date}` : ''}
                          {provider.start_time ? ` at ${provider.start_time}` : ''}
                        </p>
                      </div>
                    )}
                    {rec.logistics_tip && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl mb-3">
                        <span className="text-sm">🚗</span>
                        <p className="text-xs text-amber-800">{rec.logistics_tip}</p>
                      </div>
                    )}

                    {/* Action button — opens provider website or shows detail view */}
                    {provider.website ? (
                      <a
                        href={provider.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block py-2.5 text-sm font-semibold text-center text-white bg-primary rounded-xl hover:bg-primary-dark active:bg-primary-dark/90 transition-colors"
                      >
                        Visit Website ↗
                      </a>
                    ) : (
                      <button
                        onClick={() => setSelectedProvider(provider)}
                        className="w-full py-2.5 text-sm font-semibold text-center text-white bg-primary rounded-xl hover:bg-primary-dark active:bg-primary-dark/90 transition-colors"
                      >
                        More Info
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-red-700">Something went wrong</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <button onClick={handleSubmit} className="mt-2 text-xs font-semibold text-red-700 underline">
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-6">
        {!showResults ? (
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button onClick={handleBack} className="btn-secondary flex-1 text-sm">
                Back
              </button>
            )}
            {step < 2 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`btn-primary flex-1 text-sm inline-flex items-center justify-center gap-2 ${
                  !canProceed() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className={`btn-primary flex-1 text-sm inline-flex items-center justify-center gap-2 ${
                  !canProceed() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Finding matches...
                  </>
                ) : (
                  <>
                    <span className="text-lg">✨</span>
                    Get My Plan
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <button onClick={handleReset} className="btn-secondary w-full text-sm">
            Start Over
          </button>
        )}
      </div>

      {/* Provider Detail Modal */}
      {selectedProvider && (
        <ProviderDetailModal provider={selectedProvider} onClose={() => setSelectedProvider(null)} />
      )}
    </div>
  );
}

function ProviderDetailModal({ provider, onClose }) {
  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const initials = provider.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'KC';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-overlay"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0 flex items-center justify-center">
                <span className="text-base font-bold text-primary/60">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-text truncate">{provider.name}</h3>
                {provider.category_id && (
                  <p className="text-xs text-text-light">{INTEREST_LABELS[provider.category_id] || provider.category_id}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
          {/* Description */}
          {provider.description && (
            <div>
              <p className="text-xs font-semibold text-text mb-1">About</p>
              <p className="text-sm text-text-light leading-relaxed">{provider.description}</p>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {provider.avg_rating && (
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="text-amber-400 text-sm">★</span>
                  <span className="text-lg font-bold text-amber-700">{provider.avg_rating.toFixed(1)}</span>
                </div>
                <p className="text-[10px] text-amber-600">Rating{provider.review_count ? ` (${provider.review_count})` : ''}</p>
              </div>
            )}
            {provider.price_range && (
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-green-700 mb-0.5">{provider.price_range}</div>
                <p className="text-[10px] text-green-600">Price Range</p>
              </div>
            )}
            {provider.address && (
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-lg mb-0.5">📍</div>
                <p className="text-[10px] text-blue-700 truncate">{provider.address}</p>
              </div>
            )}
            {provider.zip_code && !provider.address && (
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-lg mb-0.5">📍</div>
                <p className="text-[10px] text-blue-700">Austin, TX {provider.zip_code}</p>
              </div>
            )}
            {provider.tier === 'premium' && (
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <div className="text-lg mb-0.5">✓</div>
                <p className="text-[10px] text-purple-700 font-medium">Verified Provider</p>
              </div>
            )}
          </div>

          {/* Event info */}
          {provider.start_date && (
            <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-xl">
              <span className="text-base">📅</span>
              <div>
                <p className="text-xs font-semibold text-purple-800">Event Dates</p>
                <p className="text-xs text-purple-700">
                  {provider.start_date}{provider.end_date && provider.end_date !== provider.start_date ? ` — ${provider.end_date}` : ''}
                  {provider.start_time ? ` at ${provider.start_time}` : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold text-center text-primary bg-primary/5 rounded-xl hover:bg-primary/10 active:bg-primary/15 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}