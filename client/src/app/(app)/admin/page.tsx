'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminApi, usersApi, resourcesApi, contentApi, opportunitiesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Shield, Users, BookOpen, FileText, BarChart2,
  CheckCircle, XCircle, TrendingUp, Megaphone,
  Search, Trash2, Send, Bell, Briefcase,
  AlertCircle, RefreshCw,
} from 'lucide-react';

const TABS = [
  { id: 'overview',     label: '📊 Overview'       },
  { id: 'resources',    label: '📚 Resources'       },
  { id: 'feed',         label: '📋 Campus Feed'     },
  { id: 'opportunities',label: '💼 Opportunities'   },
  { id: 'users',        label: '👥 Users'           },
  { id: 'audit',        label: '🔑 Audit Log'       },
  { id: 'broadcast',    label: '📢 Broadcast'       },
] as const;

type Tab = typeof TABS[number]['id'];

const BRANCHES = ['All', 'CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'AIDS', 'AIML', 'Other'];
const ROLES    = ['All', 'student', 'faculty', 'placement', 'admin'];

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userBranch, setUserBranch] = useState('');
  const [userRole, setUserRole] = useState('');
  const [usersTotal, setUsersTotal] = useState(0);
  const [pendingResources, setPendingResources] = useState<any[]>([]);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [pendingOpportunities, setPendingOpportunities] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (tab === 'audit') fetchAuditLog();
    if (tab === 'resources') fetchPendingResources();
    if (tab === 'feed') fetchPendingPosts();
    if (tab === 'opportunities') fetchPendingOpportunities();
  }, [tab, userSearch, userBranch, userRole]);

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, pendingResRes, pendingPostsRes, pendingOppRes] = await Promise.all([
        adminApi.getAnalytics(),
        resourcesApi.getPending(),
        contentApi.getPendingPosts(),
        opportunitiesApi.getAllAdmin({ verified: 'false' }),
      ]);
      setAnalytics(analyticsRes.data);
      setPendingResources(pendingResRes.data.resources || []);
      setPendingPosts(pendingPostsRes.data.posts || []);
      setPendingOpportunities(pendingOppRes.data.opportunities || []);
    } catch { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  const fetchPendingResources = async () => {
    try {
      const res = await resourcesApi.getPending();
      setPendingResources(res.data.resources || []);
    } catch { toast.error('Failed to load pending resources'); }
  };

  const fetchPendingPosts = async () => {
    try {
      const res = await contentApi.getPendingPosts();
      setPendingPosts(res.data.posts || []);
    } catch { toast.error('Failed to load pending posts'); }
  };

  const fetchPendingOpportunities = async () => {
    try {
      const res = await opportunitiesApi.getAllAdmin({ verified: 'false' });
      setPendingOpportunities(res.data.opportunities || []);
    } catch { toast.error('Failed to load opportunities'); }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminApi.getUsers({
        search: userSearch || undefined,
        branch: userBranch || undefined,
        role: userRole || undefined,
        limit: 25,
      });
      setUsers(res.data.users || []);
      setUsersTotal(res.data.total || 0);
    } catch { toast.error('Failed to load users'); }
  }, [userSearch, userBranch, userRole]);

  const fetchAuditLog = async () => {
    try {
      const res = await adminApi.getAuditLog();
      setAuditLogs(res.data.logs || []);
    } catch { toast.error('Failed to load audit log'); }
  };

  // ─── Actions ────────────────────────────────────────────────────────────────

  const reviewResource = async (id: string, action: 'approve' | 'reject') => {
    try {
      await adminApi.reviewResource(id, action);
      setPendingResources((p) => p.filter((r) => r._id !== id));
      toast.success(action === 'approve' ? 'Resource approved ✅' : 'Resource rejected');
    } catch { toast.error('Failed'); }
  };

  const reviewPost = async (id: string, action: 'approve' | 'reject') => {
    try {
      await contentApi.approvePost(id, action);
      setPendingPosts((p) => p.filter((b) => b._id !== id));
      toast.success(action === 'approve' ? 'Post published ✅' : 'Post rejected');
    } catch { toast.error('Failed'); }
  };

  const verifyOpportunity = async (id: string, action: 'verify' | 'reject') => {
    try {
      await opportunitiesApi.verify(id, action);
      setPendingOpportunities((p) => p.filter((o) => o._id !== id));
      toast.success(action === 'verify' ? 'Opportunity verified & published ✅' : 'Opportunity rejected');
    } catch { toast.error('Failed'); }
  };

  const changeRole = async (id: string, role: string) => {
    try {
      await adminApi.updateUser(id, { role });
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role } : u));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await adminApi.updateUser(id, { isActive: !isActive });
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: !isActive } : u));
      toast.success(isActive ? 'User deactivated' : 'User activated');
    } catch { toast.error('Failed'); }
  };

  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setBroadcasting(true);
    try {
      const res = await adminApi.broadcast({
        message: broadcastMsg,
        targetBranch: broadcastBranch !== 'All' ? broadcastBranch : undefined,
        targetRole: broadcastRole !== 'All' ? broadcastRole : undefined,
      });
      toast.success(`Sent to ${res.data.sentTo} users`);
      setBroadcastMsg('');
    } catch { toast.error('Broadcast failed'); }
    finally { setBroadcasting(false); }
  };

  const s = analytics?.stats;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw size={28} className="animate-spin mx-auto mb-3" style={{ color: '#6366f1' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading admin console…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/15 border border-red-500/30">
          <Shield size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Admin Console</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Operations console & moderation management.</p>
        </div>
        {s && (s.pendingResources + s.pendingPosts + s.pendingOpportunities) > 0 && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle size={14} />
            {s.pendingResources + s.pendingPosts + s.pendingOpportunities} items need review
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'text-white' : ''}`}
            style={{
              background: tab === t.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${tab === t.id ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
              color: tab === t.id ? '#a5b4fc' : 'var(--text-muted)',
            }}>
            {t.label}
            {t.id === 'resources' && pendingResources.length > 0 && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">{pendingResources.length}</span>}
            {t.id === 'feed' && pendingPosts.length > 0 && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">{pendingPosts.length}</span>}
            {t.id === 'opportunities' && pendingOpportunities.length > 0 && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">{pendingOpportunities.length}</span>}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                label: 'Students',
                value: s?.totalStudents,
                color: '#6366f1',
                icon: Users,
                onClick: () => { setUserRole('student'); setTab('users'); },
              },
              {
                label: 'Faculty',
                value: s?.totalFaculty,
                color: '#10b981',
                icon: Users,
                onClick: () => { setUserRole('faculty'); setTab('users'); },
              },
              {
                label: 'Placement Cell',
                value: s?.totalPlacement,
                color: '#f59e0b',
                icon: Briefcase,
                onClick: () => { setUserRole('placement'); setTab('users'); },
              },
              {
                label: 'Resources',
                value: s?.totalResources,
                color: '#3b82f6',
                icon: BookOpen,
                onClick: () => { setTab('resources'); },
              },
              {
                label: 'Lost & Found',
                value: s?.totalLostFound,
                color: '#ec4899',
                icon: FileText,
                onClick: () => { router.push('/lostfound'); },
              },
            ].map(({ label, value, color, icon: Icon, onClick }) => (
              <div
                key={label}
                onClick={onClick}
                className="card-glass rounded-xl p-4 cursor-pointer transition-all hover:scale-105 hover:-translate-y-1 group"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={14} style={{ color }} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  </div>
                  <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }}>View →</span>
                </div>
                <p className="text-2xl font-bold" style={{ color }}>{value ?? '—'}</p>
              </div>
            ))}
          </div>

          {/* Branch distribution */}
          {analytics?.branchDistribution?.length > 0 && (
            <div className="card-glass rounded-2xl p-5" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart2 size={16} style={{ color: '#6366f1' }} /> Branch Distribution
              </h3>
              <div className="space-y-2">
                {analytics.branchDistribution.map((b: any) => {
                  const pct = s?.totalStudents ? Math.round((b.count / s.totalStudents) * 100) : 0;
                  return (
                    <div key={b._id} className="flex items-center gap-3">
                      <span className="text-sm w-16 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{b._id}</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--gradient-primary)' }} />
                      </div>
                      <span className="text-xs w-16 text-right" style={{ color: 'var(--text-muted)' }}>{b.count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resources */}
      {tab === 'resources' && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Pending Resource Approvals ({pendingResources.length})</h2>
          {pendingResources.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle size={32} className="mx-auto mb-3" style={{ color: '#10b981' }} />
              <p style={{ color: 'var(--text-muted)' }}>No pending resources — all clear!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingResources.map((r) => (
                <div key={r._id} className="card-glass rounded-xl p-4 flex items-start gap-4"
                  style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <BookOpen size={16} style={{ color: '#6366f1' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{r.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {r.subject} · {r.branch} · Uploaded by {r.uploadedBy?.name}
                    </p>
                    {r.description && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{r.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-2 py-1 rounded-lg transition-all hover:bg-white/10"
                      style={{ color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' }}>
                      Preview
                    </a>
                    <button onClick={() => reviewResource(r._id, 'approve')}
                      className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg transition-all hover:bg-emerald-500/20"
                      style={{ color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <CheckCircle size={12} /> Approve
                    </button>
                    <button onClick={() => reviewResource(r._id, 'reject')}
                      className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg transition-all hover:bg-red-500/20"
                      style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Campus Feed */}
      {tab === 'feed' && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Pending Campus Feed Posts ({pendingPosts.length})</h2>
          {pendingPosts.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle size={32} className="mx-auto mb-3" style={{ color: '#10b981' }} />
              <p style={{ color: 'var(--text-muted)' }}>No pending posts — all clear!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPosts.map((p) => (
                <div key={p._id} className="card-glass rounded-xl p-4 flex items-start gap-4"
                  style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{p.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      By {p.author?.name} ({p.author?.rollNumber}) · {p.category}
                    </p>
                    <p className="text-xs mt-1 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{p.content}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => reviewPost(p._id, 'approve')}
                      className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg transition-all hover:bg-emerald-500/20"
                      style={{ color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <CheckCircle size={12} /> Publish
                    </button>
                    <button onClick={() => reviewPost(p._id, 'reject')}
                      className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg transition-all hover:bg-red-500/20"
                      style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Opportunities */}
      {tab === 'opportunities' && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Pending Opportunity Verification ({pendingOpportunities.length})</h2>
          {pendingOpportunities.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle size={32} className="mx-auto mb-3" style={{ color: '#10b981' }} />
              <p style={{ color: 'var(--text-muted)' }}>No unverified opportunities!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOpportunities.map((o) => (
                <div key={o._id} className="card-glass rounded-xl p-4 flex items-start gap-4"
                  style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(245,158,11,0.15)' }}>
                    <Briefcase size={16} style={{ color: '#f59e0b' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{o.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {o.company} · {o.type} · Posted by {o.postedBy?.name}
                    </p>
                    {o.applicationLink && (
                      <a href={o.applicationLink} target="_blank" rel="noopener noreferrer"
                        className="text-xs mt-1" style={{ color: '#6366f1' }}>
                        {o.applicationLink.substring(0, 60)}…
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => verifyOpportunity(o._id, 'verify')}
                      className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg transition-all hover:bg-emerald-500/20"
                      style={{ color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <CheckCircle size={12} /> Verify & Publish
                    </button>
                    <button onClick={() => verifyOpportunity(o._id, 'reject')}
                      className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg transition-all hover:bg-red-500/20"
                      style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search name, email, roll…"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-transparent outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }} />
            </div>
            <select value={userBranch} onChange={(e) => setUserBranch(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}>
              {BRANCHES.map((b) => <option key={b} value={b === 'All' ? '' : b}>{b}</option>)}
            </select>
            <select value={userRole} onChange={(e) => setUserRole(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}>
              {ROLES.map((r) => <option key={r} value={r === 'All' ? '' : r} className="capitalize">{r}</option>)}
            </select>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{usersTotal} users found</p>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u._id} className="card-glass rounded-xl p-3 flex items-center gap-3"
                style={{ border: '1px solid rgba(255,255,255,0.06)', opacity: u.isActive ? 1 : 0.6 }}>
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-white flex-shrink-0"
                  style={{ background: 'var(--gradient-primary)' }}>
                  {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{u.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.rollNumber} · {u.branch}</p>
                </div>
                <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg outline-none capitalize"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}>
                  {['student', 'faculty', 'placement', 'admin'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <button onClick={() => toggleActive(u._id, u.isActive)}
                  className={`text-xs px-2 py-1 rounded-lg transition-all ${u.isActive ? 'text-emerald-400' : 'text-red-400'}`}
                  style={{ border: `1px solid ${u.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Log */}
      {tab === 'audit' && (
        <div className="space-y-3">
          <h2 className="font-semibold">Recent Admin Actions</h2>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No audit logs yet</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log._id} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-white flex-shrink-0"
                  style={{ background: 'var(--gradient-primary)' }}>
                  {log.adminId?.avatar ? <img src={log.adminId.avatar} className="w-full h-full object-cover" /> : log.adminName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm"><span className="font-semibold">{log.adminName}</span> · <span className="font-mono text-xs" style={{ color: '#6366f1' }}>{log.action}</span></p>
                  {log.details && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{log.details}</p>}
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Broadcast */}
      {tab === 'broadcast' && (
        <div className="max-w-2xl space-y-4">
          <h2 className="font-semibold text-lg">Send Notification Broadcast</h2>
          <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)}
            placeholder="Type your message here…"
            rows={4}
            className="w-full px-4 py-3 rounded-xl text-sm resize-none bg-transparent outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }} />
          <div className="flex gap-3">
            <select value={broadcastBranch} onChange={(e) => setBroadcastBranch(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}>
              {BRANCHES.map((b) => <option key={b}>{b}</option>)}
            </select>
            <select value={broadcastRole} onChange={(e) => setBroadcastRole(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={sendBroadcast} disabled={!broadcastMsg.trim() || broadcasting}
            className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl"
            style={{ opacity: !broadcastMsg.trim() || broadcasting ? 0.6 : 1 }}>
            <Send size={16} />
            {broadcasting ? 'Sending…' : 'Send Broadcast'}
          </button>
        </div>
      )}
    </div>
  );
}
