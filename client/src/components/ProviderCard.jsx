export default function ProviderCard({ provider, featured = false, showClaim = false }) {
  const {
    name,
    category_name,
    avg_rating,
    review_count,
    review_snippet,
    tier,
    distance,
    price_range,
    age_range_min,
    age_range_max,
    logo_url,
    description,
    website,
    owner_name,
  } = provider;

  const isVerified = tier === 'premium' || tier === 'partner';
  const isFeatured = featured || tier === 'premium';

  // Generate initials for avatar placeholder
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'KC';

  // Color based on rating
  const ratingColor = avg_rating >= 4.5 ? 'text-green-600' : avg_rating >= 4.0 ? 'text-amber-500' : 'text-gray-500';

  return (
    <div className={`provider-card ${isFeatured ? 'featured relative' : ''}`}>
      {/* Featured tag */}
      {isFeatured && (
        <div className="absolute -top-2 -right-2 z-10">
          <span className="badge-featured shadow-sm">Featured</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
          {logo_url ? (
            <img
              src={logo_url}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <span className="text-xl font-bold text-primary/60">{initials}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name & Category */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-text truncate">{name}</h3>
              <p className="text-xs text-text-light truncate">{category_name || description?.slice(0, 50)}</p>
            </div>
            {/* Trust badges */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {isVerified && (
                <span className="badge-verified" title="Parent Verified">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
          </div>

          {/* Rating with stars */}
          <div className="flex items-center gap-2 mt-1">
            <div className="star-rating">
              <span className="text-sm">{avg_rating ? avg_rating.toFixed(1) : '—'}</span>
              <span className="text-amber-400 text-sm">★</span>
            </div>
            <span className="text-xs text-text-muted">
              ({review_count || 0} {review_count === 1 ? 'review' : 'reviews'})
            </span>
            {distance && (
              <>
                <span className="text-text-muted text-xs">·</span>
                <span className="text-xs text-text-muted">{distance}</span>
              </>
            )}
          </div>

          {/* Review snippet */}
          {review_snippet && (
            <p className="text-xs text-text-light mt-1 italic line-clamp-1">
              "{review_snippet}"
            </p>
          )}

          {/* Age & Price */}
          <div className="flex items-center gap-3 mt-2">
            {age_range_min && (
              <span className="text-xs text-text-muted flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                {age_range_min}–{age_range_max} yrs
              </span>
            )}
            {price_range && (
              <span className="text-xs text-text-muted flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                {price_range}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
        {showClaim && !owner_name && (
          <button
            onClick={() => window.location.href = '/partner'}
            className="py-2 px-2.5 text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 active:bg-amber-200 transition-colors flex items-center gap-1"
            title="Claim this provider profile"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Claim
          </button>
        )}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 text-sm font-medium text-text-light bg-gray-50 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors text-center flex items-center justify-center gap-1"
            title={`Visit ${name}'s website`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Visit Website
          </a>
        )}
        <button className={`py-2 text-sm font-semibold text-primary bg-primary/5 rounded-lg hover:bg-primary/10 active:bg-primary/15 transition-colors ${website ? 'flex-1' : 'flex-[2]'}`}>
          Book Now
        </button>
        <button className="py-2 px-3 text-sm font-medium text-text-light bg-gray-50 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>
    </div>
  );
}