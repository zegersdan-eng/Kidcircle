import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

// 6-Point Pro Gold Standard Verification
const VERIFICATION_STEPS = [
  {
    id: 'identity',
    title: 'Identity Verification',
    desc: 'Multi-factor identity verification via Stripe Identity (government-issued ID + biometric selfie)',
    icon: '🪪',
  },
  {
    id: 'background',
    title: 'National Criminal + Sex Offender Check',
    desc: 'Comprehensive Checkr background check: SSN trace, national/state criminal search, sex offender registry, global watchlist',
    icon: '🛡️',
  },
  {
    id: 'business',
    title: 'Texas SOS Business Registration',
    desc: 'Verification of active Texas Secretary of State business registration or equivalent',
    icon: '🏛️',
  },
  {
    id: 'hhsc',
    title: 'HHSC Licensing or Exemption Affidavit',
    desc: 'Texas DFPS/HHSC license verification for childcare, or an exemption affidavit for enrichment-only programs',
    icon: '📋',
  },
  {
    id: 'insurance',
    title: '$1M+ General Liability Insurance',
    desc: 'Mandatory upload of current Certificate of Insurance for all physical facilities and programs',
    icon: '✅',
  },
  {
    id: 'rating',
    title: '4.5+ Star Rating',
    desc: 'Minimum 4.5-star average from verified parent reviewers to earn and maintain the badge',
    icon: '⭐',
  },
];

const FEATURES = [
  {
    icon: '🏆',
    title: '"Parent Verified" Badge',
    desc: 'The highest trust signal on KidCircle. Gold-bordered profile that tells parents you are a top-tier, safety-verified provider.',
  },
  {
    icon: '🔝',
    title: 'Search Visibility Boost',
    desc: 'Featured placement in the "Featured Providers" carousel. Rank in the top 3 spots for relevant Austin searches.',
  },
  {
    icon: '📊',
    title: 'Advanced Analytics',
    desc: 'Neighborhood interest heatmaps showing which Austin zip codes are searching for your category. Benchmark against city averages.',
  },
  {
    icon: '🎯',
    title: 'Priority Booking for Pro Families',
    desc: 'Fill your spots faster by offering early-access booking windows to our "Power Parents" — 24-48 hours before general registration.',
  },
  {
    icon: '🤖',
    title: 'AI Concierge Priority',
    desc: 'Your programs get higher weight in personalized AI recommendations, matched to families whose commute fits your location.',
  },
  {
    icon: '💰',
    title: '0% Commission — Pilot Phase',
    desc: 'During the Austin pilot, we waive all booking commissions. Keep every dollar while building your review base.',
  },
];

const FAQS = [
  {
    q: 'How does the AI Concierge help my business?',
    a: 'It acts as a digital matchmaker. When a parent in Circle C searches for "STEM after-school" with low traffic tolerance, it prioritizes you if you\'re on their side of the river. This means better-fit families, fewer late pickups, and more consistent attendance.',
  },
  {
    q: 'What is the "Parent Verified" badge?',
    a: 'Our highest trust signal — the "Michelin Star" of KidCircle. It proves you meet our rigorous safety standards (6-point "Pro Gold Standard" verification), maintain a 4.5+ rating, and respond to families within 24 hours.',
  },
  {
    q: 'How does pricing work?',
    a: 'The Partner Tier is $25/month. During the Austin pilot, we\'re also waiving 0% commission on all bookings. There are no hidden fees or long-term contracts — you can upgrade or cancel anytime.',
  },
  {
    q: 'How do Priority Booking windows work?',
    a: 'You provide a unique registration link or discount code that goes live 24-48 hours early for KidCircle Pro subscribers. This helps you fill popular spots instantly with committed, vetted families.',
  },
  {
    q: 'Is background verification required?',
    a: 'While basic profile registration is free and open to all Austin enrichment providers, the full 6-point "Pro Gold Standard" is a voluntary achievement that earns you our highest trust badge. It is designed for providers who want to distinguish themselves by meeting the city\'s most rigorous safety standards.',
  },
  {
    q: 'What happens after the pilot phase?',
    a: 'When we transition to the full model, Partner Tier providers will maintain their priority placement and badge. We\'ll give you at least 30 days notice before any changes to the commission structure.',
  },
];

const COMPARISON_ROWS = [
  { feature: 'Listing', pilot: 'Basic Profile', partner: 'Featured & Gold-Bordered' },
  { feature: 'Commissions', pilot: '0% Introductory', partner: '0% (Pilot Phase)' },
  { feature: 'Search Priority', pilot: 'Standard', partner: 'Top 3 Placement' },
  { feature: 'Trust Signals', pilot: 'Review Stars', partner: '"Parent Verified" Badge' },
  { feature: 'Analytics', pilot: 'Basic Views', partner: 'Zip Code Heatmaps & Benchmarks' },
  { feature: 'Pro Family Access', pilot: '—', partner: 'Priority Booking Integration' },
  { feature: '6-Point Safety Screen', pilot: '—', partner: 'Full "Pro Gold Standard"' },
  { feature: 'Monthly Price', pilot: 'Free', partner: '$25/mo' },
];

export default function Partner() {
  const PARTNER_STRIPE = 'https://buy.stripe.com/bJedRbcoS1QTelG8cg33W02';
  const [flowStep, setFlowStep] = useState('info'); // 'info' | 'confirm' | 'submitted'
  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    email: '',
    phone: '',
    category_id: 'cat-art',
    zip_code: '',
    website: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await api.registerProvider({
        name: formData.business_name,
        description: `${formData.business_name} — Austin enrichment provider.`,
        category_id: formData.category_id,
        email: formData.email,
        phone: formData.phone,
        website: formData.website || undefined,
        zip_code: formData.zip_code,
      });
      setFlowStep('confirm');
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-32">
      {/* ===== HERO ===== */}
      <section className="px-4 pt-8 pb-8 bg-gradient-to-b from-primary/5 to-white">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text mb-3">
            Become a <span className="text-amber-500">KidCircle Partner</span>
          </h1>
          <p className="text-sm text-text-light mb-6 max-w-sm mx-auto">
            Turn Austin parents' recommendations into bookable leads. Get verified, get visible, and grow your enrichment business.
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <a href="#signup" className="btn-primary text-sm">
              Claim Your Profile — Free
            </a>
            <a href="#features" className="btn-secondary text-sm">
              Learn More & See Benefits
            </a>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="px-4 py-6">
        <div className="flex items-center justify-around bg-white rounded-2xl border border-gray-100 py-4 shadow-sm">
          <Stat value="150+" label="Austin Providers" />
          <div className="w-px h-8 bg-gray-200" />
          <Stat value="$25/mo" label="Partner Tier" />
          <div className="w-px h-8 bg-gray-200" />
          <Stat value="0%" label="Pilot Commission" />
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="px-4 py-6">
        <h2 className="text-lg font-bold text-text mb-1 text-center">Everything You Get</h2>
        <p className="text-sm text-text-light mb-5 text-center">The Partner Tier is designed to turn your program into a parent-preferred destination.</p>
        <div className="space-y-3">
          {FEATURES.map((f, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text mb-0.5">{f.title}</h3>
                <p className="text-xs text-text-light">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 6-POINT VERIFICATION ===== */}
      <section className="px-4 py-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-lg mx-auto">
          {/* Prestige header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200/60 rounded-full px-4 py-1.5 mb-3 shadow-sm">
              <span className="text-sm">🏆</span>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Voluntary Excellence Achievement</span>
            </div>
            <h2 className="text-lg font-bold text-text mb-1">
              The <span className="bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">Pro Gold Standard</span> Achievement
            </h2>
            <p className="text-sm text-text-light max-w-sm mx-auto">
              A voluntary excellence badge for providers who want to showcase the highest tier of safety and professionalism. Not mandatory for listing, but highly recommended for top-tier trust.
            </p>
          </div>

          {/* Gold-bordered container */}
          <div className="bg-gradient-to-b from-amber-50/40 to-white rounded-2xl border-2 border-amber-200/40 p-5 shadow-lg shadow-amber-100/30">
            <div className="space-y-3">
              {VERIFICATION_STEPS.map((step, i) => (
                <div key={step.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 hover:border-amber-200/50 hover:shadow-sm transition-all duration-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shadow-amber-200 flex-shrink-0">
                    <span className="drop-shadow-sm">{i + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base">{step.icon}</span>
                      <h3 className="text-sm font-semibold text-text">{step.title}</h3>
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100 ml-auto">Pro Gold</span>
                    </div>
                    <p className="text-xs text-text-light">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Aspirational footer */}
            <div className="mt-5 pt-4 border-t border-amber-100/60 text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-amber-50 rounded-xl px-4 py-2.5">
                <span className="text-lg">👑</span>
                <div>
                  <p className="text-xs font-bold text-amber-800">Earn the Pro Gold Standard</p>
                  <p className="text-[10px] text-amber-600">Complete all 6 checks to unlock the gold-bordered "Parent Verified" badge on your profile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== VERIFICATION CHECKLIST PROGRESS ===== */}
      <section className="px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✅</span>
            <h2 className="text-base font-bold text-text">Onboarding Checklist</h2>
          </div>
          <p className="text-xs text-text-light mb-4">
            Complete these steps to unlock your "Parent Verified" status and start receiving leads.
          </p>

          <div className="space-y-3">
            <ChecklistSection title="Phase 1: Profile Setup" items={[
              'Upload high-res photos (5+) of your facility, staff, and programs',
              'Define age ranges & categories for accurate search matching',
              'Verify your physical Austin-area address',
              'Set up pricing and seasonal camp dates',
            ]} />
            <ChecklistSection title="Phase 2: Trust & Safety (Voluntary)" items={[
              'Collect 3 verified reviews from current parents (Earns "Verified" status)',
              'Identity check via Stripe + Checkr background search (Pro Gold)',
              'Texas DFPS License or health permits (Pro Gold)',
              'Submit Certificate of Insurance ($1M+ GL) (Pro Gold)',
            ]} />
            <ChecklistSection title="Phase 3: Engagement" items={[
              'Commit to <24-hour response time on inquiries',
              'Configure Priority Booking codes for Pro families',
              'Set up your Pro Perks (early registration windows, exclusive discounts)',
            ]} />
          </div>
        </div>
      </section>

      {/* ===== PRICING COMPARISON ===== */}
      <section className="px-4 py-6">
        <h2 className="text-lg font-bold text-text mb-1 text-center">Pilot vs. Partner</h2>
        <p className="text-sm text-text-light mb-5 text-center">See what you unlock when you upgrade.</p>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="grid grid-cols-3 gap-0 border-b border-gray-100 bg-gray-50">
            <div className="p-3 text-xs font-semibold text-text-light">Feature</div>
            <div className="p-3 text-xs font-semibold text-text-light text-center">Pilot</div>
            <div className="p-3 text-xs font-semibold text-amber-600 text-center bg-amber-50">Partner</div>
          </div>
          {COMPARISON_ROWS.map((row, i) => (
            <div key={i} className={`grid grid-cols-3 gap-0 ${i < COMPARISON_ROWS.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="p-3 text-xs text-text">{row.feature}</div>
              <div className="p-3 text-xs text-text-light text-center">{row.pilot}</div>
              <div className={`p-3 text-xs text-center font-medium ${row.partner === '$25/mo' ? 'text-amber-600 font-bold' : 'text-green-700'}`}>
                {row.partner}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== SIGNUP FORM ===== */}
      <section className="px-4 py-6" id="signup">
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white">
          {flowStep === 'confirm' ? (
            /* ===== STEP 2: Confirmation — Benefits Recap + Stripe Checkout ===== */
            <div>
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold mb-1">Almost There, {formData.name.split(' ')[0]}!</h2>
                <p className="text-sm text-white/80 mb-0">
                  Your info is saved. Ready to unlock the full Partner experience?
                </p>
              </div>

              {/* Provider Summary */}
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <p className="text-xs text-white/70 mb-2">Your Profile</p>
                <div className="space-y-1 text-sm text-white">
                  <p><strong>{formData.business_name}</strong></p>
                  <p className="text-xs text-white/80">{formData.email} · {formData.zip_code}</p>
                </div>
              </div>

              {/* Benefits Recap */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-white/80 mb-3 uppercase tracking-wider">Here's What You Get</p>
                <div className="space-y-2">
                  {FEATURES.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
                      <span className="text-base flex-shrink-0">{f.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-white">{f.title}</p>
                        <p className="text-[10px] text-white/70">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price summary */}
              <div className="bg-amber-500/20 rounded-xl p-4 mb-4 text-center border border-amber-400/30">
                <p className="text-xs text-amber-200 mb-1">Partner Tier Pricing</p>
                <p className="text-2xl font-bold text-white">$25<span className="text-base text-white/70">/mo</span></p>
                <p className="text-xs text-amber-200 mt-1">0% commission during Austin pilot</p>
              </div>

              <a
                href={PARTNER_STRIPE}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block py-3 bg-white text-primary font-bold rounded-lg text-sm text-center hover:bg-gray-50 transition-colors mb-3"
              >
                Complete Signup — $25/mo
              </a>
              <button
                onClick={() => setFlowStep('info')}
                className="w-full text-sm text-white/70 underline hover:text-white transition-colors"
              >
                Back to Edit Info
              </button>
              <p className="text-[10px] text-white/50 text-center mt-3">
                🔒 Secure payment via Stripe. Cancel anytime.
              </p>
            </div>
          ) : submitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold mb-1">You're on the List!</h2>
              <p className="text-sm text-white/80 mb-4">
                We'll be in touch within 24 hours to set up your partner profile and start your verification process.
              </p>
              <Link to="/verification" className="inline-flex items-center gap-2 bg-white text-primary font-semibold py-2.5 px-6 rounded-lg text-sm hover:bg-gray-50 transition-colors mb-3">
                <span>Go to Verification Portal</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <button onClick={() => setSubmitted(false)} className="block w-full text-sm text-white/80 underline mt-2">
                Add Another Profile
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🚀</span>
                <h2 className="text-lg font-bold">Claim Your Profile</h2>
              </div>
              <p className="text-sm text-white/80 mb-5">
                Join Austin's top enrichment providers. Set up your profile in minutes.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/80 mb-1 block">Your Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Sarah"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full py-2.5 px-4 rounded-lg text-sm text-text bg-white border-0 focus:ring-2 focus:ring-white/30"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/80 mb-1 block">Business / Program Name</label>
                  <input
                    type="text"
                    placeholder="e.g., The Art Garage"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    className="w-full py-2.5 px-4 rounded-lg text-sm text-text bg-white border-0 focus:ring-2 focus:ring-white/30"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-white/80 mb-1 block">Email</label>
                    <input
                      type="email"
                      placeholder="you@business.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full py-2.5 px-4 rounded-lg text-sm text-text bg-white border-0 focus:ring-2 focus:ring-white/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/80 mb-1 block">Phone</label>
                    <input
                      type="tel"
                      placeholder="(512) 555-..."
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full py-2.5 px-4 rounded-lg text-sm text-text bg-white border-0 focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-white/80 mb-1 block">Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => handleInputChange('category_id', e.target.value)}
                      className="w-full py-2.5 px-4 rounded-lg text-sm text-text bg-white border-0 focus:ring-2 focus:ring-white/30 appearance-none"
                      required
                    >
                      <option value="cat-art">Art & Crafts</option>
                      <option value="cat-coding">Coding & Tech</option>
                      <option value="cat-music">Music</option>
                      <option value="cat-sports">Sports</option>
                      <option value="cat-dance">Dance</option>
                      <option value="cat-science">Science</option>
                      <option value="cat-language">Language</option>
                      <option value="cat-tutoring">Tutoring</option>
                      <option value="cat-camp">Summer Camp</option>
                      <option value="cat-math">Math</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/80 mb-1 block">Austin Zip Code</label>
                    <input
                      type="text"
                      placeholder="e.g., 78746"
                      value={formData.zip_code}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      className="w-full py-2.5 px-4 rounded-lg text-sm text-text bg-white border-0 focus:ring-2 focus:ring-white/30"
                      required
                      pattern="[0-9]{5}"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/80 mb-1 block">Website (optional)</label>
                  <input
                    type="url"
                    placeholder="https://yourprogram.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full py-2.5 px-4 rounded-lg text-sm text-text bg-white border-0 focus:ring-2 focus:ring-white/30"
                  />
                </div>

                {formError && (
                  <div className="p-3 bg-red-500/20 rounded-lg text-xs text-red-100">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-white text-primary font-bold rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Claim My Profile — Free'}
                </button>

                <p className="text-xs text-white/60 text-center">
                  No credit card required. Free during the Austin pilot phase.
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="px-4 py-6">
        <h2 className="text-lg font-bold text-text mb-4 text-center">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="px-4 py-6">
        <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-6 text-white text-center">
          <h2 className="text-lg font-bold mb-2">Ready to Grow with KidCircle?</h2>
          <p className="text-sm text-white/90 mb-4 max-w-xs mx-auto">
            Join Austin's top enrichment providers. Free during the pilot — 0% commission, full visibility.
          </p>
          <a
            href="#signup"
            className="inline-flex items-center gap-2 bg-white text-amber-700 font-semibold py-2.5 px-6 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Get Started Free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}

// Sub-components
function Stat({ value, label }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-text">{value}</div>
      <div className="text-xs text-text-light">{label}</div>
    </div>
  );
}

function ChecklistSection({ title, items }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider mb-2">{title}</h3>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-text">
            <span className="text-green-500 mt-0.5 flex-shrink-0">◻</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="text-sm font-medium text-text pr-4">{question}</span>
        <svg
          className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 animate-slide-up">
          <p className="text-xs text-text-light">{answer}</p>
        </div>
      )}
    </div>
  );
}