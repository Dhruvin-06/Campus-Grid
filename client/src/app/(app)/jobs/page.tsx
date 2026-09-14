'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { jobsApi } from '@/lib/api';
import { Job } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Briefcase, Search, Bookmark, BookmarkCheck, Calendar,
  MapPin, DollarSign, ExternalLink, Plus, X, Building2, Filter,
} from 'lucide-react';

const JOB_TYPES = [
  { value: '', label: 'All Types', color: '' },
  { value: 'placement', label: '🎯 Placement', color: '#6366f1' },
  { value: 'internship', label: '💼 Internship', color: '#06b6d4' },
  { value: 'hackathon', label: '⚡ Hackathon', color: '#10b981' },
  { value: 'competition', label: '🏆 Competition', color: '#f59e0b' },
  { value: 'scholarship', label: '🎓 Scholarship', color: '#8b5cf6' },
];

const typeColors: Record<string, string> = {
  placement: 'badge-primary', internship: 'badge-accent',
  hackathon: 'badge-success', competition: 'badge-warning', scholarship: 'badge-danger',
};

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({
    title: '', company: '', type: 'placement', description: '',
    package: '', stipend: '', location: '', deadline: '', applyLink: '',
  });
  const [creating, setCreating] = useState(false);

  const canPost = user?.role === 'admin' || user?.role === 'placement_cell';

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const res = await jobsApi.getAll(params);
      setJobs(res.data.jobs || []);
      setTotal(res.data.total || 0);

      // Fetch bookmarks
      const bkRes = await jobsApi.getBookmarks();
      const bkIds = new Set<string>((bkRes.data.jobs || []).map((j: Job) => j._id));
      setBookmarked(bkIds);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(fetchJobs, 300);
    return () => clearTimeout(t);
  }, [search, typeFilter]);

  const toggleBookmark = async (id: string) => {
    try {
      const res = await jobsApi.bookmark(id);
      setBookmarked((prev) => {
        const next = new Set(prev);
        if (res.data.bookmarked) next.add(id); else next.delete(id);
        return next;
      });
      toast.success(res.data.bookmarked ? 'Bookmarked!' : 'Removed from bookmarks');
    } catch { toast.error('Failed'); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await jobsApi.create(form);
      toast.success('Job posted successfully!');
      setShowCreate(false);
      fetchJobs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post job');
    } finally { setCreating(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase size={26} style={{ color: 'var(--color-accent)' }} />
            Career Opportunities
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {total} verified listings · Placements, Internships & Hackathons
          </p>
        </div>
        {canPost && (
          <button id="post-job-btn" onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Post Job
          </button>
        )}
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2">
        {JOB_TYPES.map((t) => (
          <button
            key={t.value}
            id={`job-type-${t.value || 'all'}`}
            onClick={() => setTypeFilter(t.value)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: typeFilter === t.value ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'rgba(255,255,255,0.05)',
              color: typeFilter === t.value ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${typeFilter === t.value ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {t.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input id="job-search" type="text" placeholder="Search companies, roles..." className="input-field pl-9 py-1.5 text-sm w-52"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="skeleton w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-semibold">No jobs found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {canPost ? 'Be the first to post a listing!' : 'Check back later for opportunities.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job, i) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card p-5 flex flex-col gap-3"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 text-base"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                  {job.company?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm line-clamp-1">{job.title}</h3>
                  <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    <Building2 size={12} /> {job.company}
                  </p>
                </div>
                <button id={`bookmark-${job._id}`} onClick={() => toggleBookmark(job._id)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  {bookmarked.has(job._id)
                    ? <BookmarkCheck size={17} style={{ color: 'var(--color-primary)' }} />
                    : <Bookmark size={17} style={{ color: 'var(--text-muted)' }} />}
                </button>
              </div>

              <span className={`badge w-fit ${typeColors[job.type] || 'badge-primary'}`}>{job.type}</span>

              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{job.description}</p>

              {/* Details */}
              <div className="space-y-1">
                {(job.package || job.stipend) && (
                  <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <DollarSign size={12} /> {job.package || job.stipend}
                  </p>
                )}
                {job.location && (
                  <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <MapPin size={12} /> {job.location}
                  </p>
                )}
                {job.deadline && (
                  <p className="text-xs flex items-center gap-1.5" style={{ color: new Date(job.deadline) < new Date() ? '#f87171' : 'var(--text-secondary)' }}>
                    <Calendar size={12} /> Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Apply button */}
              {job.applyLink && (
                <a id={`apply-${job._id}`} href={job.applyLink} target="_blank" rel="noopener noreferrer"
                  className="btn-primary text-xs py-2 flex items-center justify-center gap-1.5 mt-auto">
                  Apply Now <ExternalLink size={13} />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Job Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Post New Listing</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Job Title *</label>
                  <input id="job-title" type="text" required className="input-field text-sm" placeholder="Software Engineer"
                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Company *</label>
                  <input id="job-company" type="text" required className="input-field text-sm" placeholder="Google"
                    value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
                <select id="job-type" className="input-field text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {JOB_TYPES.slice(1).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description *</label>
                <textarea id="job-description" required rows={3} className="input-field text-sm resize-none" placeholder="Job description, requirements..."
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Package/Stipend</label>
                  <input id="job-package" type="text" className="input-field text-sm" placeholder="6 LPA / ₹15,000/mo"
                    value={form.package} onChange={(e) => setForm({ ...form, package: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Location</label>
                  <input id="job-location" type="text" className="input-field text-sm" placeholder="Bangalore / Remote"
                    value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Deadline</label>
                  <input id="job-deadline" type="date" className="input-field text-sm"
                    value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Apply Link</label>
                  <input id="job-applylink" type="url" className="input-field text-sm" placeholder="https://..."
                    value={form.applyLink} onChange={(e) => setForm({ ...form, applyLink: e.target.value })} />
                </div>
              </div>
              <button id="job-submit" type="submit" disabled={creating} className="btn-primary w-full flex items-center justify-center gap-2">
                {creating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Post Listing'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
