import axios from 'axios';
import { auth } from '../config/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err?.response?.data || err)
);

export const campaignApi = {
  getAll: (params) => api.get('/campaigns', { params }),
  getById: (id) => api.get(`/campaigns/${id}`),
  getMy: () => api.get('/campaigns/my'),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.patch(`/campaigns/${id}`, data),
  approve: (id, data) => api.patch(`/campaigns/${id}/approve`, data),
};

export const donationApi = {
  create: (data) => api.post('/donations', data),
  getMy: () => api.get('/donations/my'),
  getCampaignDonations: (campaignId) => api.get(`/donations/campaign/${campaignId}`),
};

export const analyticsApi = {
  admin: () => api.get('/analytics/admin'),
  leader: () => api.get('/analytics/leader'),
  sponsor: () => api.get('/analytics/sponsor'),
};

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
};

export const userApi = {
  getAll: (params) => api.get('/users', { params }),
  verify: (id, isVerified) => api.patch(`/users/${id}/verify`, { isVerified }),
};

export default api;
