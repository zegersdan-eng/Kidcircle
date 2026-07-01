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

// Per-circle feed posts (recommendations from members)
const CIRCLE_FEEDS = {
  'circle-1': [
    { id: 'post-1', author: 'Sarah L.', avatar: 'SL', text: 'My kids absolutely loved the musical theatre camp at ZACH Theatre! The instructors are incredible and the final show was amazing. Highly recommend for ages 6-9.', rating: 5, timestamp: '2 hours ago', tags: ['Theatre', 'Summer Camp'], provider_id: '348eec33-940a-4a07-8e52-45f9b3d6f544' },
    { id: 'post-2', author: 'Megan K.', avatar: 'MK', text: 'Has anyone tried the new coding camp at Neuron Garage? Thinking of signing up my 8-year-old.', rating: 0, timestamp: 'Yesterday', tags: ['Coding', 'STEM'], comments: 4, provider_id: 'f3c7b8a1-2d4e-4b2a-8d1c-8e4f5a3b2c1d' },
    { id: 'post-3', author: 'Jessica R.', avatar: 'JR', text: '⚠️ Heads up — The Art Garage summer camps are almost full for July. Just booked the last spot for week 3!', rating: 0, timestamp: '2 days ago', tags: ['Alert', 'Art'], provider_id: '90c023b6-673b-49c3-922b-76babab8c323' },
    { id: 'post-4', author: 'Amanda T.', avatar: 'AT', text: 'Our group got a discount code for South Austin Soccer Club — DM me if you want it! 15% off summer clinics.', rating: 0, timestamp: '3 days ago', tags: ['Sports', 'Deal'], provider_id: 'b5f1a2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d' },
  ],
  'circle-2': [
    { id: 'post-5', author: 'Mike R.', avatar: 'MR', text: 'Just signed my son up for South Austin Soccer — Coach Martinez runs a fantastic program. Patient, encouraging, and fun!', rating: 5, timestamp: '1 hour ago', tags: ['Soccer', 'Sports'], provider_id: 'b5f1a2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d' },
    { id: 'post-6', author: 'Diana M.', avatar: 'DM', text: 'Any recommendations for a math tutor near Circle C? My 4th grader needs help before school starts.', rating: 0, timestamp: '5 hours ago', tags: ['Tutoring', 'Math'], comments: 3 },
    { id: 'post-7', author: 'Rachel K.', avatar: 'RK', text: 'The new splash pad at Dick Nichols Park is perfect for hot days! Free and shaded seating for parents.', rating: 4, timestamp: 'Yesterday', tags: ['Free', 'Outdoor'] },
    { id: 'post-8', author: 'Jen T.', avatar: 'JT', text: 'Selling two spots for The Art Garage pottery camp week of July 12 — $250 each (paid $320). Message me!', rating: 0, timestamp: '2 days ago', tags: ['Swap', 'Art'], provider_id: '90c023b6-673b-49c3-922b-76babab8c323' },
  ],
  'circle-3': [
    { id: 'post-9', author: 'James H.', avatar: 'JH', text: 'New summer clinic dates are posted! U8-U12 sessions starting June 15. Early bird discount ends this week.', rating: 0, timestamp: '30 min ago', tags: ['Soccer', 'Announcement'] },
    { id: 'post-10', author: 'Tina W.', avatar: 'TW', text: 'My daughter improved so much this season. Coach Martinez really knows how to work with young athletes.', rating: 5, timestamp: '1 day ago', tags: ['Soccer', 'Review'] },
    { id: 'post-11', author: 'Anna B.', avatar: 'AB', text: 'Anyone carpooling from the Mueller area to evening practices? Trying to coordinate.', rating: 0, timestamp: '3 days ago', tags: ['Carpool'], comments: 6 },
  ],
};

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
  // Feed view
  const [activeFeed, setActiveFeed] = useState(null);
  const [feedLoading, setFeedLoading] = useState(false);

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

  const handleViewFeed = async (circle) => {
    setFeedLoading(true);
    setActiveFeed(circle);
    // Try API first, fall back to mock data
    try {
      const posts = await api.getCircleFeed(circle.id);
      if (Array.isArray(posts) && posts.length > 0) {
        setActiveFeedPosts(posts);
      } else {
        setActiveFeedPosts(CIRCLE_FEEDS[circle.id] || []);
      }
    } catch (err) {
      setActiveFeedPosts(CIRCLE_FEEDS[circle.id] || []);
    } finally {
      setFeedLoading(false);
    }
  };

  const [activeFeedPosts, setActiveFeedPosts] = useState([]);

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

      {/* Circle Feed Modal */}
      {activeFeed && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 animate-overlay" onClick={() => { setActiveFeed(null); setActiveFeedPosts([]); }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[85vh] shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Feed header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 z-10">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-bold text-primary">
                    {activeFeed.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text">{activeFeed.name}</h3>
                    <p className="text-[10px] text-text-muted">Circle Feed · {activeFeedPosts.length} posts</p>
                  </div>
                </div>
                <button onClick={() => { setActiveFeed(null); setActiveFeedPosts([]); }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 flex-shrink-0">
                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Feed content */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[65vh]">
              {feedLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                        <div className="h-3 bg-gray-200 rounded w-24" />
                      </div>
                      <div className="h-12 bg-gray-100 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : activeFeedPosts.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-3xl block mb-2">📭</span>
                  <p className="text-sm text-text-light">No posts in this circle yet.</p>
                  <p className="text-xs text-text-muted mt-1">Recommendations will appear here.</p>
                </div>
              ) : (
                activeFeedPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-[10px] font-bold text-primary">
                        {post.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text">{post.author}</p>
                        <p className="text-[10px] text-text-muted">{post.timestamp}</p>
                      </div>
                      {post.rating > 0 && (
                        <div className="ml-auto flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <svg key={i} className={`w-3 h-3 ${i <= post.rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-text-light leading-relaxed">{post.text}</p>
                    {post.provider_id && (
                      <Link
                        to={`/providers/${post.provider_id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline mt-1"
                      >
                        View Provider Details
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] bg-gray-50 text-text-muted px-2 py-0.5 rounded-full border border-gray-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {post.comments > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-text-muted">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{post.comments} {post.comments === 1 ? 'comment' : 'comments'}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Feed footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-3">
              <button
                onClick={() => { setActiveFeed(null); setActiveFeedPosts([]); }}
                className="w-full py-2.5 text-sm font-medium text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors active:scale-[0.97]"
              >
                Close Feed
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