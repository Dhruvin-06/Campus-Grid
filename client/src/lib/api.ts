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

// ─── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
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

// ─── Resources ─────────────────────────────────────────────────────────────────
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

// ─── Jobs ──────────────────────────────────────────────────────────────────────
export const jobsApi = {
  getAll: (params?: any) => api.get('/jobs', { params }),
  getById: (id: any) => api.get(`/jobs/${id}`),
  getBookmarks: () => api.get('/jobs/bookmarks'),
  create: (data: any) => api.post('/jobs', data),
  update: (id: any, data: any) => api.put(`/jobs/${id}`, data),
  bookmark: (id: any) => api.put(`/jobs/${id}/bookmark`),
  delete: (id: any) => api.delete(`/jobs/${id}`),
};

// ─── Chat ──────────────────────────────────────────────────────────────────────
export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getConversation: (userId: any, params?: any) => api.get(`/chat/${userId}`, { params }),
  sendMessage: (data: any) => api.post('/chat/send', data),
  getUnreadCount: () => api.get('/chat/unread-count'),
};

// ─── Announcements & Blogs ─────────────────────────────────────────────────────
export const contentApi = {
  getAnnouncements: (params?: any) => api.get('/announcements', { params }),
  createAnnouncement: (data: any) => api.post('/announcements', data),
  deleteAnnouncement: (id: any) => api.delete(`/announcements/${id}`),
  getBlogs: (params?: any) => api.get('/blogs', { params }),
  getPendingBlogs: () => api.get('/blogs/pending'),
  createBlog: (formData: any) => api.post('/blogs', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  likeBlog: (id: any) => api.put(`/blogs/${id}/like`),
  commentBlog: (id: any, content: any) => api.post(`/blogs/${id}/comment`, { content }),
  approveBlog: (id: any) => api.put(`/blogs/${id}/approve`),
};

// ─── Lost & Found ──────────────────────────────────────────────────────────────
export const lostFoundApi = {
  getAll: (params?: any) => api.get('/lostfound', { params }),
  create: (formData: any) => api.post('/lostfound', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  resolve: (id: any, data: any) => api.put(`/lostfound/${id}/resolve`, data),
  delete: (id: any) => api.delete(`/lostfound/${id}`),
};

// ─── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getAuditLog: (params?: any) => api.get('/admin/audit-log', { params }),
  getPlacementReport: () => api.get('/admin/placement-report'),
  broadcast: (data: any) => api.post('/admin/broadcast', data),
  // Events (admin)
  getAdminEvents: () => api.get('/admin/events'),
  createAdminEvent: (data: any) => api.post('/admin/events', data),
  updateAdminEvent: (id: any, data: any) => api.put(`/admin/events/${id}`, data),
  deleteAdminEvent: (id: any) => api.delete(`/admin/events/${id}`),
};

// ─── Timetable ─────────────────────────────────────────────────────────────────
export const timetableApi = {
  get: () => api.get('/timetable'),
  addSlot: (data: any) => api.post('/timetable/slots', data),
  updateSlot: (slotId: any, data: any) => api.put(`/timetable/slots/${slotId}`, data),
  deleteSlot: (slotId: any) => api.delete(`/timetable/slots/${slotId}`),
  updateSemester: (semester: string) => api.put('/timetable/semester', { semester }),
};

// ─── Attendance ────────────────────────────────────────────────────────────────
export const attendanceApi = {
  get: (semester: string) => api.get('/attendance', { params: { semester } }),
  addSubject: (data: any) => api.post('/attendance/subjects', data),
  logAttendance: (subjectId: any, data: any) => api.post(`/attendance/subjects/${subjectId}/log`, data),
  removeSubject: (subjectId: any, semester: string) => api.delete(`/attendance/subjects/${subjectId}`, { params: { semester } }),
  deleteRecord: (subjectId: any, recordId: any, semester: string) =>
    api.delete(`/attendance/subjects/${subjectId}/log/${recordId}`, { params: { semester } }),
};

// ─── Grades ────────────────────────────────────────────────────────────────────
export const gradesApi = {
  getAll: () => api.get('/grades'),
  getSemester: (semester: string) => api.get(`/grades/${encodeURIComponent(semester)}`),
  upsert: (data: any) => api.post('/grades', data),
  deleteSemester: (semester: string) => api.delete(`/grades/${encodeURIComponent(semester)}`),
};

// ─── Assignments ───────────────────────────────────────────────────────────────
export const assignmentsApi = {
  getAll: (params?: any) => api.get('/assignments', { params }),
  getStats: () => api.get('/assignments/stats'),
  create: (data: any) => api.post('/assignments', data),
  update: (id: any, data: any) => api.put(`/assignments/${id}`, data),
  delete: (id: any) => api.delete(`/assignments/${id}`),
};

// ─── Study Groups ──────────────────────────────────────────────────────────────
export const studyGroupsApi = {
  getAll: (params?: any) => api.get('/studygroups', { params }),
  getMine: () => api.get('/studygroups/mine'),
  create: (data: any) => api.post('/studygroups', data),
  join: (id: any) => api.post(`/studygroups/${id}/join`),
  leave: (id: any) => api.delete(`/studygroups/${id}/leave`),
  delete: (id: any) => api.delete(`/studygroups/${id}`),
};

// ─── Events ────────────────────────────────────────────────────────────────────
export const eventsApi = {
  getAll: (params?: any) => api.get('/events', { params }),
  getById: (id: any) => api.get(`/events/${id}`),
  rsvp: (id: any) => api.post(`/events/${id}/rsvp`),
};

// ─── Leaderboard ───────────────────────────────────────────────────────────────
export const leaderboardApi = {
  get: (params?: any) => api.get('/leaderboard', { params }),
};

export default api;

