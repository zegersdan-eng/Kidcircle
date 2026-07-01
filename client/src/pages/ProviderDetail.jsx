import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import SEO from '../components/SEO';

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    body: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [providerData, recsData, favoritesData] = await Promise.all([
        api.getProvider(id),
        api.getRecommendations({ provider_id: id }),
        api.getFavorites()
      ]);
      setProvider(providerData);
      setRecommendations(recsData.recommendations || recsData || []);
      setIsFavorited(favoritesData.some(f => f.provider_id === id));
    } catch (err) {
      console.error('Failed to fetch provider details:', err);
      setError('Could not load provider details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, fetchData]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (submittingReview) return;
    
    setSubmittingReview(true);
    setSubmitError(null);
    try {
      await api.createRecommendation({
        user_id: '6b18593b-17de-4146-a6c1-5e245e02e580', // Demo user Sarah J.
        provider_id: id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        body: reviewForm.body,
      });
      
      setSubmitSuccess(true);
      
      // Refresh data to show new review
      const [providerData, recsData] = await Promise.all([
        api.getProvider(id),
        api.getRecommendations({ provider_id: id })
      ]);
      setProvider(providerData);
      setRecommendations(recsData.recommendations || recsData || []);
      
      setTimeout(() => {
        setShowReviewModal(false);
        setSubmitSuccess(false);
        setReviewForm({ rating: 5, title: '', body: '' });
      }, 1500);
    } catch (err) {
      setSubmitError(err.message === 'Request failed' ? 'You have already reviewed this provider.' : err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const toggleFavorite = async () => {
    if (togglingFavorite) return;
    setTogglingFavorite(true);
    try {
      if (isFavorited) {
        await api.removeFavorite(id);
        setIsFavorited(false);
      } else {
        await api.addFavorite(id);
        setIsFavorited(true);
      }
    } catch (err) {
      console.error('Toggle favorite error:', err);
    } finally {
      setTogglingFavorite(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-text-light mb-6">{error || 'Provider not found'}</p>
        <button onClick={() => navigate('/providers')} className="btn-primary">
          Back to Discover
        </button>
      </div>
    );
  }

  const {
    name,
    description,
    category_id,
    avg_rating,
    review_count,
    logo_url,
    website,
    address,
    phone,
    age_range_min,
    age_range_max,
    price_range,
    tier
  } = provider;

  const isVerified = tier === 'premium' || tier === 'partner';
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'KC';

  return (
    <div className="pb-32 bg-gray-50 min-h-screen">
      <SEO 
        title={name}
        description={description || `Learn more about ${name} on KidCircle.`}
        url={`/providers/${id}`}
      />
      
      {/* Header with Back Button */}
      <div className="bg-white px-4 pt-12 pb-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text truncate">{name}</h1>
      </div>

      {/* Provider Hero Section */}
      <div className="bg-white px-4 pb-6 border-b border-gray-100">
        <div className="flex gap-4 items-start">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
            {logo_url ? (
              <img src={logo_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <span className="text-2xl font-bold text-primary/60">{initials}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-text">{name}</h2>
              {isVerified && (
                <span className="text-primary" title="Parent Verified">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-sm text-text-light mb-2">{description?.slice(0, 100)}...</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-400">
                <span className="text-sm font-bold text-text mr-1">{avg_rating?.toFixed(1) || '0.0'}</span>
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(avg_rating || 0) ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-text-muted">({review_count || 0} reviews)</span>
            </div>
          </div>
        </div>

        {/* Badges/Tags */}
        <div className="flex flex-wrap gap-2 mt-6">
          {age_range_min && (
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-text-light">
              Ages {age_range_min}–{age_range_max}
            </span>
          )}
          {price_range && (
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-text-light">
              {price_range}
            </span>
          )}
          {category_id && (
            <span className="px-3 py-1 bg-primary/10 rounded-full text-xs font-medium text-primary">
              {category_id.replace('cat-', '').toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Info Sections */}
      <div className="mt-2 space-y-2">
        {/* Contact Info */}
        <div className="bg-white p-4">
          <h3 className="text-sm font-bold text-text mb-3 uppercase tracking-wider">Contact & Location</h3>
          <div className="space-y-4">
            {address && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-text font-medium">{address}</p>
                  <p className="text-xs text-text-muted">Austin, TX</p>
                </div>
              </div>
            )}
            {phone && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <a href={`tel:${phone}`} className="text-sm text-primary font-medium">{phone}</a>
              </div>
            )}
            {website && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <a href={website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary font-medium truncate">
                  {website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white p-4">
          <h3 className="text-sm font-bold text-text mb-2 uppercase tracking-wider">About</h3>
          <p className="text-sm text-text-light leading-relaxed">
            {description || `${name} is a top-rated program in Austin, TX offering ${category_id?.replace('cat-', '')} services for children.`}
          </p>
        </div>

        {/* Reviews */}
        <div className="bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider">Reviews</h3>
            <button 
              onClick={() => setShowReviewModal(true)}
              className="text-xs font-bold text-primary uppercase"
            >
              Write a Review
            </button>
          </div>
          
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="border-b border-gray-50 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                        {(rec.user_name || 'U')[0]}
                      </div>
                      <span className="text-sm font-semibold text-text">{rec.user_name || 'Verified Parent'}</span>
                    </div>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg key={s} className={`w-3 h-3 ${s <= rec.rating ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  {rec.title && <h4 className="text-sm font-bold text-text mb-1">{rec.title}</h4>}
                  <p className="text-xs text-text-light leading-relaxed italic">"{rec.body}"</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-text-muted">
                      {new Date(rec.created_at).toLocaleDateString()}
                    </span>
                    {rec.verified_use === 1 && (
                      <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified Visit
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center bg-gray-50 rounded-xl">
              <p className="text-sm text-text-light mb-2">No reviews yet.</p>
              <button 
                onClick={() => setShowReviewModal(true)}
                className="text-xs font-bold text-primary underline"
              >
                Be the first to recommend!
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Write a Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={() => !submittingReview && setShowReviewModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-text">Write a Review</h3>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {submitSuccess ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  ✓
                </div>
                <h4 className="font-bold text-text mb-1">Review Submitted!</h4>
                <p className="text-sm text-text-light">Thank you for helping other parents.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="p-5 space-y-4">
                {submitError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
                    {submitError}
                  </div>
                )}
                
                <div>
                  <label className="text-xs font-semibold text-text-light mb-2 block uppercase">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                        className="text-2xl transition-transform active:scale-90"
                      >
                        <span className={star <= reviewForm.rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-text-light mb-1.5 block uppercase">Headline (optional)</label>
                  <input
                    type="text"
                    placeholder="Summary of your experience"
                    value={reviewForm.title}
                    onChange={e => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-text-light mb-1.5 block uppercase">Your Review</label>
                  <textarea
                    placeholder="Tell other parents about the program, instructors, and your child's experience..."
                    value={reviewForm.body}
                    onChange={e => setReviewForm(prev => ({ ...prev, body: e.target.value }))}
                    className="input-field min-h-[120px] py-3"
                    required
                  />
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingReview || !reviewForm.body}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    {submittingReview ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      'Post Review'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3 z-20">
        {website ? (
          <a 
            href={website} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex-1 btn-primary py-4 text-center font-bold flex items-center justify-center gap-2"
          >
            Book on Website
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : phone ? (
          <a 
            href={`tel:${phone}`} 
            className="flex-1 btn-primary py-4 text-center font-bold flex items-center justify-center gap-2"
          >
            Call to Book
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>
        ) : (
          <button className="flex-1 bg-gray-200 text-gray-500 py-4 rounded-xl font-bold cursor-not-allowed">
            Contact Info Unavailable
          </button>
        )}
        <button 
          onClick={toggleFavorite}
          disabled={togglingFavorite}
          className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors shadow-sm ${isFavorited ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-text'}`}
        >
          <svg className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
