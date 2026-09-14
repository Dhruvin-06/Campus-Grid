'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi, usersApi, resourcesApi, contentApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Shield, Users, BookOpen, Briefcase, FileText, Clock,
  CheckCircle, XCircle, TrendingUp, BarChart2, UserCheck,
  AlertTriangle, RefreshCw, Megaphone, Calendar, ClipboardList,
  Activity, Search, Plus, Trash2, Edit2, X, Eye, Send,
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'users', label: '👥 Users' },
  { id: 'content', label: '📋 Content' },
  { id: 'events', label: '📅 Events' },
  { id: 'placement', label: '🏢 Placement' },
  { id: 'audit', label: '🔑 Audit Log' },
  { id: 'broadcast', label: '📢 Broadcast' },
] as const;

type Tab = typeof TABS[number]['id'];

const EVENT_TYPES = ['fest', 'hackathon', 'seminar', 'workshop', 'sports', 'cultural', 'other'];
const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const emptyEvent = {
  title: '', description: '', type: 'seminar', date: '', endDate: '', venue: '',
  registrationLink: '', tags: '', maxAttendees: 0, isPublished: false, isFeatured: false,
};

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userBranch, setUserBranch] = useState('');
  const [userRole, setUserRole] = useState('');
  const [usersTotal, setUsersTotal] = useState(0);
  const [pendingResources, setPendingResources] = useState<any[]>([]);
  const [pendingBlogs, setPendingBlogs] = useState<any[]>([]);
  const [adminEvents, setAdminEvents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [placementReport, setPlacementReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  // Events form
  const [showEventForm, setShowEventForm] = useState(false);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [savingEvent, setSavingEvent] = useState(false);
  // Broadcast
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastBranch, setBroadcastBranch] = useState('All');
  const [broadcastRole, setBroadcastRole] = useState('All');
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') { router.replace('/dashboard'); return; }
    fetchBaseData();
  }, [user]);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'events') fetchEvents();
    if (tab === 'audit') fetchAuditLog();
    if (tab === 'placement') fetchPlacement();
  }, [tab]);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
  }, [userSearch, userBranch, userRole]);

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, pendingResRes, pendingBlogsRes] = await Promise.all([
        adminApi.getAnalytics(),
        resourcesApi.getPending(),
        contentApi.getPendingBlogs(),
      ]);
      setAnalytics(analyticsRes.data);
      setPendingResources(pendingResRes.data.resources || []);
      setPendingBlogs(pendingBlogsRes.data.blogs || []);
    } catch { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await adminApi.getUsers({ search: userSearch || undefined, branch: userBranch || undefined, role: userRole || undefined, limit: 20 });
      setUsers(res.data.users || []);
      setUsersTotal(res.data.total || 0);
    } catch { toast.error('Failed to load users'); }
  };

  const fetchEvents = async () => {
    try {
      const res = await adminApi.getAdminEvents();
      setAdminEvents(res.data.events || []);
    } catch { toast.error('Failed to load events'); }
  };

  const fetchAuditLog = async () => {
    try {
      const res = await adminApi.getAuditLog();
      setAuditLogs(res.data.logs || []);
    } catch { toast.error('Failed to load audit log'); }
  };

  const fetchPlacement = async () => {
    try {
      const res = await adminApi.getPlacementReport();
      setPlacementReport(res.data);
    } catch { toast.error('Failed to load placement report'); }
  };

  // Content actions
  const approveResource = async (id: string) => {
    try { await resourcesApi.approve(id); setPendingResources((p) => p.filter((r) => r._id !== id)); toast.success('Approved!'); } catch { toast.error('Failed'); }
  };
  const deleteResource = async (id: string) => {
    try { await resourcesApi.delete(id); setPendingResources((p) => p.filter((r) => r._id !== id)); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };
  const approveBlog = async (id: string) => {
    try { await contentApi.approveBlog(id); setPendingBlogs((p) => p.filter((b) => b._id !== id)); toast.success('Published!'); } catch { toast.error('Failed'); }
  };

  // User actions
  const toggleUserActive = async (id: string, isActive: boolean) => {
    try {
      await usersApi.toggleActive(id);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: !isActive } : u));
      toast.success(`User ${isActive ? 'deactivated' : 'activated'}`);
    } catch { toast.error('Failed'); }
  };
  const changeRole = async (id: string, role: string) => {
    try {
      await usersApi.changeRole(id, role);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role } : u));
      toast.success(`Role changed`);
    } catch { toast.error('Failed'); }
  };

  // Events CRUD
  const openCreateEvent = () => { setEditEvent(null); setEventForm(emptyEvent); setShowEventForm(true); };
  const openEditEvent = (ev: any) => {
    setEditEvent(ev);
    setEventForm({
      ...emptyEvent, ...ev,
      date: ev.date ? ev.date.split('T')[0] : '',
      endDate: ev.endDate ? ev.endDate.split('T')[0] : '',
      tags: (ev.tags || []).join(', '),
    });
    setShowEventForm(true);
  };
  const saveEvent = async () => {
    if (!eventForm.title || !eventForm.date) return toast.error('Title and date required');
    setSavingEvent(true);
    try {
      const payload = { ...eventForm, tags: eventForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean) };
      if (editEvent) {
        const res = await adminApi.updateAdminEvent(editEvent._id, payload);
        setAdminEvents((prev) => prev.map((e) => e._id === editEvent._id ? res.data.event : e));
        toast.success('Event updated!');
      } else {
        const res = await adminApi.createAdminEvent(payload);
        setAdminEvents((prev) => [res.data.event, ...prev]);
        toast.success('Event created!');
      }
      setShowEventForm(false);
    } catch { toast.error('Failed to save event'); }
    finally { setSavingEvent(false); }
  };
  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await adminApi.deleteAdminEvent(id);
      setAdminEvents((prev) => prev.filter((e) => e._id !== id));
      toast.success('Event deleted');
    } catch { toast.error('Failed'); }
  };

  // Broadcast
  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return toast.error('Message required');
    setBroadcasting(true);
    try {
      const res = await adminApi.broadcast({
        message: broadcastMsg,
        targetBranch: broadcastBranch !== 'All' ? broadcastBranch : undefined,
        targetRole: broadcastRole !== 'All' ? broadcastRole : undefined,
      });
      toast.success(`Sent to ${res.data.sentTo} users!`);
      setBroadcastMsg('');
    } catch { toast.error('Failed to send'); }
    finally { setBroadcasting(false); }
  };

  if (!user || user.role !== 'admin') return null;
  const stats = analytics?.stats;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield size={26} style={{ color: '#ef4444' }} /> Admin Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Platform management &amp; analytics</p>
        </div>
        <button onClick={fetchBaseData} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} id={`admin-tab-${t.id}`} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: tab === t.id ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'rgba(255,255,255,0.05)',
              color: tab === t.id ? 'white' : 'var(--text-secondary)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && tab === 'overview' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <div key={i} className="glass-card p-5 space-y-3"><div className="skeleton h-8 w-full" /><div className="skeleton h-4 w-1/2" /></div>)}
        </div>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#6366f1', sub: `${stats.totalStudents} students · ${stats.totalFaculty} faculty` },
                  { label: 'Resources', value: stats.totalResources, icon: BookOpen, color: '#06b6d4', sub: 'Approved & available' },
                  { label: 'Active Jobs', value: stats.totalJobs, icon: Briefcase, color: '#10b981', sub: 'Placement listings' },
                  { label: 'Pending Review', value: stats.pendingItems, icon: Clock, color: '#f59e0b', sub: 'Resources + Blogs' },
                ].map(({ label, value, icon: Icon, color, sub }) => (
                  <div key={label} className="stat-card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                        <p className="text-3xl font-bold" style={{ color }}>{value?.toLocaleString()}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                        <Icon size={20} style={{ color }} />
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
                  </div>
                ))}
              </div>
              {/* Branch distribution */}
              {analytics?.branchDistribution?.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart2 size={18} style={{ color: 'var(--color-primary)' }} /> Student Distribution by Branch
                  </h3>
                  <div className="space-y-3">
                    {analytics.branchDistribution.map(({ _id, count }: any) => {
                      const max = Math.max(...analytics.branchDistribution.map((b: any) => b.count));
                      const pct = Math.round((count / max) * 100);
                      return (
                        <div key={_id} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-12 text-right flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{_id}</span>
                          <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full rounded-lg flex items-center justify-end pr-2"
                              style={{ background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }}>
                              <span className="text-xs text-white font-bold">{count}</span>
                            </motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Registration trend */}
              {analytics?.registrationTrend?.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp size={18} style={{ color: '#10b981' }} /> Registration Trend (Last 6 Months)
                  </h3>
                  <div className="flex items-end gap-2 h-24">
                    {analytics.registrationTrend.map(({ _id, count }: any) => {
                      const max = Math.max(...analytics.registrationTrend.map((r: any) => r.count));
                      const pct = max > 0 ? (count / max) * 100 : 0;
                      return (
                        <div key={`${_id.year}-${_id.month}`} className="flex flex-col items-center gap-1 flex-1">
                          <span className="text-xs font-bold" style={{ color: '#6366f1' }}>{count}</span>
                          <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(pct, 5)}%`, background: 'linear-gradient(180deg, #6366f1, #06b6d4)', minHeight: 4 }} />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{MONTHS[_id.month]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Recent registrations */}
              {analytics?.recentUsers && (
                <div className="glass-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <UserCheck size={18} style={{ color: 'var(--color-success)' }} /> Recent Registrations
                  </h3>
                  <div className="space-y-3">
                    {analytics.recentUsers.map((u: any) => (
                      <div key={u._id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>{u.name[0]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.rollNumber} · {u.branch}</p>
                        </div>
                        <span className="badge badge-primary text-xs">{u.role}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── USERS ── */}
          {tab === 'users' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)' }}>
                  <Search size={14} style={{ color: 'var(--text-muted)' }} />
                  <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search name, email, roll..."
                    className="bg-transparent outline-none text-sm w-full" style={{ color: 'var(--text-primary)' }} />
                </div>
                <select value={userBranch} onChange={(e) => setUserBranch(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
                  <option value="" style={{ background: '#0f1629' }}>All Branches</option>
                  {['CSE','ECE','ME','CE','EEE','IT','AIDS','AIML','Other'].map((b) => <option key={b} value={b} style={{ background: '#0f1629' }}>{b}</option>)}
                </select>
                <select value={userRole} onChange={(e) => setUserRole(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
                  <option value="" style={{ background: '#0f1629' }}>All Roles</option>
                  {['student','faculty','placement_cell','admin'].map((r) => <option key={r} value={r} style={{ background: '#0f1629' }}>{r}</option>)}
                </select>
                <span className="text-xs self-center" style={{ color: 'var(--text-muted)' }}>{usersTotal} total</span>
              </div>
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        {['Name', 'Roll No', 'Branch', 'Role', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id} className="transition-colors hover:bg-white/3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>{u.name[0]}</div>
                              <div>
                                <p className="text-sm font-medium">{u.name}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{u.rollNumber}</td>
                          <td className="px-4 py-3 text-sm">{u.branch}</td>
                          <td className="px-4 py-3">
                            <select id={`role-select-${u._id}`} value={u.role} onChange={(e) => changeRole(u._id, e.target.value)}
                              className="text-xs px-2 py-1 rounded-lg outline-none"
                              style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--color-primary-light)', border: '1px solid rgba(99,102,241,0.2)' }}>
                              {['student','faculty','placement_cell','admin'].map((r) => <option key={r} value={r} style={{ background: '#0f1629' }}>{r}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Banned'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button id={`toggle-user-${u._id}`} onClick={() => toggleUserActive(u._id, u.isActive)}
                              className="text-xs px-3 py-1 rounded-lg transition-colors"
                              style={{ background: u.isActive ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: u.isActive ? '#f87171' : '#34d399' }}>
                              {u.isActive ? 'Ban' : 'Unban'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>No users found</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── CONTENT ── */}
          {tab === 'content' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle size={18} style={{ color: '#f59e0b' }} /> Pending Resources ({pendingResources.length})
                </h3>
                {pendingResources.length === 0 ? (
                  <div className="glass-card p-8 text-center"><CheckCircle size={32} className="mx-auto mb-2" style={{ color: 'var(--color-success)' }} /><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>All resources are approved!</p></div>
                ) : (
                  <div className="space-y-3">
                    {pendingResources.map((r) => (
                      <div key={r._id} className="glass-card p-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{r.title}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.subject} · {r.branch} · by {r.uploadedBy?.name || 'Unknown'}</p>
                        </div>
                        <span className="badge badge-warning">{r.type}</span>
                        <div className="flex gap-2">
                          <button id={`approve-res-${r._id}`} onClick={() => approveResource(r._id)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399' }}>
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button id={`reject-res-${r._id}`} onClick={() => deleteResource(r._id)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText size={18} style={{ color: 'var(--color-primary)' }} /> Pending Blogs ({pendingBlogs.length})
                </h3>
                {pendingBlogs.length === 0 ? (
                  <div className="glass-card p-8 text-center"><CheckCircle size={32} className="mx-auto mb-2" style={{ color: 'var(--color-success)' }} /><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No pending blogs!</p></div>
                ) : (
                  <div className="space-y-3">
                    {pendingBlogs.map((b) => (
                      <div key={b._id} className="glass-card p-4 flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{b.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>by {b.author?.name || 'Unknown'} · {b.author?.rollNumber}</p>
                        </div>
                        <button id={`approve-blog-${b._id}`} onClick={() => approveBlog(b._id)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399' }}>
                          <CheckCircle size={13} /> Publish
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── EVENTS ── */}
          {tab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2"><Calendar size={18} style={{ color: '#ec4899' }} /> Campus Events ({adminEvents.length})</h3>
                <button onClick={openCreateEvent} className="btn-primary flex items-center gap-2"><Plus size={15} /> Create Event</button>
              </div>
              {adminEvents.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-semibold mb-2">No events yet</p>
                  <button onClick={openCreateEvent} className="btn-primary mt-2">Create First Event</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {adminEvents.map((ev) => (
                    <div key={ev._id} className="glass-card p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold"
                        style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899' }}>
                        <span className="text-xs">{ev.date ? format(new Date(ev.date), 'MMM') : '?'}</span>
                        <span className="text-lg leading-none">{ev.date ? format(new Date(ev.date), 'dd') : '?'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{ev.title}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{ev.type} · {ev.venue || 'No venue'} · {ev.rsvps?.length || 0} RSVP</p>
                      </div>
                      <span className={`badge ${ev.isPublished ? 'badge-success' : 'badge-warning'}`}>{ev.isPublished ? 'Published' : 'Draft'}</span>
                      <div className="flex gap-2">
                        <button onClick={() => openEditEvent(ev)} className="p-2 rounded-xl transition-colors hover:bg-white/10" style={{ color: 'var(--color-primary-light)' }}><Edit2 size={14} /></button>
                        <button onClick={() => deleteEvent(ev._id)} className="p-2 rounded-xl transition-colors hover:bg-red-500/10" style={{ color: '#f87171' }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PLACEMENT ── */}
          {tab === 'placement' && (
            <div className="space-y-6">
              <h3 className="font-semibold flex items-center gap-2"><Briefcase size={18} style={{ color: '#10b981' }} /> Placement Report</h3>
              {!placementReport ? (
                <div className="glass-card p-8 text-center"><div className="skeleton h-4 w-1/2 mx-auto" /></div>
              ) : (
                <>
                  <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b font-semibold text-sm" style={{ borderColor: 'var(--border-glass)' }}>Branch-wise Student Distribution</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.03)' }}>
                            {['Branch', 'Year', 'Total Students'].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(placementReport.branchStats || []).map((row: any) => (
                            <tr key={`${row._id.branch}-${row._id.year}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td className="px-4 py-3 font-medium">{row._id.branch}</td>
                              <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>Year {row._id.year || '—'}</td>
                              <td className="px-4 py-3 font-bold" style={{ color: '#10b981' }}>{row.totalStudents}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {placementReport.activeJobs?.length > 0 && (
                    <div className="glass-card p-5">
                      <p className="font-semibold mb-3 text-sm flex items-center gap-2"><Activity size={15} style={{ color: '#6366f1' }} /> Active Placement Drives ({placementReport.activeJobs.length})</p>
                      <div className="space-y-2">
                        {placementReport.activeJobs.map((j: any) => (
                          <div key={j._id} className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>{j.company?.[0]}</div>
                            <div className="flex-1">
                              <p className="font-medium">{j.title}</p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{j.company} {j.salary && `· ₹${j.salary}`}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── AUDIT LOG ── */}
          {tab === 'audit' && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><ClipboardList size={18} style={{ color: '#8b5cf6' }} /> Admin Audit Log</h3>
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.03)' }}>
                        {['Admin', 'Action', 'Details', 'Time'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>No audit logs yet</td></tr>
                      ) : auditLogs.map((log) => (
                        <tr key={log._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ background: 'linear-gradient(135deg, #ef4444, #8b5cf6)' }}>{log.adminName?.[0] || 'A'}</div>
                              <span className="text-xs">{log.adminName || 'Admin'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 rounded-lg font-mono" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>{log.action}</span>
                          </td>
                          <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: 'var(--text-muted)' }}>{log.details || '—'}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {log.createdAt ? format(new Date(log.createdAt), 'dd MMM, HH:mm') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── BROADCAST ── */}
          {tab === 'broadcast' && (
            <div className="max-w-2xl space-y-6">
              <h3 className="font-semibold flex items-center gap-2"><Megaphone size={18} style={{ color: '#f59e0b' }} /> Broadcast Message</h3>
              <div className="glass-card p-6 space-y-4">
                <div>
                  <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Message *</label>
                  <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} rows={4}
                    placeholder="Enter your message to students..."
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Target Branch</label>
                    <select value={broadcastBranch} onChange={(e) => setBroadcastBranch(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
                      <option value="All" style={{ background: '#0f1629' }}>All Branches</option>
                      {['CSE','ECE','ME','CE','EEE','IT','AIDS','AIML','Other'].map((b) => <option key={b} value={b} style={{ background: '#0f1629' }}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Target Role</label>
                    <select value={broadcastRole} onChange={(e) => setBroadcastRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
                      {['All','student','faculty','placement_cell'].map((r) => <option key={r} value={r} style={{ background: '#0f1629' }}>{r === 'All' ? 'All Roles' : r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    📢 Message will appear as a notification for targeted users
                  </p>
                  <button onClick={sendBroadcast} disabled={broadcasting || !broadcastMsg.trim()}
                    className="btn-primary flex items-center gap-2">
                    <Send size={15} /> {broadcasting ? 'Sending...' : 'Send Broadcast'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Event Form Modal */}
      <AnimatePresence>
        {showEventForm && (
          <>
            <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEventForm(false)} />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="glass-card p-6 w-full max-w-lg relative my-8" style={{ background: 'rgba(15,22,45,0.98)' }}
                onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowEventForm(false)} className="absolute top-4 right-4" style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
                <h2 className="text-lg font-bold mb-5">{editEvent ? 'Edit Event' : 'Create Event'}</h2>
                <div className="space-y-3">
                  <input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder="Event Title *" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  <textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    placeholder="Description" rows={3} className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Type</label>
                      <select value={eventForm.type} onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none capitalize"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
                        {EVENT_TYPES.map((t) => <option key={t} value={t} style={{ background: '#0f1629' }}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Venue</label>
                      <input value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                        placeholder="Venue" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Start Date *</label>
                      <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>End Date</label>
                      <input type="date" value={eventForm.endDate} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                  <input value={eventForm.registrationLink} onChange={(e) => setEventForm({ ...eventForm, registrationLink: e.target.value })}
                    placeholder="Registration Link" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  <input value={eventForm.tags} onChange={(e) => setEventForm({ ...eventForm, tags: e.target.value })}
                    placeholder="Tags (comma separated)" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={eventForm.isPublished} onChange={(e) => setEventForm({ ...eventForm, isPublished: e.target.checked })} />
                      <span style={{ color: 'var(--text-secondary)' }}>Published</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={eventForm.isFeatured} onChange={(e) => setEventForm({ ...eventForm, isFeatured: e.target.checked })} />
                      <span style={{ color: 'var(--text-secondary)' }}>Featured</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowEventForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={saveEvent} disabled={savingEvent} className="btn-primary flex-1">
                    {savingEvent ? 'Saving...' : editEvent ? 'Update' : 'Create'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
