import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { api } from '../services/api';

function Home() {
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    try {
      await api.captureLead({ 
        email, 
        source: 'homepage_survival_guide' 
      });
      setEmailSubmitted(true);
    } catch (err) {
      setEmailError(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="px-4 pb-32">
      <SEO
        title="Austin's Trusted Network for Family Enrichment"
        description="Find trusted tutors, camps, and enrichment programs recommended by Austin parents. Join thousands of Austin families discovering the best kids' activities."
        url="/"
        keywords="Austin kids activities, summer camps Austin, tutors Austin, enrichment programs, Austin parenting"
      />

      {/* Hero Section — completely reimagined */}
      <section className="pt-8 pb-8 text-center relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl" />

        {/* Logo badge */}
        <div className="relative inline-flex items-center gap-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full px-4 py-1.5 mb-5 border border-primary/10">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-primary tracking-wide">Austin's Trusted Family Network</span>
        </div>

        <h1 className="text-3xl font-extrabold text-text leading-tight mb-3 relative">
          Stop Googling.
          <br />
          <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            Start Asking Parents.
          </span>
        </h1>
        <p className="text-sm text-text-light mb-8 max-w-sm mx-auto leading-relaxed">
          KidCircle connects you with real recommendations from Austin parents — 
          not anonymous reviews. Find the perfect camp, tutor, or program your kids will love.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 max-w-xs mx-auto relative">
          <Link
            to="/register"
            className="btn-primary text-sm inline-flex items-center justify-center gap-2 shadow-xl shadow-primary/25 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Get Started — Join Free
          </Link>
          <Link
            to="/providers"
            className="btn-secondary text-sm inline-flex items-center justify-center gap-2 hover:border-primary/30 transition-all hover:scale-[1.01]"
          >
            Browse 150+ Providers
          </Link>
        </div>

        {/* Social proof mini */}
        <div className="flex items-center justify-center gap-2 mt-5 text-xs text-text-muted">
          <div className="flex -space-x-2">
            {['SL', 'MK', 'JR', 'AT'].map((initials, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-white flex items-center justify-center text-[9px] font-bold text-primary">
                {initials}
              </div>
            ))}
          </div>
          <span><strong className="text-text">2.4K+</strong> Austin parents have joined</span>
        </div>
      </section>

      {/* Founding Parent Launch Banner */}
      <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-2xl p-4 mb-6 shadow-lg shadow-amber-200 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative flex items-center justify-center gap-2 mb-1">
          <img src="/assets/badges/founding-parent.svg" alt="Founding Parent" className="w-7 h-7" />
          <span className="text-xs font-bold text-white bg-amber-700/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Limited Time</span>
        </div>
        <p className="text-sm font-bold text-white mb-0.5 relative">
          🎉 Austin Launch Offer
        </p>
        <p className="text-xs text-white/90 relative">
          Join in the first 48 hours to become a <strong>Founding Parent</strong> &amp; lock in <strong className="text-amber-200">15% off for life!</strong>
        </p>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-around py-4 mb-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100/80">
        <Stat value="150+" label="Providers" />
        <div className="w-px h-8 bg-gray-200" />
        <Stat value="2.4K" label="Reviews" />
        <div className="w-px h-8 bg-gray-200" />
        <Stat value="Austin" label="Pilot City" />
      </div>

      {/* Email Capture — The Austin Summer Survival Guide */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-6 border border-emerald-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full -mr-10 -mt-10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
              <span className="text-xl">📖</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-text">
                Free: Austin Summer Survival Guide
              </h2>
              <p className="text-xs text-text-light">
                50+ pages of camps, tips, and parent-tested hacks
              </p>
            </div>
          </div>

          <p className="text-sm text-text-light mb-4 leading-relaxed">
            <strong className="text-emerald-700">Don't let summer sneak up on you.</strong> Our guide covers the best Austin camps, 
            last-minute booking strategies, traffic hacks, and the inside scoop from 500+ local parents.
          </p>

          <Link 
            to="/guides/austin-summer-survival-guide" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 mb-4 group"
          >
            Read the guide online immediately
            <svg className="w-3.5 h-3.5 transform transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {emailSubmitted ? (
            <div className="bg-white rounded-xl p-5 text-center border border-emerald-200 shadow-sm">
              <div className="text-3xl mb-2">🎉</div>
              <h3 className="text-sm font-bold text-emerald-800 mb-1">Check your inbox!</h3>
              <p className="text-xs text-emerald-600">
                We just sent <strong className="text-emerald-700">The Austin Summer Survival Guide</strong> to <strong className="text-emerald-700">{email}</strong>. Welcome to the KidCircle community!
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-text-muted">
                <span className="flex items-center gap-1">🔒 No spam</span>
                <span>·</span>
                <span>Unsubscribe anytime</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  placeholder="Enter your email for the free guide"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 transition-all ${
                    emailError ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-emerald-200 focus:border-emerald-400'
                  }`}
                  autoComplete="email"
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {emailError}
                </p>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl text-sm hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-200 active:scale-[0.98]"
              >
                Send Me The Free Guide 🎁
              </button>
              <p className="text-[10px] text-text-muted text-center">
                🔒 No spam. 2,400+ Austin parents trust us. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </section>

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

      {/* Go Pro CTA */}
      <section className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white text-center mb-6 shadow-lg shadow-primary/20">
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
      <section className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-6 text-white text-center mb-6 shadow-lg shadow-amber-200">
        <h2 className="text-lg font-bold mb-2">Are You an Austin Provider?</h2>
        <p className="text-sm text-white/90 mb-4">
          Get the "Parent Verified" badge, top search placement, and 0% commissions during our pilot.
        </p>
        <Link
          to="/partner"
          className="inline-flex items-center gap-2 bg-white text-amber-700 font-semibold py-2.5 px-6 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          Become a Partner
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
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
    <div className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
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
    <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm hover:shadow-md transition-shadow">
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