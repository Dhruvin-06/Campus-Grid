'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { studyGroupsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Users, Search, X, LogOut, Trash2, ExternalLink, BookOpen } from 'lucide-react';

const BRANCHES = ['All', 'CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'AIDS', 'AIML', 'Other'];
const COVER_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface Group {
  _id: string; name: string; description: string; subject: string;
  branch: string; year: number; members: any[]; admin: any;
  maxMembers: number; isPublic: boolean; coverColor: string; meetingLink: string; tags: string[];
}

const emptyForm = { name: '', subject: '', description: '', branch: 'All', year: 0, maxMembers: 20, isPublic: true, coverColor: '#6366f1', meetingLink: '', tags: '' };

export default function StudyGroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchGroups(); }, [branchFilter, search]);
  useEffect(() => { fetchMine(); }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await studyGroupsApi.getAll({ branch: branchFilter !== 'All' ? branchFilter : undefined, q: search || undefined });
      setGroups(res.data.groups || []);
    } catch { toast.error('Failed to load groups'); }
    finally { setLoading(false); }
  };

  const fetchMine = async () => {
    try {
      const res = await studyGroupsApi.getMine();
      setMyGroups(res.data.groups || []);
    } catch {}
  };

  const createGroup = async () => {
    if (!form.name.trim() || !form.subject.trim()) return toast.error('Name and subject required');
    setCreating(true);
    try {
      await studyGroupsApi.create({ ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) });
      toast.success('Group created!');
      setShowCreate(false);
      setForm(emptyForm);
      fetchGroups(); fetchMine();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const joinGroup = async (id: string) => {
    try {
      await studyGroupsApi.join(id);
      toast.success('Joined group!');
      fetchGroups(); fetchMine();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
  };

  const leaveGroup = async (id: string) => {
    try {
      await studyGroupsApi.leave(id);
      toast.success('Left group');
      fetchGroups(); fetchMine();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm('Delete this group?')) return;
    try {
      await studyGroupsApi.delete(id);
      toast.success('Group deleted');
      fetchGroups(); fetchMine();
    } catch { toast.error('Failed'); }
  };

  const isMember = (g: Group) => g.members?.some((m: any) => (m._id || m) === user?._id || String(m._id || m) === String(user?._id));
  const isAdmin = (g: Group) => String(g.admin?._id || g.admin) === String(user?._id);

  const displayGroups = tab === 'mine' ? myGroups : groups;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users size={26} style={{ color: '#8b5cf6' }} /> Study Groups
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Collaborate with peers on subjects</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create Group
        </button>
      </div>

      {/* Tabs + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {['browse', 'mine'].map((t) => (
            <button key={t} onClick={() => setTab(t as any)}
              className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
              style={{
                background: tab === t ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.05)',
                color: tab === t ? 'white' : 'var(--text-secondary)',
              }}>{t === 'browse' ? '🔍 Browse All' : `📚 My Groups (${myGroups.length})`}</button>
          ))}
        </div>
        {tab === 'browse' && (
          <div className="flex gap-2 flex-1">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)' }}>
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups..."
                className="bg-transparent outline-none text-sm w-full" style={{ color: 'var(--text-primary)' }} />
            </div>
            <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
              {BRANCHES.map((b) => <option key={b} value={b} style={{ background: '#0f1629' }}>{b}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-52 rounded-xl" />)}
        </div>
      ) : displayGroups.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold mb-2">{tab === 'mine' ? "You haven't joined any groups" : 'No groups found'}</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-2">Create First Group</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayGroups.map((group, i) => {
            const member = isMember(group);
            const admin = isAdmin(group);
            return (
              <motion.div key={group._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card overflow-hidden">
                {/* Color bar */}
                <div className="h-2" style={{ background: group.coverColor }} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-sm">{group.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: group.coverColor }}>{group.subject}</p>
                    </div>
                    <div className="flex gap-1">
                      {member && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>✓ Joined</span>}
                      {admin && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>Admin</span>}
                    </div>
                  </div>
                  {group.description && (
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{group.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Users size={11} /> {group.members?.length || 0}/{group.maxMembers || '∞'}</span>
                    <span>{group.branch} {group.year ? `· Year ${group.year}` : ''}</span>
                  </div>
                  {group.tags?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {group.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>#{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {group.meetingLink && (
                      <a href={group.meetingLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl transition-all"
                        style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
                        <ExternalLink size={11} /> Meet
                      </a>
                    )}
                    {!member ? (
                      <button onClick={() => joinGroup(group._id)}
                        className="btn-primary text-xs px-3 py-1.5 flex-1">Join</button>
                    ) : admin ? (
                      <button onClick={() => deleteGroup(group._id)}
                        className="text-xs px-3 py-1.5 rounded-xl flex-1 flex items-center justify-center gap-1"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                        <Trash2 size={11} /> Delete
                      </button>
                    ) : (
                      <button onClick={() => leaveGroup(group._id)}
                        className="text-xs px-3 py-1.5 rounded-xl flex-1 flex items-center justify-center gap-1"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                        <LogOut size={11} /> Leave
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)} />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="glass-card p-6 w-full max-w-md relative my-8" style={{ background: 'rgba(15,22,45,0.98)' }}
                onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4" style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
                <h2 className="text-lg font-bold mb-5">Create Study Group</h2>
                <div className="space-y-3">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Group Name *" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Subject *" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Description" rows={2} className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}
                      className="px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
                      {BRANCHES.map((b) => <option key={b} value={b} style={{ background: '#0f1629' }}>{b}</option>)}
                    </select>
                    <select value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                      className="px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
                      <option value={0} style={{ background: '#0f1629' }}>All Years</option>
                      {[1, 2, 3, 4].map((y) => <option key={y} value={y} style={{ background: '#0f1629' }}>Year {y}</option>)}
                    </select>
                  </div>
                  <input value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                    placeholder="Meeting Link (Google Meet / Zoom)" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="Tags (comma separated)" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>Cover Color</label>
                    <div className="flex gap-2">
                      {COVER_COLORS.map((c) => (
                        <button key={c} onClick={() => setForm({ ...form, coverColor: c })}
                          className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                          style={{ background: c, outline: form.coverColor === c ? '2px solid white' : 'none', outlineOffset: '2px' }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={createGroup} disabled={creating} className="btn-primary flex-1">
                    {creating ? 'Creating...' : 'Create'}
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
