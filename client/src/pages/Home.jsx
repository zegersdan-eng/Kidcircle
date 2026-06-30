import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

function Home() {
  return (
    <div className="px-4 pb-32">
      <SEO
        title="Home"
        description="Find trusted tutors, camps, and enrichment programs recommended by Austin parents. Join the hyperlocal recommendation network."
        url="/"
        keywords="Austin kids activities, summer camps Austin, tutors Austin, enrichment programs"
      />
      {/* Hero */}
      <section className="pt-8 pb-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">
          Find trusted services<br />near you
        </h1>
        <p className="text-sm text-text-light mb-6 max-w-xs mx-auto">
          Recommendations from parents you trust, for services your kids will love. Austin's trusted network.
        </p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link to="/register" className="btn-primary text-sm inline-flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Get Started — Join Free
          </Link>
          <Link to="/providers" className="btn-secondary text-sm">
            Browse Providers
          </Link>
          <p className="text-xs text-text-muted">
            Already a member?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </section>

      {/* Founding Parent Launch Banner */}
      <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-2xl p-4 mb-6 shadow-lg shadow-amber-200 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <img src="/assets/badges/founding-parent.svg" alt="Founding Parent" className="w-7 h-7" />
          <span className="text-xs font-bold text-white bg-amber-700/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Limited Time</span>
        </div>
        <p className="text-sm font-bold text-white mb-0.5">
          🎉 Austin Launch Offer
        </p>
        <p className="text-xs text-white/90">
          Join in the first 48 hours to become a <strong>Founding Parent</strong> &amp; lock in <strong className="text-amber-200">15% off for life!</strong>
        </p>
      </div>

      <div className="flex items-center justify-around py-4 mb-6 bg-gray-50 rounded-xl">
        <Stat value="150+" label="Providers" />
        <div className="w-px h-8 bg-gray-200" />
        <Stat value="2.4K" label="Reviews" />
        <div className="w-px h-8 bg-gray-200" />
        <Stat value="Austin" label="Pilot City" />
      </div>

      {/* How it works */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-text mb-4">How it works</h2>
        <div className="space-y-3">
          <StepCard
            number="1"
            title="Discover"
            description="Browse trusted local tutors, camps, and programs recommended by Austin parents."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <StepCard
            number="2"
            title="Read Reviews"
            description="See real recommendations from parents in your community — not anonymous reviews."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
          />
          <StepCard
            number="3"
            title="Book & Share"
            description="Book services and share your own recommendations to help other Austin families."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Swap Marketplace Highlight */}
      <section className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white mb-6 shadow-lg shadow-purple-200">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🔄</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-base font-bold">Camp & Class Swap</h2>
              <span className="badge-pro text-[10px] bg-white/20 text-white border-0">Pro</span>
            </div>
            <p className="text-xs text-white/80">
              Last-minute spots from parents in your network
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 mb-4 text-xs text-white/80">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            <strong className="text-white">15+</strong> spots available
          </span>
          <span className="flex items-center gap-1">
            <span className="text-green-300">💰</span>
            Save up to <strong className="text-white">$200</strong>
          </span>
        </div>
        <Link
          to="/swap-marketplace"
          className="w-full py-2.5 bg-white text-indigo-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          Go to Swap Marketplace
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      {/* Trusted by Austin Families — Social Proof */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-text mb-3 flex items-center gap-1.5">
          <span className="text-amber-400">★</span> Trusted by Austin Families
        </h2>
        <div className="space-y-2.5">
          <ReviewCard
            name="Olivia E."
            provider="ZACH Theatre"
            text="My kids loved the musical theatre camp! The instructors are incredible and the final show was amazing."
          />
          <ReviewCard
            name="Mike R."
            provider="South Austin Soccer"
            text="Great program for young athletes. Coach Martinez is fantastic with the kids — patient, encouraging, and fun."
          />
          <ReviewCard
            name="Jessica K."
            provider="The Art Garage"
            text="My daughter has been going here for 2 years. The summer art camps are her absolute favorite week of the year!"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white text-center mb-6">
        <h2 className="text-lg font-bold mb-2">Go Pro, Power Parent</h2>
        <p className="text-sm text-white/80 mb-4">
          AI-powered recommendations, priority booking, and last-minute camp swaps.
        </p>
        <Link to="/profile" className="inline-flex items-center gap-2 bg-white text-primary font-semibold py-2.5 px-6 rounded-lg text-sm hover:bg-gray-50 transition-colors">
          Learn More
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      {/* For Providers */}
      <section className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-6 text-white text-center mb-6">
        <h2 className="text-lg font-bold mb-2">Are You an Austin Provider?</h2>
        <p className="text-sm text-white/90 mb-4">
          Get the "Parent Verified" badge, top search placement, and 0% commissions during our pilot.
        </p>
        <a
          href="https://buy.stripe.com/bJedRbcoS1QTelG8cg33W02"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-amber-700 font-semibold py-2.5 px-6 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          Become a Partner
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </section>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-text">{value}</div>
      <div className="text-xs text-text-light">{label}</div>
    </div>
  );
}

function StepCard({ number, title, description, icon }) {
  return (
    <div className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 p-4">
      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
            Step {number}
          </span>
          <h3 className="text-sm font-semibold text-text">{title}</h3>
        </div>
        <p className="text-xs text-text-light mb-0">{description}</p>
      </div>
    </div>
  );
}

function ReviewCard({ name, provider, text }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm">
      <div className="flex items-center gap-1 mb-1.5">
        {[1, 2, 3, 4, 5].map(i => (
          <svg key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-xs text-text-light mb-1.5 leading-relaxed">&ldquo;{text}&rdquo;</p>
      <p className="text-xs font-medium text-text">
        {name} <span className="text-text-muted font-normal">on {provider}</span>
      </p>
    </div>
  );
}

export default Home;