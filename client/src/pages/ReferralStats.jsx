import { useState, useEffect } from 'react';
import { api } from '../services/api';

const MOCK_REFERRALS = [
  { name: 'Sarah M.', joined: '2 weeks ago', reward: '1 month Pro', status: 'active', booking: true },
  { name: 'Jessica L.', joined: '3 weeks ago', reward: '1 month Pro', status: 'active', booking: true },
  { name: 'Amanda K.', joined: '1 month ago', reward: '1 month Pro', status: 'active', booking: true },
  { name: 'Rachel P.', joined: '1 month ago', reward: '1 month Pro', status: 'active', booking: false },
  { name: 'Lauren D.', joined: '5 weeks ago', reward: '1 month Pro', status: 'redeemed', booking: true },
  { name: 'Megan T.', joined: '6 weeks ago', reward: '1 month Pro', status: 'redeemed', booking: true },
  { name: 'Courtney B.', joined: '2 months ago', reward: '1 month Pro', status: 'redeemed', booking: true },
  { name: 'Emily R.', joined: '2 months ago', reward: '1 month Pro', status: 'redeemed', booking: false },
];

const ACTIVITY_TREND = [
  { month: 'Apr', referrals: 1 },
  { month: 'May', referrals: 3 },
  { month: 'Jun', referrals: 4 },
];

const MAX_TREND = Math.max(...ACTIVITY_TREND.map(d => d.referrals));

export default function ReferralStats() {
  const [stats, setStats] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    setLoading(true);
    const userId = 'demo-parent-123';
    try {
      // Get code
      try {
        const codeData = await api.getReferralCode(userId);
        setReferralCode(codeData.referral_code || `KC${userId.substring(0, 6).toUpperCase()}`);
      } catch {
        setReferralCode(`KCDEMO12`);
      }

      // Get stats
      try {
        const statsData = await api.getReferralStats(userId);
        setStats({
          total_referrals: statsData.total_referrals || 8,
          successful: statsData.successful || 6,
          total_rewards: statsData.total_rewards || 6,
          referral_code: statsData.referral_code || `KCDEMO12`,
        });
      } catch {
        // Fallback mock data
        setStats({ total_referrals: 8, successful: 6, total_rewards: 6, referral_code: `KCDEMO12` });
      }
    } catch (err) {
      console.error('Failed to load referral data:', err);
      setStats({ total_referrals: 8, successful: 6, total_rewards: 6, referral_code: `KCDEMO12` });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(referralCode).catch(() => {});
  };

  const handleShare = () => {
    const text = `Join me on KidCircle! Use my referral code: ${referralCode} to get started. Find trusted programs for your kids in Austin!`;
    if (navigator.share) {
      navigator.share({ title: 'KidCircle Referral', text }).catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  const conversionRate = stats?.total_referrals > 0
    ? Math.round((stats.successful / stats.total_referrals) * 100)
    : 0;

  return (
    <div className="px-4 pb-32">
      {/* Header */}
      <div className="pt-2 mb-5">
        <h1 className="text-xl font-bold text-text mb-0">Referral Dashboard</h1>
        <p className="text-xs text-text-light">Track your referrals and rewards</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Referral Code Card */}
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 text-white mb-4 shadow-lg shadow-primary/20">
            <p className="text-xs text-white/80 mb-1">Your Referral Code</p>
            <div className="flex items-center justify-between mb-3">
              <p className="text-2xl font-bold tracking-widest">{referralCode}</p>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors"
              >
                Copy
              </button>
            </div>
            <button
              onClick={handleShare}
              className="w-full py-2.5 bg-white text-primary font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share with Friends
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <ReferralKpi label="Total Referred" value={stats?.total_referrals || 0} icon="👥" />
            <ReferralKpi label="Booked" value={stats?.successful || 0} icon="✅" color="text-green-600" />
            <ReferralKpi label="Rewards Earned" value={stats?.total_rewards || 0} icon="🎁" color="text-amber-600" />
          </div>

          {/* Conversion rate */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-text-light">Referral Conversion Rate</p>
              <span className="text-lg font-bold text-green-600">{conversionRate}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                style={{ width: `${conversionRate}%` }}
              />
            </div>
            <p className="text-[10px] text-text-muted mt-1.5">
              {stats?.successful} of {stats?.total_referrals} referrals resulted in a booking
            </p>
          </div>

          {/* Activity Trend */}
          <section className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
            <h2 className="text-sm font-bold text-text mb-3">Referral Activity</h2>
            <div className="flex items-end gap-4 h-24 mb-2">
              {ACTIVITY_TREND.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-primary to-primary/70 rounded-t-sm"
                    style={{ height: `${(d.referrals / MAX_TREND) * 100}%`, minHeight: 8 }}
                  />
                  <span className="text-[10px] text-text-muted">{d.month}</span>
                  <span className="text-[10px] font-semibold text-text">{d.referrals}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-muted text-center">Your referrals are growing month over month! 🎉</p>
          </section>

          {/* Friends List */}
          <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4 shadow-sm">
            <div className="p-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-text">Friends Who Joined</h2>
              <p className="text-[10px] text-text-light">People who signed up using your referral link</p>
            </div>
            <div className="divide-y divide-gray-50">
              {MOCK_REFERRALS.map((ref, i) => (
                <div key={i} className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary/60">
                        {ref.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">{ref.name}</p>
                      <p className="text-[10px] text-text-muted">Joined {ref.joined}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {ref.booking && <span className="text-[10px] text-green-600 font-medium">Booked ✓</span>}
                    <p className="text-[10px] text-text-muted">{ref.reward}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Rewards Info */}
          <section className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
            <h2 className="text-sm font-bold text-text mb-2">🎁 Rewards Program</h2>
            <div className="space-y-1.5 text-xs text-text-light">
              <p>• <strong>Invite a friend</strong> — Both get <strong>1 month free Pro</strong> when they book their first program</p>
              <p>• <strong>5+ referrals</strong> — Unlock <strong>$50 KidCircle credit</strong> for camp swaps or bookings</p>
              <p>• <strong>Top referrer</strong> each month wins a <strong>$100 gift card</strong> to Austin local businesses</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function ReferralKpi({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm text-center">
      <span className="text-lg mb-1 block">{icon}</span>
      <p className={`text-xl font-bold ${color || 'text-text'}`}>{value}</p>
      <p className="text-[10px] text-text-light mt-0.5">{label}</p>
    </div>
  );
}