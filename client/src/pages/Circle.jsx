import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { api } from '../services/api';

const INITIAL_MY_CIRCLES = [
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
  const [myCircles, setMyCircles] = useState(INITIAL_MY_CIRCLES);
  const [suggested, setSuggested] = useState(SUGGESTED_CIRCLES);
  const [toast, setToast] = useState(null);

  // Create circle form state
  const [circleName, setCircleName] = useState('');
  const [circleType, setCircleType] = useState('school');
  const [circleDesc, setCircleDesc] = useState('');
  const [circleErrors, setCircleErrors] = useState({});
  const [creating, setCreating] = useState(false);

  // Leave circle confirm
  const [leaveConfirm, setLeaveConfirm] = useState(null);

  // Joining state
  const [joining, setJoining] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Load circles from API on mount
  useEffect(() => {
    async function loadCircles() {
      try {
        const data = await api.getCircles();
        if (Array.isArray(data) && data.length > 0) {
          setMyCircles(data);
        }
      } catch (err) {
        // Use demo data silently
      }
    }
    loadCircles();
  }, []);

  // Load suggested circles from API
  useEffect(() => {
    async function loadSuggested() {
      try {
        const data = await api.getSuggestedCircles();
        if (Array.isArray(data) && data.length > 0) {
          setSuggested(data);
        }
      } catch (err) {
        // Use demo data silently
      }
    }
    if (circleTab === 'discover') {
      loadSuggested();
    }
  }, [circleTab]);

  const handleInvite = () => {
    const shareData = {
      title: 'KidCircle',
      text: 'Join me on KidCircle! Find trusted programs for your kids in Austin. Use my referral code when you sign up! 🎨⚽🎵',
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => navigate('/referral-stats'));
    } else {
      navigator.clipboard.writeText('https://kidcircle.app/join?ref=KCDEMO12').then(() => {
        showToast('Invite link copied to clipboard! 📋');
      }).catch(() => {
        navigate('/referral-stats');
      });
    }
  };

  const handleCreateCircle = async () => {
    // Validate
    const errors = {};
    if (!circleName.trim()) errors.name = 'Please enter a circle name';
    if (!circleType) errors.type = 'Please select a type';
    setCircleErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setCreating(true);
    try {
      // Try API first
      const newCircle = await api.createCircle({
        name: circleName.trim(),
        type: circleType,
        description: circleDesc.trim(),
      });
      setMyCircles(prev => [...prev, newCircle]);
      showToast(`"${circleName}" circle created! 🎉`);
    } catch (err) {
      // Fallback: create locally
      const initials = circleName.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const localCircle = {
        id: `circle-local-${Date.now()}`,
        name: circleName.trim(),
        type: circleType,
        memberCount: 1,
        memberAvatars: ['AP'],
        recentActivity: 'You created this circle',
        unread: 0,
      };
      setMyCircles(prev => [...prev, localCircle]);
      showToast(`"${circleName}" circle created! 🎉`);
    } finally {
      setCreating(false);
      setShowCreateCircle(false);
      setCircleName('');
      setCircleType('school');
      setCircleDesc('');
    }
  };

  const handleViewFeed = (circle) => {
    showToast(`Opening feed for ${circle.name}...`, 'info');
    // Navigate to a feed view (or show inline)
    setSelectedCircle(circle);
  };

  const handleInviteMembers = (circle) => {
    const shareData = {
      title: `Join my "${circle.name}" Circle on KidCircle`,
      text: `I'm inviting you to join my "${circle.name}" private group on KidCircle! We share recommendations for Austin kids' activities.`,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(`Join my "${circle.name}" Circle on KidCircle: https://kidcircle.app/circle/join/${circle.id}`).then(() => {
        showToast(`Invite link for "${circle.name}" copied! 📋`);
      });
    }
  };

  const handleLeaveCircle = (circle) => {
    setLeaveConfirm(circle);
  };

  const confirmLeave = async () => {
    if (!leaveConfirm) return;
    try {
      await api.leaveCircle(leaveConfirm.id);
    } catch (err) {
      // Local fallback
    }
    setMyCircles(prev => prev.filter(c => c.id !== leaveConfirm.id));
    showToast(`Left "${leaveConfirm.name}"`, 'info');
    setLeaveConfirm(null);
    setSelectedCircle(null);
  };

  const handleJoinGroup = async (circle) => {
    setJoining(circle.id);
    try {
      await api.joinCircle(circle.id);
      // Add to my circles
      const newCircle = {
        id: circle.id,
        name: circle.name,
        type: circle.type,
        memberCount: circle.memberCount + 1,
        memberAvatars: ['AP', ...circle.memberAvatars?.slice(0, 3) || []],
        recentActivity: 'You joined this circle',
        unread: 0,
      };
      setMyCircles(prev => [...prev, newCircle]);
      showToast(`Joined "${circle.name}"! 🎉`);
      setSuggested(prev => prev.filter(c => c.id !== circle.id));
    } catch (err) {
      // Local fallback
      const newCircle = {
        id: circle.id,
        name: circle.name,
        type: circle.type,
        memberCount: circle.memberCount + 1,
        memberAvatars: ['AP'],
        recentActivity: 'You joined this circle',
        unread: 0,
      };
      setMyCircles(prev => [...prev, newCircle]);
      showToast(`Joined "${circle.name}"! 🎉`);
      setSuggested(prev => prev.filter(c => c.id !== circle.id));
    } finally {
      setJoining(null);
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
    <div className="px-4 pb-32 relative">
      <SEO
        title="My Circle"
        description="Private trust groups for Austin parents — share recommendations with people you trust."
        url="/circle"
      />

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg transition-all animate-fade-in ${
          toast.type === 'success' ? 'bg-green-600 text-white' :
          toast.type === 'info' ? 'bg-primary text-white' :
          'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Leave Circle Confirmation */}
      {leaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-overlay" onClick={() => setLeaveConfirm(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <span className="text-3xl block mb-2">🚪</span>
              <h3 className="text-base font-bold text-text">Leave "{leaveConfirm.name}"?</h3>
              <p className="text-xs text-text-light mt-2">You'll lose access to the group's recommendations and posts. You can rejoin later if invited.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setLeaveConfirm(null)}
                className="flex-1 py-2.5 text-sm font-medium text-text bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLeave}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Leave Circle
              </button>
            </div>
          </div>
        </div>
      )}

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
          {myCircles.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-base font-semibold text-text mb-1">No circles yet</h3>
              <p className="text-sm text-text-light mb-4 max-w-xs mx-auto">Create a circle for your school, neighborhood, or interest group.</p>
              <button onClick={() => setShowCreateCircle(true)} className="btn-primary text-sm">
                + Create Your First Circle
              </button>
            </div>
          ) : (
            myCircles.map((circle) => (
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
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewFeed(circle); }}
                        className="flex-1 py-2 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors active:scale-[0.97]"
                      >
                        View Circle Feed
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleInviteMembers(circle); }}
                        className="flex-1 py-2 text-xs font-medium text-text bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors active:scale-[0.97]"
                      >
                        Invite Members
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-text-muted">
                      <span>Created Jun 2026</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLeaveCircle(circle); }}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        Leave Circle
                      </button>
                    </div>
                  </div>
                )}
              </button>
            ))
          )}

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
          {suggested.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-text-light">No more suggestions right now. Check back later!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggested.map((circle) => (
                <div key={circle.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-text">{circle.name}</h3>
                      <p className="text-xs text-text-light">{circle.memberCount} members · {circle.mutual} mutual friends</p>
                    </div>
                    <CircleTypeBadge type={circle.type} />
                  </div>
                  <button
                    onClick={() => handleJoinGroup(circle)}
                    disabled={joining === circle.id}
                    className="w-full py-2 text-xs font-medium text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors disabled:opacity-60 active:scale-[0.97]"
                  >
                    {joining === circle.id ? 'Joining...' : '+ Join Group'}
                  </button>
                </div>
              ))}
            </div>
          )}
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
          <button onClick={handleInvite} className="btn-primary text-sm inline-flex items-center gap-2 shadow-lg active:scale-[0.97]">
            <span>Share Invite Link</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <p className="text-xs text-text-muted mt-4">
            Your referral code: <strong className="text-primary">KCDEMO12</strong>
          </p>
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-text-light mb-2">Quick share to:</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => { navigator.clipboard.writeText('https://kidcircle.app/join?ref=KCDEMO12'); showToast('Link copied! 📋'); }}
                className="flex flex-col items-center gap-1 text-text-muted hover:text-text transition-colors"
              >
                <span className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-lg">📋</span>
                <span className="text-[10px]">Copy Link</span>
              </button>
              <button
                onClick={() => { window.open(`https://wa.me/?text=Join%20me%20on%20KidCircle!%20https://kidcircle.app/join?ref=KCDEMO12`, '_blank'); }}
                className="flex flex-col items-center gap-1 text-text-muted hover:text-text transition-colors"
              >
                <span className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-lg">💬</span>
                <span className="text-[10px]">WhatsApp</span>
              </button>
              <button
                onClick={() => { window.open(`sms:&body=Join me on KidCircle! Find trusted programs for your kids in Austin. https://kidcircle.app/join?ref=KCDEMO12`); }}
                className="flex flex-col items-center gap-1 text-text-muted hover:text-text transition-colors"
              >
                <span className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-lg">💬</span>
                <span className="text-[10px]">Text</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Circle Modal */}
      {showCreateCircle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-overlay" onClick={() => { setShowCreateCircle(false); setCircleErrors({}); }}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-text">Create a Circle</h3>
              <button onClick={() => { setShowCreateCircle(false); setCircleErrors({}); }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <span className="text-sm">✕</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Circle Name *</label>
                <input
                  type="text"
                  value={circleName}
                  onChange={(e) => { setCircleName(e.target.value); setCircleErrors(prev => ({ ...prev, name: '' })); }}
                  placeholder="e.g. Doss Elementary Parents"
                  className={`input-field ${circleErrors.name ? 'border-red-300 focus:ring-red-200' : ''}`}
                  autoFocus
                />
                {circleErrors.name && <p className="text-xs text-red-500 mt-1">{circleErrors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Type *</label>
                <select
                  value={circleType}
                  onChange={(e) => setCircleType(e.target.value)}
                  className="input-field bg-white"
                >
                  <option value="school">School</option>
                  <option value="neighborhood">Neighborhood</option>
                  <option value="interest">Interest</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text mb-1 block">Description (optional)</label>
                <textarea
                  value={circleDesc}
                  onChange={(e) => setCircleDesc(e.target.value)}
                  placeholder="Who should join this circle?"
                  className="input-field min-h-[60px]"
                />
              </div>
              <button
                onClick={handleCreateCircle}
                disabled={creating}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 active:scale-[0.97]"
              >
                {creating ? 'Creating...' : 'Create Circle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}