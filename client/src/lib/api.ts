import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('campusgrid_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('campusgrid_token');
      localStorage.removeItem('campusgrid_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.put('/auth/change-password', data),
  googleLogin: (idToken: string) => api.post('/auth/google', { idToken }),
  googleComplete: (data: any) => api.post('/auth/google/complete', data),
};

// ─── Users & Peer Network ──────────────────────────────────────────────────────
export const usersApi = {
  getStats: () => api.get('/users/stats'),
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: any) => api.get(`/users/${id}`),
  getPeerMatches: () => api.get('/users/peer-match'),
  sendConnect: (id: any) => api.post(`/users/${id}/connect`),
  acceptConnect: (id: any) => api.put(`/users/${id}/connect/accept`),
  removeConnect: (id: any) => api.delete(`/users/${id}/connect`),
  toggleActive: (id: any) => api.put(`/users/${id}/toggle-active`),
  changeRole: (id: any, role: any) => api.put(`/users/${id}/role`, { role }),
  updateAvatar: (formData: any) => api.put('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ─── Learning Hub — Resources ──────────────────────────────────────────────────
export const resourcesApi = {
  getAll: (params?: any) => api.get('/resources', { params }),
  getById: (id: any) => api.get(`/resources/${id}`),
  getPending: () => api.get('/resources/pending'),
  upload: (formData: any) => api.post('/resources', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  trackDownload: (id: any) => api.put(`/resources/${id}/download`),
  like: (id: any) => api.put(`/resources/${id}/like`),
  approve: (id: any) => api.put(`/resources/${id}/approve`),
  delete: (id: any) => api.delete(`/resources/${id}`),
};

// ─── AI Document Assistant ─────────────────────────────────────────────────────
export const aiApi = {
  ask: (data: { question: string; resourceId?: string; subject?: string; branch?: string }) =>
    api.post('/ai/ask', data),
  suggest: (resourceId: string) => api.post('/ai/suggest', { resourceId }),
};

// ─── Career Opportunities ──────────────────────────────────────────────────────
export const opportunitiesApi = {
  getAll: (params?: any) => api.get('/opportunities', { params }),
  getById: (id: any) => api.get(`/opportunities/${id}`),
  getAllAdmin: (params?: any) => api.get('/opportunities/admin/all', { params }),
  create: (data: any) => api.post('/opportunities', data),
  update: (id: any, data: any) => api.put(`/opportunities/${id}`, data),
  verify: (id: any, action: 'verify' | 'reject') => api.put(`/opportunities/${id}/verify`, { action }),
  delete: (id: any) => api.delete(`/opportunities/${id}`),
  save: (id: any) => api.put(`/opportunities/${id}/save`),
};

// ─── Real-time Chat ────────────────────────────────────────────────────────────
export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getConversation: (userId: any, params?: any) => api.get(`/chat/${userId}`, { params }),
  sendMessage: (data: any) => api.post('/chat/send', data),
  getUnreadCount: () => api.get('/chat/unread-count'),
};

// ─── Campus Feed & Announcements ───────────────────────────────────────────────
export const contentApi = {
  // Announcements (admin/faculty/placement)
  getAnnouncements: (params?: any) => api.get('/announcements', { params }),
  createAnnouncement: (data: any) => api.post('/announcements', data),
  updateAnnouncement: (id: any, data: any) => api.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id: any) => api.delete(`/announcements/${id}`),
  // Campus Feed (all users, moderated)
  getFeed: (params?: any) => api.get('/feed', { params }),
  getPendingPosts: () => api.get('/feed/pending'),
  createPost: (formData: any) => api.post('/feed', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePost: (id: any, data: any) => api.put(`/feed/${id}`, data),
  likePost: (id: any) => api.put(`/feed/${id}/like`),
  commentPost: (id: any, content: any) => api.post(`/feed/${id}/comment`, { content }),
  approvePost: (id: any, action: 'approve' | 'reject') => api.put(`/feed/${id}/approve`, { action }),
  deletePost: (id: any) => api.delete(`/feed/${id}`),
};

// ─── Campus Lost & Found ───────────────────────────────────────────────────────
export const lostFoundApi = {
  getAll: (params?: any) => api.get('/lostfound', { params }),
  create: (formData: any) => api.post('/lostfound', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  resolve: (id: any, data: any) => api.put(`/lostfound/${id}/resolve`, data),
  claim: (id: any, data?: any) => api.put(`/lostfound/${id}/claim`, data),
  delete: (id: any) => api.delete(`/lostfound/${id}`),
};

// ─── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (notifId: string) => api.put(`/notifications/${notifId}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (notifId: string) => api.delete(`/notifications/${notifId}`),
  clearAll: () => api.delete('/notifications'),
};

// ─── Admin Console ─────────────────────────────────────────────────────────────
export const adminApi = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getAuditLog: (params?: any) => api.get('/admin/audit-log', { params }),
  broadcast: (data: any) => api.post('/admin/broadcast', data),
  reviewResource: (id: string, action: 'approve' | 'reject') => api.put(`/admin/resources/${id}/review`, { action }),
  updateUser: (id: string, data: { role?: string; isActive?: boolean }) => api.put(`/admin/users/${id}`, data),
};

export default api;
