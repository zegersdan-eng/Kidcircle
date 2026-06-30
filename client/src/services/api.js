const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Providers
  getProviders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/providers${query ? `?${query}` : ''}`);
  },

  getProvider: (id) => request(`/providers/${id}`),

  // Recommendations
  getRecommendations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/recommendations${query ? `?${query}` : ''}`);
  },

  createRecommendation: (data) => request('/recommendations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Categories
  getCategories: () => request('/categories'),

  // Favorites
  getFavorites: () => request('/favorites'),
  addFavorite: (providerId) => request('/favorites', {
    method: 'POST',
    body: JSON.stringify({ provider_id: providerId }),
  }),
  removeFavorite: (providerId) => request(`/favorites/${providerId}`, {
    method: 'DELETE',
  }),

  // Concierge
  getConciergePreferences: () => request('/concierge/preferences'),

  getConciergeMatch: (data) => request('/concierge/match', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Provider Registration (Partner Onboarding)
  registerProvider: (data) => request('/providers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Camp & Class Swap Marketplace
  getSwaps: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/swaps${query ? `?${query}` : ''}`);
  },

  listSwap: (data) => request('/swaps/list', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  claimSwap: (swapId, data) => request(`/swaps/${swapId}/claim`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  confirmSwap: (swapId) => request(`/swaps/${swapId}/confirm`, {
    method: 'POST',
  }),

  cancelSwap: (swapId, data) => request(`/swaps/${swapId}/cancel`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
  }),

  extractSwapBooking: (data) => request('/swaps/extract', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Verification Portal (Pro Gold Standard)
  getVerificationStatus: (providerId) => request(`/verification/${providerId}`),

  verifyIdentity: (providerId, data) => request(`/verification/${providerId}/identity`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
  }),

  runBackgroundCheck: (providerId) => request(`/verification/${providerId}/background`, {
    method: 'POST',
  }),

  verifyBusiness: (providerId, data) => request(`/verification/${providerId}/business`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  submitLicense: (providerId, data) => request(`/verification/${providerId}/license`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  submitInsurance: (providerId, data) => request(`/verification/${providerId}/insurance`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Referral Program
  getReferralCode: (userId) => request(`/referrals/code/${userId}`),

  getReferralStats: (userId) => request(`/referrals/stats/${userId}`),

  claimReferral: (data) => request('/referrals/claim', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};