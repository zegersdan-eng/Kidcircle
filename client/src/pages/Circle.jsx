import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const MY_CIRCLES = [
  {
    id: 'circle-1',
    name: 'Doss Elementary Moms',
    type: 'school',
    memberCount: 24,
    memberAvatars: ['SL', 'MK', 'JR', 'AT', 'PL+'],
    recentActivity: 'Sarah posted a ZACH Theatre camp swap',
    unread: 3,
  },
  {
    id: 'circle-2',
    name: 'Circle C Neighbors',
    type: 'neighborhood',
    memberCount: 18,
    memberAvatars: ['DM', 'RK', 'JT', 'CN+'],
    recentActivity: 'Mike recommended South Austin Soccer',
    unread: 1,
  },
  {
    id: 'circle-3',
    name: 'South Austin Soccer Parents',
    type: 'interest',
    memberCount: 32,
    memberAvatars: ['JH', 'TW', 'AB', 'MG+'],
    recentActivity: 'New summer clinic dates posted',
    unread: 0,
  },
];

const SUGGESTED_CIRCLES = [
  { id: 'sug-1', name: 'Brentwood Families', type: 'neighborhood', memberCount: 41, mutual: 3 },
  { id: 'sug-2', name: 'ZILKER STEM Moms', type: 'interest', memberCount: 27, mutual: 5 },
  { id: 'sug-3', name: 'Westlake Youth Sports', type: 'school', memberCount: 35, mutual: 2 },
];

export default function Circle() {
  const navigate = useNavigate();
  const [circleTab, setCircleTab] = useState('my-circles');
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(null);

  const handleInvite = () => {
    const shareData = {
      title: 'KidCircle',
      text: 'Join me on KidCircle! Find trusted programs for your kids in Austin. Use my referral code when you sign up! 🎨⚽🎵',
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => navigate('/referral-stats'));
    } else {
      navigate('/referral-stats');
    }
  };

  const CircleTypeBadge = ({ type }) => {
    const config = {
      school: { label: 'School', color: 'text-blue-700', bg: 'bg-blue-50' },
      neighborhood: { label: 'Neighborhood', color: 'text-green-700', bg: 'bg-green-50' },
      interest: { label: 'Interest', color: 'text-purple-700', bg: 'bg-purple-50' },
    };
    const c = config[type] || config.interest;
    return (
      <span className={`text-[10px] font-medium ${c.bg} ${c.color} px-2 py-0.5 rounded-full`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="px-4 pb-32">
      <SEO
        title="My Circle"
        description="Private trust groups for Austin parents — share recommendations with people you trust."
        url="/circle"
      />

      {/* Header */}
      <div className="flex items-center justify-between pt-2 mb-4">
        <div>
          <h1 className="text-xl font-bold text-text mb-0">My Circle</h1>
          <p className="text-xs text-text-light">Private groups & trusted recommendations</p>
        </div>
        <button
          onClick={() => setShowCreateCircle(true)}
          className="text-xs font-semibold text-primary bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors active:scale-[0.95]"
        >
          + New Circle
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex bg-gray-50 rounded-xl p-1 mb-5">
        {[
          { id: 'my-circles', label: 'My Circles', icon: '👥' },
          { id: 'discover', label: 'Discover', icon: '🔍' },
          { id: 'invites', label: 'Invite', icon: '✉️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCircleTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              circleTab === tab.id
                ? 'bg-white text-primary shadow-sm font-semibold'
                : 'text-text-light hover:text-text'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* My Circles tab */}
      {circleTab === 'my-circles' && (
        <div className="space-y-3">
          {MY_CIRCLES.map((circle) => (
            <button
              key={circle.id}
              onClick={() => setSelectedCircle(selectedCircle?.id === circle.id ? null : circle)}
              className={`w-full bg-white rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                selectedCircle?.id === circle.id ? 'border-primary border-2 shadow-md' : 'border-gray-100 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-text">{circle.name}</h3>
                    <CircleTypeBadge type={circle.type} />
                    {circle.unread > 0 && (
                      <span className="bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {circle.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-light">{circle.memberCount} members</p>
                </div>
                <svg className={`w-4 h-4 text-text-muted mt-1 transition-transform ${selectedCircle?.id === circle.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Preview of members */}
              <div className="flex items-center gap-1 mb-2">
                {circle.memberAvatars.map((initials, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-[9px] font-bold text-primary border-2 border-white -ml-1 first:ml-0">
                    {initials}
                  </div>
                ))}
              </div>

              <p className="text-xs text-text-muted">💬 {circle.recentActivity}</p>

              {/* Expanded details */}
              {selectedCircle?.id === circle.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-text mb-1">🔒 Private Group</p>
                    <p className="text-[10px] text-text-light">Only members can see recommendations posted in this circle. Join by invitation only.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">
                      View Circle Feed
                    </button>
                    <button className="flex-1 py-2 text-xs font-medium text-text bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      Invite Members
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-muted">
                    <span>Created Jun 2026</span>
                    <span className="text-primary hover:underline cursor-pointer">Leave Circle</span>
                  </div>
                </div>
              )}
            </button>
          ))}

          {/* Swap Marketplace integration */}
          <div className="bg-gradient-to-r from-purple-50 to-primary/5 rounded-2xl p-4 mt-2">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg">🔄</span>
              <div>
                <p className="text-sm font-semibold text-text">Swap Marketplace</p>
                <p className="text-xs text-text-light">Exclusive: Post to your Circles first</p>
              </div>
            </div>
            <Link
              to="/swap-marketplace"
              className="w-full py-2 bg-white text-primary font-semibold rounded-xl text-xs border border-gray-100 hover:shadow-sm transition-shadow flex items-center justify-center gap-1"
            >
              Go to Swap Marketplace
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Discover tab */}
      {circleTab === 'discover' && (
        <div>
          <p className="text-xs text-text-light mb-4">Suggested groups based on your area and interests</p>
          <div className="space-y-3">
            {SUGGESTED_CIRCLES.map((circle) => (
              <div key={circle.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-text">{circle.name}</h3>
                    <p className="text-xs text-text-light">{circle.memberCount} members · {circle.mutual} mutual friends</p>
                  </div>
                  <CircleTypeBadge type={circle.type} />
                </div>
                <button className="w-full py-2 text-xs font-medium text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors">
                  + Join Group
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite tab */}
      {circleTab === 'invites' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✉️</span>
          </div>
          <h3 className="text-base font-bold text-text mb-1">Invite Friends</h3>
          <p className="text-sm text-text-light mb-6 max-w-xs mx-auto">
            Build your trusted Circle by inviting other Austin parents.
          </p>
          <button onClick={handleInvite} className="btn-primary text-sm inline-flex items-center gap-2 shadow-lg">
            <span>Share Invite Link</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <p className="text-xs text-text-muted mt-4">
            Your referral code: <strong className="text-primary">KCDEMO12</strong>
          </p>
        </div>
      )}

      {/* Create Circle Modal */}
      {showCreateCircle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-overlay" onClick={() => setShowCreateCircle(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-text">Create a Circle</h3>
              <button onClick={() => setShowCreateCircle(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <span className="text-sm">✕</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Circle Name</label>
                <input type="text" placeholder="e.g. Doss Elementary Parents" className="input-field" />
              </div>
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Type</label>
                <select className="input-field bg-white">
                  <option>School</option>
                  <option>Neighborhood</option>
                  <option>Interest</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Description (optional)</label>
                <textarea placeholder="Who should join this circle?" className="input-field min-h-[60px]" />
              </div>
              <button
                onClick={() => { setShowCreateCircle(false); }}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-colors"
              >
                Create Circle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}