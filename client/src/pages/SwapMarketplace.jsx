import { useState, useEffect } from 'react';
import { api } from '../services/api';

const STATUS_CONFIG = {
  listed: { label: 'Available', color: 'text-green-600', bg: 'bg-green-50', dot: '🟢' },
  escrow: { label: 'In Escrow', color: 'text-amber-600', bg: 'bg-amber-50', dot: '🟡' },
  confirmed: { label: 'Confirmed', color: 'text-blue-600', bg: 'bg-blue-50', dot: '🔵' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50', dot: '🔴' },
};

const SWAP_FAKE_LISTINGS = [
  {
    id: 'demo-1',
    listing_user_name: 'Sarah M.',
    provider_name: 'The Art Garage',
    provider_id: '90c023b6-673b-49c3-922b-76babab8c323',
    original_price: 350,
    swap_price: 300,
    booking_date: '2026-07-12',
    booking_detail: 'Summer Art Camp — Ages 7-10, Week of July 12',
    status: 'listed',
    created_at: '2026-06-25',
  },
  {
    id: 'demo-2',
    listing_user_name: 'Jessica L.',
    provider_name: 'Neuron Garage',
    provider_id: 'f3c7b8a1-...',
    original_price: 425,
    swap_price: 400,
    booking_date: '2026-07-19',
    booking_detail: 'Coding Camp — Intro to Python, Ages 8-12',
    status: 'listed',
    created_at: '2026-06-24',
  },
  {
    id: 'demo-3',
    listing_user_name: 'Amanda K.',
    provider_name: 'ZACH Theatre',
    provider_id: '348eec33-940a-4a07-8e52-45f9b3d6f544',
    original_price: 275,
    swap_price: 250,
    booking_date: '2026-07-05',
    booking_detail: 'Musical Theatre Camp — Ages 6-9, Session 1',
    status: 'listed',
    created_at: '2026-06-23',
  },
  {
    id: 'demo-4',
    listing_user_name: 'Rachel P.',
    provider_name: 'Code Galaxy',
    provider_id: '...',
    original_price: 500,
    swap_price: 500,
    booking_date: '2026-07-26',
    booking_detail: 'Robotics Summer Camp — Build & Code, Ages 9-14',
    status: 'listed',
    created_at: '2026-06-22',
  },
  {
    id: 'demo-5',
    listing_user_name: 'Lauren D.',
    provider_name: 'South Austin Soccer Club',
    provider_id: '...',
    original_price: 180,
    swap_price: 150,
    booking_date: '2026-07-08',
    booking_detail: 'Summer Soccer Clinic — Ages 5-7, Week 2',
    status: 'listed',
    created_at: '2026-06-21',
  },
];

export default function SwapMarketplace() {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('browse');
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [claiming, setClaiming] = useState(null);
  const [claimResult, setClaimResult] = useState(null);
  const [animatingView, setAnimatingView] = useState(false);

  const switchView = (newView) => {
    if (newView === view) return;
    setAnimatingView(true);
    setTimeout(() => {
      setView(newView);
      setAnimatingView(false);
    }, 150);
  };
  const [extractText, setExtractText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [listForm, setListForm] = useState({
    provider_id: '',
    provider_name: '',
    original_price: '',
    swap_price: '',
    booking_date: '',
    booking_detail: '',
  });
  const [listResult, setListResult] = useState(null);
  const [listing, setListing] = useState(false);

  useEffect(() => {
    fetchSwaps();
  }, []);

  const fetchSwaps = async () => {
    setLoading(true);
    try {
      const data = await api.getSwaps();
      const list = Array.isArray(data) ? data : [];
      // Merge with demo data for a richer UI
      const existingIds = new Set(list.map(s => s.id));
      const merged = [...list, ...SWAP_FAKE_LISTINGS.filter(s => !existingIds.has(s.id))];
      setSwaps(merged);
    } catch (err) {
      console.error('Failed to fetch swaps:', err);
      setSwaps(SWAP_FAKE_LISTINGS);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (swapId) => {
    setClaiming(swapId);
    setClaimResult(null);
    try {
      // Mock user ID since we don't have auth yet
      const data = await api.claimSwap(swapId, { claiming_user_id: 'demo-pro-parent' });
      setClaimResult({ success: true, message: data.message || 'Swap claimed successfully!' });
      // Update local state
      setSwaps(prev => prev.map(s => s.id === swapId ? { ...s, status: 'escrow' } : s));
      if (selectedSwap?.id === swapId) {
        setSelectedSwap(prev => ({ ...prev, status: 'escrow' }));
      }
    } catch (err) {
      setClaimResult({ success: false, message: err.message });
    } finally {
      setClaiming(null);
    }
  };

  const handleExtract = async () => {
    if (!extractText.trim()) return;
    setExtracting(true);
    setExtracted(null);
    try {
      const data = await api.extractSwapBooking({ raw_text: extractText });
      setExtracted(data.extracted);
      if (data.extracted?.original_price) {
        setListForm(prev => ({
          ...prev,
          provider_id: data.extracted.matched_provider_id || '',
          provider_name: data.extracted.matched_provider_name || data.extracted.provider_name,
          original_price: data.extracted.original_price?.toString() || '',
        }));
      }
    } catch (err) {
      setExtracted({ error: err.message });
    } finally {
      setExtracting(false);
    }
  };

  const handleListSubmit = async () => {
    setListing(true);
    setListResult(null);
    try {
      const data = await api.listSwap({
        listing_user_id: 'demo-pro-parent',
        provider_id: listForm.provider_id,
        original_price: parseFloat(listForm.original_price),
        swap_price: parseFloat(listForm.swap_price),
        booking_date: listForm.booking_date,
        booking_detail: listForm.booking_detail,
      });
      setListResult({ success: true, message: 'Swap listed successfully!' });
      // Refresh the list
      fetchSwaps();
    } catch (err) {
      setListResult({ success: false, message: err.message });
    } finally {
      setListing(false);
    }
  };

  const availableSwaps = swaps.filter(s => s.status === 'listed');
  const activeSwaps = swaps.filter(s => s.status !== 'listed');

  return (
    <div className="px-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 mb-4">
        <div>
          <h1 className="text-xl font-bold text-text mb-0">Camp & Class Swap</h1>
          <p className="text-xs text-text-light">Last-minute spots from Pro parents</p>
        </div>
        <span className="badge-pro text-[10px]">Pro Only</span>
      </div>

      {/* View switcher with animation */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => switchView('browse')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            view === 'browse' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'bg-gray-50 text-text-light hover:bg-gray-100'
          }`}
        >
          🔍 Browse
        </button>
        <button
          onClick={() => switchView('list')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            view === 'list' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'bg-gray-50 text-text-light hover:bg-gray-100'
          }`}
        >
          📋 List
        </button>
        <button
          onClick={() => switchView('detail')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            view === 'detail' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'bg-gray-50 text-text-light hover:bg-gray-100'
          }`}
        >
          📦 My Swaps
        </button>
      </div>

      {/* BROWSE VIEW */}
      {view === 'browse' && (
        <div className={animatingView ? 'opacity-0 translate-y-2 transition-all duration-150' : 'opacity-100 translate-y-0 transition-all duration-200'}>
          {claimResult && (
            <div className={`p-3 rounded-xl mb-4 text-sm ${
              claimResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {claimResult.message}
              <button onClick={() => setClaimResult(null)} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton h-32 rounded-2xl" />
              ))}
            </div>
          ) : selectedSwap ? (
            /* Detail view */
            <div>
              <button
                onClick={() => setSelectedSwap(null)}
                className="flex items-center gap-1 text-sm text-primary mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to listings
              </button>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-text">{selectedSwap.provider_name}</h2>
                    <p className="text-xs text-text-light">{selectedSwap.listing_user_name} is selling their spot</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedSwap.status]?.bg || 'bg-gray-50'} ${STATUS_CONFIG[selectedSwap.status]?.color || 'text-gray-600'}`}>
                    {STATUS_CONFIG[selectedSwap.status]?.dot} {STATUS_CONFIG[selectedSwap.status]?.label}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-text mb-2">{selectedSwap.booking_detail}</p>
                  <div className="flex items-center gap-4 text-xs text-text-light">
                    <span>📅 {selectedSwap.booking_date}</span>
                    {selectedSwap.created_at && <span>📋 Listed {selectedSwap.created_at}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-text-light mb-1">Swap Price</p>
                    <p className="text-2xl font-bold text-green-600">${selectedSwap.swap_price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-light mb-1">Original Price</p>
                    <p className="text-base text-text-light line-through">${selectedSwap.original_price}</p>
                  </div>
                </div>

                            <div className="bg-amber-50 rounded-xl p-3 mb-4">
                              <p className="text-xs text-amber-800">
                                🚗 <strong>Anti-Scalping Protected:</strong> Price capped at original cost. ${selectedSwap.original_price - selectedSwap.swap_price} savings!
                  </p>
                </div>

                {selectedSwap.status === 'listed' && (
                  <button
                    onClick={() => handleClaim(selectedSwap.id)}
                    disabled={claiming === selectedSwap.id}
                    className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-colors disabled:opacity-60"
                  >
                    {claiming === selectedSwap.id ? 'Claiming...' : 'Claim This Spot'}
                  </button>
                )}

                {selectedSwap.status === 'escrow' && (
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-sm text-amber-700 font-medium">⏳ In Escrow — Awaiting Provider Confirmation</p>
                    <p className="text-xs text-amber-600 mt-1">Funds held securely until provider approves transfer</p>
                  </div>
                )}

                <p className="text-xs text-text-muted text-center mt-3">
                  By claiming, you agree to the Swap Terms, KidCircle's marketplace policies, and the provider's transfer policies.
                  Transaction fee: $5 (waived for annual Pro members).
                </p>
                <p className="text-[10px] text-text-muted text-center mt-2 leading-relaxed">
                  ⚖️ <strong>Transfer Policy:</strong> All swap listings are subject to individual provider transfer rules.
                  Some providers restrict or charge fees for transfers. KidCircle is a marketplace platform only and is
                  <strong> not responsible</strong> if a swapped spot is later deemed non-transferable by the provider.
                  <strong className="block mt-1">Always verify the provider's transfer policy before listing or claiming a swap.</strong>
                </p>
              </div>
            </div>
          ) : (
            /* List view */
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-text-light">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                    {availableSwaps.length} {availableSwaps.length === 1 ? 'spot' : 'spots'} available
                  </span>
                </p>
                <button onClick={fetchSwaps} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              {availableSwaps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <h3 className="text-base font-semibold text-text mb-1">No swaps available</h3>
                  <p className="text-sm text-text-light mb-4">Check back soon or list your own spot!</p>
                  <button onClick={() => setView('list')} className="btn-primary text-sm">
                    List a Swap
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableSwaps.map((swap) => (
                    <button
                      key={swap.id}
                      onClick={() => setSelectedSwap(swap)}
                      className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-text">{swap.provider_name}</h3>
                          <p className="text-xs text-text-light">{swap.listing_user_name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-green-600">${swap.swap_price}</p>
                          <p className="text-xs text-text-muted line-through">${swap.original_price}</p>
                        </div>
                      </div>
                      <p className="text-xs text-text-light mb-2 line-clamp-1">{swap.booking_detail}</p>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span>📅 {swap.booking_date}</span>
                        <span className="text-green-600">💰 Save ${swap.original_price - swap.swap_price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className={animatingView ? 'opacity-0 translate-y-2 transition-all duration-150' : 'opacity-100 translate-y-0 transition-all duration-200'}>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
            <h2 className="text-base font-bold text-text mb-1">List Your Spot</h2>
            <p className="text-xs text-text-light mb-4">
              Can't use a booking? List it here for another Pro parent to claim.
            </p>

            {listResult && (
              <div className={`p-3 rounded-xl mb-4 text-sm ${
                listResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {listResult.message}
                <button onClick={() => setListResult(null)} className="ml-2 underline">Dismiss</button>
              </div>
            )}

            {/* AI Extract tool */}
            <div className="bg-gradient-to-r from-primary/5 to-blue-50 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-text mb-2">🤖 AI Booking Extraction</h3>
              <p className="text-xs text-text-light mb-3">
                Paste your booking confirmation email below and we'll auto-fill the form.
              </p>
              <textarea
                placeholder="Paste booking email or confirmation text here..."
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-200 text-sm mb-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                onClick={handleExtract}
                disabled={extracting || !extractText.trim()}
                className="w-full py-2 bg-primary text-white font-medium rounded-lg text-sm disabled:opacity-60"
              >
                {extracting ? 'Extracting...' : 'Extract Booking Info'}
              </button>
              {extracted && !extracted.error && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg text-xs text-green-700">
                  <p>✅ Extracted: <strong>{extracted.provider_name}</strong></p>
                  {extracted.original_price && <p>💰 Price: ${extracted.original_price}</p>}
                  {extracted.dates?.length > 0 && <p>📅 Dates: {extracted.dates.join(', ')}</p>}
                  {extracted.age_range && <p>👤 Ages: {extracted.age_range}</p>}
                  <p className="text-green-500 mt-1">Confidence: {extracted.confidence}</p>
                </div>
              )}
              {extracted?.error && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg text-xs text-red-700">
                  ⚠️ {extracted.error}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Provider Name *</label>
                <input
                  type="text"
                  placeholder="e.g., The Art Garage"
                  value={listForm.provider_name}
                  onChange={(e) => setListForm(prev => ({ ...prev, provider_name: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text mb-1 block">Original Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="350"
                      value={listForm.original_price}
                      onChange={(e) => setListForm(prev => ({ ...prev, original_price: e.target.value }))}
                      className="input-field pl-8"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text mb-1 block">Swap Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="300"
                      value={listForm.swap_price}
                      onChange={(e) => setListForm(prev => ({ ...prev, swap_price: e.target.value }))}
                      className="input-field pl-8"
                      required
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Booking Date</label>
                <input
                  type="date"
                  value={listForm.booking_date}
                  onChange={(e) => setListForm(prev => ({ ...prev, booking_date: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Details (optional)</label>
                <textarea
                  placeholder="e.g., Summer Art Camp — Ages 7-10, Week of July 12"
                  value={listForm.booking_detail}
                  onChange={(e) => setListForm(prev => ({ ...prev, booking_detail: e.target.value }))}
                  className="input-field min-h-[60px]"
                />
              </div>
            </div>

            {/* Post to My Circles first toggle */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-4 mt-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-text">Post to My Circles First</h3>
                    <span className="badge-pro text-[10px]">Pro</span>
                  </div>
                  <p className="text-xs text-text-light">Give your private groups first dibs for <strong>2 hours</strong> before listing publicly</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={listForm.circleExclusive || false}
                    onChange={(e) => setListForm(prev => ({ ...prev, circleExclusive: e.target.checked }))}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[0.5px] after:left-[0.5px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              {listForm.circleExclusive && (
                <div className="mt-2 flex items-center gap-2 text-[10px] text-indigo-600 bg-indigo-50/50 rounded-lg px-3 py-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse inline-block" />
                  <span>⏰ 2-hour exclusive window active — only your Circles can see this listing</span>
                </div>
              )}
            </div>

            <div className="bg-amber-50 rounded-xl p-3 mb-4 mt-2">
              <p className="text-xs text-amber-800">
                🔒 <strong>Anti-Scalping Policy:</strong> Swap price cannot exceed the original price.
                Max fee: $5 transaction fee (free for annual Pro members).
              </p>
            </div>

            <p className="text-[10px] text-text-muted text-center mb-4 leading-relaxed">
              ⚖️ <strong>Transfer Policy:</strong> All swap listings are subject to individual provider transfer rules.
              Some providers restrict or charge fees for transfers. KidCircle is a marketplace platform only and is
              <strong> not responsible</strong> if a swapped spot is later deemed non-transferable by the provider.
              <strong className="block mt-1">Always verify the provider's transfer policy before listing or claiming.</strong>
            </p>

            <button
              onClick={handleListSubmit}
              disabled={listing || !listForm.provider_name || !listForm.original_price || !listForm.swap_price}
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm disabled:opacity-60"
            >
              {listing ? 'Listing...' : 'List My Swap'}
            </button>
          </div>
        </div>
      )}

      {/* MY SWAPS VIEW */}
      {view === 'detail' && (
        <div className={animatingView ? 'opacity-0 translate-y-2 transition-all duration-150' : 'opacity-100 translate-y-0 transition-all duration-200'}>
          <h2 className="text-sm font-semibold text-text mb-3">Your Swap Activity</h2>

          {activeSwaps.length === 0 && (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-sm font-semibold text-text mb-1">No swap activity yet</h3>
              <p className="text-xs text-text-light mb-4">Claim spots from the Browse tab or list your own booking.</p>
              <button onClick={() => switchView('browse')} className="btn-primary text-sm inline-flex items-center gap-1">
                🔍 Browse Available Spots
              </button>
            </div>
          )}

          <div className="space-y-3">
            {activeSwaps.map((swap) => {
              const cfg = STATUS_CONFIG[swap.status] || { dot: '⚪', label: swap.status, color: 'text-gray-500', bg: 'bg-gray-50' };
              return (
                <div key={swap.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-text">{swap.provider_name}</h3>
                      <p className="text-xs text-text-light">{swap.listing_user_name}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      {cfg.dot} {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-text-light mb-2">{swap.booking_detail}</p>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>${swap.swap_price}</span>
                    <span>📅 {swap.booking_date}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-primary/5 rounded-2xl p-5 mt-6">
            <h3 className="text-sm font-bold text-text mb-1">✨ Pro Tips</h3>
            <ul className="text-xs text-text-light space-y-1">
              <li>• List your spot early — popular camps sell fast on the swap marketplace</li>
              <li>• Take a clear screenshot of your booking confirmation for faster AI extraction</li>
              <li>• Annual Pro members get up to 3 swaps with $0 transaction fees</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}