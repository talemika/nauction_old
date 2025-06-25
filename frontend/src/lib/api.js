import axios from 'axios';

// Determine API base URL based on environment
const isLocalDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.startsWith('192.168.') ||
                          window.location.hostname.startsWith('10.') ||
                          window.location.hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./);

const API_BASE_URL = isLocalDevelopment 
  ? 'http://localhost:5000/api'
  : 'https://5000-ikh7t640hxicw0sx0ks08-287ac3c4.manusvm.computer/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  getAllUsers: () => api.get('/auth/users'),
  updateUserRole: (userId, role) => api.put(`/auth/users/${userId}/role`, { role }),
};

// Auctions API
export const auctionsAPI = {
  getAll: () => api.get('/auctions'),
  getById: (id) => api.get(`/auctions/${id}`),
  create: (auctionData) => api.post('/auctions', auctionData),
  getUserAuctions: () => api.get('/auctions/user/my-auctions'),
  cancel: (id) => api.patch(`/auctions/${id}/cancel`),
};

// Bids API
export const bidsAPI = {
  placeBid: (bidData) => api.post('/bids', bidData),
  getAuctionBids: (auctionId) => api.get(`/bids/auction/${auctionId}`),
  getUserBids: () => api.get('/bids/user/my-bids'),
  getHighestBid: (auctionId) => api.get(`/bids/auction/${auctionId}/highest`),
};

// Currency API
export const currencyAPI = {
  getExchangeRates: () => api.get('/currency/rates'),
  convertCurrency: (amount, fromCurrency, toCurrency) => 
    api.post('/currency/convert', { amount, fromCurrency, toCurrency }),
  formatCurrency: (amount, currency) => 
    api.post('/currency/format', { amount, currency }),
};

// Max Bid API
export const maxBidAPI = {
  setMaxBid: (auctionId, maxAmount) => api.post(`/auctions/${auctionId}/max-bid`, { maxAmount }),
  getMaxBid: (auctionId) => api.get(`/auctions/${auctionId}/max-bid`),
  cancelMaxBid: (auctionId) => api.delete(`/auctions/${auctionId}/max-bid`),
};

// Export the main api instance
export { api };
export default api;

