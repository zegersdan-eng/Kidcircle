import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import ProviderCard from '../components/ProviderCard';

let nextChildId = 3; // Counter for unique child IDs

const INITIAL_CHILDREN = [
  { id: 'child-1', name: 'Maya', age: 8, interests: ['Art', 'Dance', 'Coding'], grade: '3rd', avatar: '🎨' },
  { id: 'child-2', name: 'Leo', age: 5, interests: ['Soccer', 'Music', 'Nature'], grade: 'Kindergarten', avatar: '⚽' },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeModal, setActiveModal] = useState(null);
  const [editChildId, setEditChildId] = useState(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const [isFoundingParent, setIsFoundingParent] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const navigate = useNavigate();

  const fetchFavorites = useCallback(async () => {
    setLoadingFavorites(true);
    try {
      const data = await api.getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setLoadingFavorites(false);
    }
  }, []);

  const handleToggleFavorite = async (providerId) => {
    try {
      await api.removeFavorite(providerId);
      setFavorites(prev => prev.filter(f => f.provider_id !== providerId));
      showToast('Removed from favorites', 'info');
    } catch (err) {
      console.error('Toggle favorite error:', err);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // --- PERSISTENT STATE: Children ---
  const [children, setChildren] = useState(INITIAL_CHILDREN);

  // --- PERSISTENT STATE: Child form fields (bound to modal inputs) ---
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formInterests, setFormInterests] = useState('');

  // --- PERSISTENT STATE: Overview stats ---
  const [stats] = useState({
    reviews: 12,
    swaps: 3,
    referrals: 8,
    rewards: 6,
  });

  // --- PERSISTENT STATE: User profile info ---
  const [userProfile, setUserProfile] = useState({
    fullName: 'Austin Parent',
    email: 'parent@kidcircle.com',
    location: 'Austin, TX 78701',
    cardInfo: { brand: 'Visa', last4: '4242', exp: '06/28' },
  });
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCard, setEditCard] = useState({ brand: 'Visa', last4: '4242', exp: '06/28' });

  // --- PERSISTENT STATE: Settings toggles ---
  const [settings, setSettings] = useState({
    profile: { enabled: true, notifications: true },
    notifications: { push: true, email: true, sms: false },
    payment: { autoRenew: true, defaultCard: true },
    privacy: { dataSharing: false, visibility: true, location: true },
    connected: { google: true, facebook: false, apple: false },
    help: { saved: true },
    contact: { saved: true },
    terms: { accepted: true },
  });

  const PRO_MONTHLY = 'https://buy.stripe.com/28E8wR2OifHJ5Pa50433W00';
  const PRO_YEARLY = 'https://buy.stripe.com/fZu9AVdsWfHJ4L69gk33W01';

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const openModal = useCallback((modalId, childId = null) => {
    setActiveModal(modalId);
    setEditChildId(childId);

    // Pre-fill form when editing
    if (modalId === 'edit-child' && childId) {
      const child = children.find(c => c.id === childId);
      if (child) {
        setFormName(child.name);
        setFormAge(String(child.age));
        setFormGrade(child.grade);
        setFormInterests(child.interests.join(', '));
      }
    } else if (modalId === 'add-child') {
      setFormName('');
      setFormAge('');
      setFormGrade('');
      setFormInterests('');
    } else if (modalId === 'profile') {
      setEditName(userProfile.fullName);
      setEditEmail(userProfile.email);
      setEditLocation(userProfile.location);
    } else if (modalId === 'payment') {
      setEditCard({ ...userProfile.cardInfo });
    }
  }, [children, userProfile]);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setEditChildId(null);
  }, []);

  const handleSignOut = useCallback(() => {
    setShowSignOutConfirm(false);
    localStorage.removeItem('kidcircle_session');
    sessionStorage.removeItem('kidcircle_session');
    showToast('Signed out successfully', 'success');
    setTimeout(() => navigate('/'), 400);
  }, [navigate, showToast]);

  // --- CHILD CRUD ---
  const handleSaveChild = useCallback(() => {
    const trimmedName = formName.trim();
    if (!trimmedName || !formAge) {
      showToast('Please fill in name and age', 'error');
      return;
    }

    const interests = formInterests
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (activeModal === 'add-child') {
      const newChild = {
        id: `child-${nextChildId++}`,
        name: trimmedName,
        age: parseInt(formAge, 10),
        interests,
        grade: formGrade || 'Not set',
        avatar: ['🎨', '⚽', '🎵', '🔬', '📚', '🎭', '🧩', '🏊'][
          Math.floor(Math.random() * 8)
        ],
      };
      setChildren(prev => [...prev, newChild]);
      showToast(`${trimmedName} added! 🎉`);
    } else if (activeModal === 'edit-child' && editChildId) {
      setChildren(prev =>
        prev.map(c =>
          c.id === editChildId
            ? {
                ...c,
                name: trimmedName,
                age: parseInt(formAge, 10),
                interests,
                grade: formGrade || c.grade,
              }
            : c
        )
      );
      showToast(`${trimmedName} updated! ✨`);
    }

    closeModal();
  }, [formName, formAge, formGrade, formInterests, activeModal, editChildId, closeModal, showToast]);

  // --- SETTINGS TOGGLE ---
  const toggleSetting = useCallback((section, key) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section]?.[key],
      },
    }));
  }, []);

  const handleSaveSettings = useCallback(() => {
    showToast('Settings saved! ✅');
    closeModal();
  }, [showToast, closeModal]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'favorites', label: 'My Favorites', icon: '❤️' },
    { id: 'kids', label: 'My Kids', icon: '👶' },
    { id: 'circles', label: 'Circles', icon: '👥' },
    { id: 'referrals', label: 'Referrals', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const settingModals = {
    profile: { title: 'My Profile', icon: '👤', content: 'Edit your name, email address, and profile photo.' },
    notifications: { title: 'Notification Preferences', icon: '🔔', content: 'Manage push notifications, email digests, and SMS alerts.' },
    payment: { title: 'Payment Methods', icon: '💳', content: 'Manage saved cards and subscription billing.' },
    privacy: { title: 'Privacy & Safety', icon: '🔒', content: 'Control data sharing, profile visibility, and safety settings.' },
    connected: { title: 'Connected Accounts', icon: '🔗', content: 'Link or unlink Google, Facebook, and other accounts.' },
    help: { title: 'Help Center', icon: '❓', content: 'Browse FAQs, step-by-step guides, and video tutorials.' },
    contact: { title: 'Contact Us', icon: '💬', content: 'Reach our team via email, live chat, or phone support.' },
    terms: { title: 'Terms & Privacy', icon: '📄', content: 'Review our Terms of Service, Privacy Policy, and Cookie Policy.' },
  };

  // Map setting sections to their toggle keys + labels
  const settingToggles = {
    profile: [
      { key: 'enabled', label: 'Profile Active' },
      { key: 'notifications', label: 'Profile Updates' },
    ],
    notifications: [
      { key: 'push', label: 'Push Notifications' },
      { key: 'email', label: 'Email Digests' },
      { key: 'sms', label: 'SMS Alerts' },
    ],
    payment: [
      { key: 'autoRenew', label: 'Auto-Renew Subscription' },
      { key: 'defaultCard', label: 'Default Payment Method' },
    ],
    privacy: [
      { key: 'dataSharing', label: 'Share Data with Providers' },
      { key: 'visibility', label: 'Profile Visible to Network' },
      { key: 'location', label: 'Share Location for Nearby' },
    ],
    connected: [
      { key: 'google', label: 'Google Account' },
      { key: 'facebook', label: 'Facebook Account' },
      { key: 'apple', label: 'Apple Account' },
    ],
    help: [{ key: 'saved', label: 'Saved Guides & FAQs' }],
    contact: [{ key: 'saved', label: 'Saved Contact Preferences' }],
    terms: [{ key: 'accepted', label: 'Terms Accepted' }],
  };

  return (
    <div className="px-4 pb-32 relative">
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

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSignOutConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <span className="text-3xl block mb-2">🚪</span>
              <h3 className="text-lg font-bold text-text">Sign Out</h3>
              <p className="text-sm text-text-light mt-1">Are you sure you want to sign out? You'll need to sign back in to access your profile.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 py-2.5 text-sm font-medium text-text bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Modal for Settings / Add / Edit */}
      {activeModal && !showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-text">
                {activeModal === 'add-child' ? '👶 Add a Child' :
                 activeModal === 'edit-child' ? `✏️ Edit ${children.find(c => c.id === editChildId)?.name || 'Child'}` :
                 activeModal === 'pro-features' ? '⭐ Pro Features' :
                 (settingModals[activeModal] ? `${settingModals[activeModal].icon} ${settingModals[activeModal].title}` : 'Settings')}
              </h3>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* CHILD FORM (Add / Edit) */}
            {(activeModal === 'add-child' || activeModal === 'edit-child') && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-light mb-1 block">Child's Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="e.g. Alex"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-light mb-1 block">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={formAge}
                    onChange={e => setFormAge(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="e.g. 7"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-light mb-1 block">Grade</label>
                  <select
                    value={formGrade}
                    onChange={e => setFormGrade(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                  >
                    <option value="">Select grade</option>
                    {['Pre-K', 'Kindergarten', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-light mb-1 block">Interests (comma separated)</label>
                  <input
                    type="text"
                    value={formInterests}
                    onChange={e => setFormInterests(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="e.g. Art, Soccer, Music"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={closeModal} className="flex-1 py-2.5 text-sm font-medium text-text bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChild}
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors"
                  >
                    {activeModal === 'add-child' ? 'Add Child' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* PRO FEATURES MODAL */}
            {activeModal === 'pro-features' && (
              <div className="space-y-3">
                <p className="text-sm text-text-light mb-3">Unlock these premium features:</p>
                <div className="space-y-2">
                  <Link to="/swap-marketplace" onClick={closeModal} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <span className="text-xl">🔄</span>
                    <div>
                      <p className="text-sm font-semibold text-text">Camp & Class Swap</p>
                      <p className="text-xs text-text-light">Buy & sell last-minute spots</p>
                    </div>
                  </Link>
                  <Link to="/referral-stats" onClick={closeModal} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <span className="text-xl">📊</span>
                    <div>
                      <p className="text-sm font-semibold text-text">Referral Dashboard</p>
                      <p className="text-xs text-text-light">Track your impact and rewards</p>
                    </div>
                  </Link>
                </div>
                <div className="pt-2 space-y-2">
                  <a href={PRO_MONTHLY} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm w-full block text-center">
                    Subscribe $7.99/mo
                  </a>
                  <a href={PRO_YEARLY} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm w-full block text-center">
                    Yearly — $70/yr <span className="text-green-600 font-semibold">(Save 27%)</span>
                  </a>
                </div>
              </div>
            )}

            {/* SETTINGS MODAL — Profile (with input fields) */}
            {activeModal === 'profile' && (
              <div>
                <p className="text-sm text-text-light mb-4">{settingModals.profile.content}</p>
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <div>
                    <label className="text-xs font-medium text-text-light mb-1 block">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-light mb-1 block">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-light mb-1 block">Location</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={e => setEditLocation(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="City, State ZIP"
                    />
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-3">
                    <span className="text-sm text-text">Profile Visible</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!!settings.profile?.enabled}
                        onChange={() => toggleSetting('profile', 'enabled')}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUserProfile(prev => ({
                      ...prev,
                      fullName: editName || prev.fullName,
                      email: editEmail || prev.email,
                      location: editLocation || prev.location,
                    }));
                    handleSaveSettings();
                  }}
                  className="mt-4 w-full py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}

            {/* SETTINGS MODAL — Payment (with card info) */}
            {activeModal === 'payment' && (
              <div>
                <p className="text-sm text-text-light mb-4">{settingModals.payment.content}</p>
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  {/* Card display */}
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-white/80">Default Card</span>
                      <span className="badge-featured text-[10px] bg-white/20 text-white">Primary</span>
                    </div>
                    <p className="text-lg font-bold tracking-wider mb-1">
                      {editCard.brand} **** {editCard.last4}
                    </p>
                    <div className="flex items-center justify-between text-xs text-white/80">
                      <span>Expires {editCard.exp}</span>
                      <span>💳</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const cards = [
                        { brand: 'Visa', last4: '4242', exp: '06/28' },
                        { brand: 'Mastercard', last4: '1234', exp: '09/27' },
                        { brand: 'Amex', last4: '9001', exp: '12/29' },
                      ];
                      const currentIdx = cards.findIndex(c => c.last4 === editCard.last4);
                      const nextCard = cards[(currentIdx + 1) % cards.length];
                      setEditCard(nextCard);
                      showToast(`Switched to ${nextCard.brand} **** ${nextCard.last4}`, 'info');
                    }}
                    className="w-full py-2 text-sm font-medium text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    Switch Default Card
                  </button>
                  <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-3">
                    <span className="text-sm text-text">Auto-Renew Subscription</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!!settings.payment?.autoRenew}
                        onChange={() => toggleSetting('payment', 'autoRenew')}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUserProfile(prev => ({ ...prev, cardInfo: editCard }));
                    handleSaveSettings();
                  }}
                  className="mt-4 w-full py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}

            {/* SETTINGS MODAL — Privacy (with richer description) */}
            {activeModal === 'privacy' && (
              <div>
                <p className="text-sm text-text-light mb-4">{settingModals.privacy.content}</p>
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm text-text">Share Data with Providers</span>
                      <p className="text-xs text-text-light mt-0.5">Let providers see your child's age and interests</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input type="checkbox" className="sr-only peer" checked={!!settings.privacy?.dataSharing} onChange={() => toggleSetting('privacy', 'dataSharing')} />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm text-text">Profile Visible to Network</span>
                      <p className="text-xs text-text-light mt-0.5">Other parents can find you in the Circle</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input type="checkbox" className="sr-only peer" checked={!!settings.privacy?.visibility} onChange={() => toggleSetting('privacy', 'visibility')} />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm text-text">Share Location for Nearby</span>
                      <p className="text-xs text-text-light mt-0.5">Enable proximity-based provider recommendations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input type="checkbox" className="sr-only peer" checked={!!settings.privacy?.location} onChange={() => toggleSetting('privacy', 'location')} />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                <button onClick={handleSaveSettings} className="mt-4 w-full py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {/* SETTINGS MODAL — Connected Accounts (richer) */}
            {activeModal === 'connected' && (
              <div>
                <p className="text-sm text-text-light mb-4">{settingModals.connected.content}</p>
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm">🅶</span>
                      <div>
                        <span className="text-sm text-text">Google Account</span>
                        <p className="text-xs text-text-light mt-0.5">{settings.connected?.google ? 'Connected' : 'Not connected'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSetting('connected', 'google')}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        settings.connected?.google ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-text-light'
                      }`}
                    >
                      {settings.connected?.google ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm">📘</span>
                      <div>
                        <span className="text-sm text-text">Facebook Account</span>
                        <p className="text-xs text-text-light mt-0.5">{settings.connected?.facebook ? 'Connected' : 'Not connected'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSetting('connected', 'facebook')}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        settings.connected?.facebook ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-text-light'
                      }`}
                    >
                      {settings.connected?.facebook ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm">🍏</span>
                      <div>
                        <span className="text-sm text-text">Apple Account</span>
                        <p className="text-xs text-text-light mt-0.5">{settings.connected?.apple ? 'Connected' : 'Not connected'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSetting('connected', 'apple')}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        settings.connected?.apple ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-text-light'
                      }`}
                    >
                      {settings.connected?.apple ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                </div>
                <button onClick={handleSaveSettings} className="mt-4 w-full py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {/* SETTINGS MODAL — Other modals (notifications, help, contact, terms) with toggles */}
            {activeModal && activeModal !== 'add-child' && activeModal !== 'edit-child' && activeModal !== 'pro-features' && activeModal !== 'profile' && activeModal !== 'payment' && activeModal !== 'privacy' && activeModal !== 'connected' && settingModals[activeModal] && (
              <div>
                <p className="text-sm text-text-light mb-4">{settingModals[activeModal].content}</p>
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  {settingToggles[activeModal]?.map(toggle => (
                    <div key={toggle.key} className="flex items-center justify-between py-2">
                      <span className="text-sm text-text">{toggle.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={!!settings[activeModal]?.[toggle.key]}
                          onChange={() => toggleSetting(activeModal, toggle.key)}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveSettings} className="mt-4 w-full py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors">
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-2 mb-4">
        <h1 className="text-xl font-bold text-text mb-0">Profile</h1>
        <p className="text-xs text-text-light mb-0">Manage your account & preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex bg-gray-50 rounded-xl p-1 mb-5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] ${
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm font-semibold'
                : 'text-text-light hover:text-text'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/20">
              <span className="text-2xl font-bold text-white">
                {userProfile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-text">{userProfile.fullName}</h2>
            <p className="text-sm text-text-light">{userProfile.email} · {userProfile.location}</p>

            {isFoundingParent && (
              <div className="mt-3 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg px-3 py-1.5">
                <img src="/assets/badges/founding-parent.svg" alt="Founding Parent" className="w-5 h-5" />
                <span className="text-xs font-bold text-amber-800">Founding Parent</span>
                <span className="text-[10px] text-amber-600 font-medium">★ 15% off for life</span>
              </div>
            )}

            <div className="mt-4 space-y-2">
              {isFoundingParent ? (
                <>
                  <a
                    href={PRO_MONTHLY}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => showToast('Opening Stripe checkout...', 'info')}
                    className="btn-primary text-sm w-full block relative overflow-hidden"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>Upgrade to KidCircle Pro</span>
                      <span className="text-lg line-through text-white/60">$7.99</span>
                      <span className="bg-white text-primary font-bold px-2 py-0.5 rounded-md text-xs">$6.79/mo</span>
                    </span>
                    <span className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">Founding Discount</span>
                  </a>
                  <a
                    href={PRO_YEARLY}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => showToast('Opening Stripe checkout...', 'info')}
                    className="btn-secondary text-sm w-full block"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>Yearly — </span>
                      <span className="line-through text-text-muted">$70/yr</span>
                      <span className="text-green-600 font-semibold">$58/yr</span>
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Save 17%</span>
                    </span>
                  </a>
                </>
              ) : (
                <>
                  <a
                    href={PRO_MONTHLY}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => showToast('Opening Stripe checkout...', 'info')}
                    className="btn-primary text-sm w-full block"
                  >
                    Upgrade to KidCircle Pro — $7.99/mo
                  </a>
                  <a
                    href={PRO_YEARLY}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => showToast('Opening Stripe checkout...', 'info')}
                    className="btn-secondary text-sm w-full block"
                  >
                    Pro Yearly — $70/yr <span className="text-green-600 font-semibold">(Save 27%)</span>
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats — driven by state */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <QuickStat icon="⭐" label="Reviews Given" value={stats.reviews} />
            <QuickStat icon="🔄" label="Swaps Completed" value={stats.swaps} />
            <QuickStat icon="👥" label="Referrals" value={stats.referrals} color="text-green-600" />
            <QuickStat icon="🎁" label="Rewards Earned" value={stats.rewards} color="text-amber-600" />
          </div>

          {/* Children count in overview */}
          <div className="bg-gradient-to-r from-blue-50 to-primary/5 rounded-2xl p-4 mb-4">
            <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider mb-3">My Kids</h3>
            <div className="flex items-center gap-2 text-sm text-text">
              <span className="text-lg">👶</span>
              <span className="font-medium">{children.length} {children.length === 1 ? 'child' : 'children'} on profile</span>
            </div>
            {children.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {children.map(c => (
                  <span key={c.id} className="text-xs bg-white text-primary px-2 py-1 rounded-full border border-primary/10">
                    {c.avatar} {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pro Features */}
          <div className="bg-gradient-to-r from-purple-50 to-primary/5 rounded-2xl p-4 mb-4">
            <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider mb-3">Pro Features</h3>
            <div className="space-y-2">
              <Link to="/swap-marketplace" onClick={() => showToast('Opening Swap Marketplace...', 'info')} className="flex items-center justify-between bg-white rounded-xl p-3.5 border border-gray-100 hover:shadow-sm transition-shadow active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔄</span>
                  <div>
                    <p className="text-sm font-semibold text-text">Camp & Class Swap</p>
                    <p className="text-xs text-text-light">Buy & sell last-minute spots</p>
                  </div>
                </div>
                <span className="badge-pro text-[10px]">Pro</span>
              </Link>
              <Link to="/referral-stats" onClick={() => showToast('Opening Referral Dashboard...', 'info')} className="flex items-center justify-between bg-white rounded-xl p-3.5 border border-gray-100 hover:shadow-sm transition-shadow active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📊</span>
                  <div>
                    <p className="text-sm font-semibold text-text">Referral Dashboard</p>
                    <p className="text-xs text-text-light">Track your impact and rewards</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Favorites */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text">My Favorited Providers</h2>
              <span className="text-xs text-text-light">{favorites.length} saved</span>
            </div>

            {loadingFavorites ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : favorites.length > 0 ? (
              <div className="space-y-3">
                {favorites.map(fav => (
                  <ProviderCard 
                    key={fav.id} 
                    provider={{
                      id: fav.provider_id,
                      name: fav.provider_name,
                      category_id: fav.category_id,
                      zip_code: fav.zip_code,
                      avg_rating: fav.avg_rating,
                      category_name: fav.category_id?.replace('cat-', '').toUpperCase()
                    }}
                    isFavorited={true}
                    onToggleFavorite={() => handleToggleFavorite(fav.provider_id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <span className="text-3xl block mb-2">❤️</span>
                <p className="text-sm text-text-light mb-4">No favorites yet</p>
                <Link to="/providers" className="btn-primary text-sm inline-block px-6">
                  Discover Providers
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: My Kids */}
      {activeTab === 'kids' && (
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text">My Children</h2>
              <button
                onClick={() => openModal('add-child')}
                className="text-xs font-semibold text-primary bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors active:scale-[0.95]"
              >
                + Add Child
              </button>
            </div>

            <div className="space-y-3">
              {children.map(child => (
                <ChildCard
                  key={child.id}
                  name={child.name}
                  age={child.age}
                  interests={child.interests}
                  grade={child.grade}
                  avatar={child.avatar}
                  onEdit={() => openModal('edit-child', child.id)}
                />
              ))}
              {children.length === 0 && (
                <div className="text-center py-8 text-text-light">
                  <span className="text-3xl block mb-2">👶</span>
                  <p className="text-sm">No children added yet</p>
                  <p className="text-xs mt-1">Tap "+ Add Child" to get started</p>
                </div>
              )}
            </div>

            <button
              onClick={() => openModal('add-child')}
              className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-text-light hover:border-primary hover:text-primary transition-colors active:scale-[0.98]"
            >
              + Add Another Child
            </button>
          </div>
        </div>
      )}

      {/* Tab: Circles */}
      {activeTab === 'circles' && (
        <div>
          <div className="bg-gradient-to-r from-purple-50 to-primary/5 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-text">Your Circles</h2>
                <p className="text-xs text-text-light">3 active circles</p>
              </div>
              <Link
                to="/circle"
                className="text-xs font-semibold text-primary bg-white px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm">🏫</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text">Doss Elementary Moms</p>
                  <p className="text-[10px] text-text-light">24 members · School</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-sm">🏡</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text">Circle C Neighbors</p>
                  <p className="text-[10px] text-text-light">18 members · Neighborhood</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-sm">⚽</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text">South Austin Soccer Parents</p>
                  <p className="text-[10px] text-text-light">32 members · Interest</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-text mb-3">🔒 Circle Privacy</h3>
            <p className="text-xs text-text-light mb-3">
              Circles are private trust groups. Only members can see recommendations posted within them. Your posts are never shared outside the circle.
            </p>
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <span className="text-xs text-text">Auto-share reviews to my Circles</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <span className="text-xs text-text">Show circle badges on my profile</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 mt-4 border border-amber-100">
            <h3 className="text-xs font-semibold text-text mb-2">💡 Circle Tips</h3>
            <ul className="text-xs text-text-light space-y-1">
              <li>• Create a circle for your child's school or neighborhood</li>
              <li>• Swap Marketplace listings can be posted to Circles first for exclusive access</li>
              <li>• Invite parents you trust — quality over quantity!</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab: Referrals */}
      {activeTab === 'referrals' && (
        <div>
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 text-white mb-4 shadow-lg shadow-primary/20">
            <p className="text-xs text-white/80 mb-1">Your Referral Code</p>
            <div className="flex items-center justify-between mb-3">
              <p className="text-2xl font-bold tracking-widest">KCDEMO12</p>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText('KCDEMO12');
                  showToast('Copied to clipboard! 📋');
                }}
                className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors active:scale-[0.95]"
              >
                Copy
              </button>
            </div>
            <Link
              to="/referral-stats"
              onClick={() => showToast('Opening Referral Dashboard...', 'info')}
              className="w-full py-2.5 bg-white text-primary font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              View Full Dashboard
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <QuickStat icon="👥" label="Referred" value={stats.referrals} />
            <QuickStat icon="✅" label="Booked" value={Math.floor(stats.referrals * 0.75)} color="text-green-600" />
            <QuickStat icon="🎁" label="Rewards" value={stats.rewards} color="text-amber-600" />
          </div>

          {/* Rewards progress */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100 mb-4">
            <h3 className="text-sm font-bold text-text mb-2">🎁 Rewards Progress</h3>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text">1 friend = 1 month free Pro</span>
                  <span className="text-green-600 font-medium">{stats.referrals >= 1 ? '✅ Earned' : '⏳ In progress'}</span>
                </div>
                <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, stats.referrals * 12.5)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text">5 referrals = $50 credit</span>
                  <span className={`${stats.referrals >= 5 ? 'text-green-600' : 'text-amber-600'} font-medium`}>
                    {stats.referrals >= 5 ? '✅ Unlocked' : `${stats.referrals}/5`}
                  </span>
                </div>
                <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, (stats.referrals / 5) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text">Top referrer = $100 gift card</span>
                  <span className="text-amber-600 font-medium">🔥 {stats.referrals} this month</span>
                </div>
                <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: `${Math.min(100, (stats.referrals / 10) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4">
            <h2 className="text-sm font-bold text-text mb-3">Account Settings</h2>
            <div className="space-y-1">
              <SettingRow label="My Profile" icon="👤" desc="Name, email, photo" onClick={() => openModal('profile')} />
              <SettingRow label="Notification Preferences" icon="🔔" desc="Push, email, SMS" onClick={() => openModal('notifications')} />
              <SettingRow label="Payment Methods" icon="💳" desc="Cards, Pro subscription" onClick={() => openModal('payment')} />
              <SettingRow label="Privacy & Safety" icon="🔒" desc="Data sharing, visibility" onClick={() => openModal('privacy')} />
              <SettingRow label="Connected Accounts" icon="🔗" desc="Google, Facebook" onClick={() => openModal('connected')} />
            </div>
          </div>

          {/* Notification Settings — visible toggles for Push, Email, SMS */}
          <div className="bg-gradient-to-r from-blue-50 to-primary/5 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-text">🔔 Notification Settings</h2>
              <span className="text-[10px] text-text-muted bg-white px-2 py-0.5 rounded-full">Push · Email · SMS</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">📱</span>
                  <span className="text-sm text-text">Push Notifications</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={!!settings.notifications?.push} onChange={() => toggleSetting('notifications', 'push')} />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">✉️</span>
                  <span className="text-sm text-text">Email Digests</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={!!settings.notifications?.email} onChange={() => toggleSetting('notifications', 'email')} />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">💬</span>
                  <span className="text-sm text-text">SMS Alerts</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={!!settings.notifications?.sms} onChange={() => toggleSetting('notifications', 'sms')} />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-text mb-3">Support</h2>
            <div className="space-y-1">
              <SettingRow label="Help Center" icon="❓" desc="FAQs, guides, tutorials" onClick={() => openModal('help')} />
              <SettingRow label="Contact Us" icon="💬" desc="Email, chat, or call" onClick={() => openModal('contact')} />
              <SettingRow label="Terms & Privacy" icon="📄" desc="Legal policies" onClick={() => openModal('terms')} />
            </div>
          </div>

          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full mt-4 py-3 text-sm text-red-500 font-medium bg-red-50 rounded-xl hover:bg-red-100 transition-colors active:scale-[0.98]"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function QuickStat({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm text-center">
      <span className="text-lg mb-1 block">{icon}</span>
      <p className={`text-xl font-bold ${color || 'text-text'}`}>{value}</p>
      <p className="text-[10px] text-text-light mt-0.5">{label}</p>
    </div>
  );
}

function ChildCard({ name, age, interests, grade, avatar, onEdit }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">
        {avatar}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text">{name}</h3>
          <span className="text-[10px] text-text-muted bg-white px-2 py-0.5 rounded-full">{grade}</span>
        </div>
        <p className="text-xs text-text-light">Age {age}</p>
        <div className="flex gap-1 mt-1">
          {interests.map((i, idx) => (
            <span key={idx} className="text-[10px] bg-white text-primary px-2 py-0.5 rounded-full border border-primary/10">
              {i}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onEdit}
        className="text-xs text-primary font-medium hover:underline active:scale-[0.95]"
      >
        Edit
      </button>
    </div>
  );
}

function SettingRow({ label, icon, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <div className="text-left">
          <p className="text-sm font-medium text-text">{label}</p>
          {desc && <p className="text-[10px] text-text-muted">{desc}</p>}
        </div>
      </div>
      <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}