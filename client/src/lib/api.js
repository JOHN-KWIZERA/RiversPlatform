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
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

export const userApi = {
  getAll: (params) => api.get('/users', { params }),
  verify: (id, isVerified) => api.patch(`/users/${id}/verify`, { isVerified }),
};

export const beneficiaryApi = {
  getMyProfile: () => api.get('/beneficiaries/me'),
  updateMyProfile: (data) => api.patch('/beneficiaries/me', data),
  getAll: (params) => api.get('/beneficiaries', { params }),
  addAssistance: (beneficiaryId, data) => api.post(`/beneficiaries/${beneficiaryId}/assistance`, data),
  addProgress: (beneficiaryId, data) => api.post(`/beneficiaries/${beneficiaryId}/progress`, data),
};

export const opportunityApi = {
  getAll: (params) => api.get('/opportunities', { params }),
  getById: (id) => api.get(`/opportunities/${id}`),
  create: (data) => api.post('/opportunities', data),
  update: (id, data) => api.patch(`/opportunities/${id}`, data),
  apply: (id, data) => api.post(`/opportunities/${id}/apply`, data),
  getMyApplications: () => api.get('/opportunities/my-applications'),
  updateApplicationStatus: (id, appId, status) => api.patch(`/opportunities/${id}/applications/${appId}`, { status }),
};

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markRead: (ids = []) => api.patch('/notifications/read', { ids }),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const uploadApi = {
  image: (file, folder = 'general') => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/upload/image?folder=${folder}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  document: (file, folder = 'documents') => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/upload/document?folder=${folder}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
  },
};

export default api;
