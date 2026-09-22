'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { opportunitiesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Briefcase, MapPin, Calendar, ExternalLink, Bookmark, BookmarkCheck,
  Search, Filter, Clock, Building2, Zap, Award, GraduationCap, ChevronDown,
  X, CheckCircle2, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TYPES = ['all', 'placement', 'internship', 'hackathon'] as const;

const typeConfig = {
  placement:  { label: 'Placement',  color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  icon: Briefcase },
  internship: { label: 'Internship', color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: Award },
  hackathon:  { label: 'Hackathon',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: Zap },
};

function OpportunityCard({ opp, onSave }: { opp: any; onSave: (id: string) => void }) {
  const tc = typeConfig[opp.type as keyof typeof typeConfig];
  const Icon = tc?.icon || Briefcase;
  const isExpired = opp.deadline && new Date(opp.deadline) < new Date();

  const daysLeft = opp.deadline
    ? Math.max(0, Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="card-glass rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Verified badge */}
      {opp.isVerified && (
        <span className="absolute top-4 right-14 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
          <CheckCircle2 size={11} /> Verified
        </span>
      )}

      {/* Save button */}
      <button
        onClick={() => onSave(opp._id)}
        className="absolute top-4 right-4 p-1.5 rounded-lg transition-all hover:bg-white/10"
        title={opp.isSaved ? 'Unsave' : 'Save'}
      >
        {opp.isSaved
          ? <BookmarkCheck size={16} style={{ color: '#6366f1' }} />
          : <Bookmark size={16} style={{ color: 'var(--text-muted)' }} />}
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 pr-12">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: tc?.bg || 'rgba(99,102,241,0.12)' }}>
          <Icon size={20} style={{ color: tc?.color || '#6366f1' }} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-base leading-snug line-clamp-2">{opp.title}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{opp.company}</span>
          </div>
        </div>
      </div>

      {/* Type badge */}
      <span className="self-start text-xs font-semibold px-3 py-1 rounded-full"
        style={{ background: tc?.bg, color: tc?.color }}>
        {tc?.label || opp.type}
      </span>

      {/* Description */}
      <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
        {opp.description}
      </p>

      {/* Skills */}
      {opp.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {opp.skills.slice(0, 4).map((skill: string) => (
            <span key={skill} className="text-xs px-2 py-0.5 rounded-md font-medium"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc' }}>
              {skill}
            </span>
          ))}
          {opp.skills.length > 4 && (
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ color: 'var(--text-muted)' }}>
              +{opp.skills.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        {opp.location && (
          <span className="flex items-center gap-1"><MapPin size={11} />{opp.location}</span>
        )}
        {opp.packageOrStipend && (
          <span className="flex items-center gap-1"><Star size={11} />{opp.packageOrStipend}</span>
        )}
        {opp.deadline && (
          <span className={`flex items-center gap-1 font-medium ${isExpired ? 'text-red-400' : daysLeft && daysLeft <= 7 ? 'text-amber-400' : ''}`}>
            <Clock size={11} />
            {isExpired ? 'Expired' : daysLeft === 0 ? 'Closes today' : `${daysLeft}d left`}
          </span>
        )}
      </div>

      {/* Eligibility */}
      {opp.branch?.length > 0 && !opp.branch.includes('All') && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <GraduationCap size={11} />
          <span>{opp.branch.join(', ')}</span>
          {opp.minCGPA > 0 && <span>· CGPA ≥ {opp.minCGPA}</span>}
        </div>
      )}

      {/* Apply button */}
      {opp.applicationLink && (
        <a
          href={opp.applicationLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex items-center justify-center gap-2 mt-auto text-sm py-2.5 rounded-xl"
          onClick={(e) => isExpired && e.preventDefault()}
          style={isExpired ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          <ExternalLink size={14} />
          {isExpired ? 'Deadline Passed' : 'Apply Now'}
        </a>
      )}
    </motion.div>
  );
}

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await opportunitiesApi.getAll({
        type: activeType === 'all' ? undefined : activeType,
        search: search || undefined,
        saved: savedOnly ? 'true' : undefined,
        limit: 24,
      });
      setOpportunities(res.data.opportunities || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  }, [activeType, search, savedOnly]);

  useEffect(() => {
    const timeout = setTimeout(fetchOpportunities, 300);
    return () => clearTimeout(timeout);
  }, [fetchOpportunities]);

  const handleSave = async (id: string) => {
    try {
      const res = await opportunitiesApi.save(id);
      setOpportunities((prev) =>
        prev.map((o) => o._id === id ? { ...o, isSaved: res.data.saved } : o)
      );
      toast.success(res.data.saved ? 'Saved!' : 'Unsaved');
    } catch {
      toast.error('Failed to save');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: '', company: '', type: 'placement', description: '', location: 'On-Campus', packageOrStipend: '', applicationLink: '', skills: '', branch: 'CSE,ECE,IT', minCGPA: '0',
  });
  const [submitting, setSubmitting] = useState(false);

  const canCreate = user?.role === 'placement' || user?.role === 'admin';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await opportunitiesApi.create(form);
      toast.success(user?.role === 'admin' ? 'Opportunity posted & verified!' : 'Opportunity submitted for verification!');
      setShowCreateModal(false);
      setForm({ title: '', company: '', type: 'placement', description: '', location: 'On-Campus', packageOrStipend: '', applicationLink: '', skills: '', branch: 'CSE,ECE,IT', minCGPA: '0' });
      fetchOpportunities();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post opportunity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Briefcase size={28} className="text-amber-400" />
            Career Opportunities
          </h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">
            Verified opportunities curated for your campus.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white self-start sm:self-auto"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            + Post Opportunity
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by title, company, skills…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-transparent outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-primary)',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>

        {/* Saved toggle */}
        <button
          onClick={() => setSavedOnly(!savedOnly)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${savedOnly ? 'bg-indigo-600 text-white' : ''}`}
          style={!savedOnly ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)' } : {}}>
          <Bookmark size={14} />
          Saved
        </button>
      </div>

      {/* Modal for Placement/Admin creation */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="saas-card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Post Placement Drive / Opportunity</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Title</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Software Engineer Intern / SDE-1" className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Company</label>
                  <input required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Google / Microsoft / TCS" className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none">
                    <option value="placement">Placement</option>
                    <option value="internship">Internship</option>
                    <option value="hackathon">Hackathon</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Job details, eligibility, role expectations..." className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Stipend / Package</label>
                  <input value={form.packageOrStipend} onChange={e => setForm({ ...form, packageOrStipend: e.target.value })} placeholder="12 LPA / ₹40k/mo" className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Location</label>
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="On-Campus / Remote / Bangalore" className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Application Link</label>
                <input value={form.applicationLink} onChange={e => setForm({ ...form, applicationLink: e.target.value })} placeholder="https://careers.company.com/job/123" className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold">{submitting ? 'Posting...' : 'Post Opportunity'}</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Type tabs */}
      <div className="flex gap-2 flex-wrap">
        {TYPES.map((type) => {
          const tc = type === 'all' ? null : typeConfig[type];
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${activeType === type ? 'text-white' : ''}`}
              style={{
                background: activeType === type ? (tc?.bg || 'rgba(99,102,241,0.25)') : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeType === type ? (tc?.color || '#6366f1') : 'rgba(255,255,255,0.08)'}`,
                color: activeType === type ? (tc?.color || '#a5b4fc') : 'var(--text-muted)',
              }}
            >
              {type === 'all' ? 'All Opportunities' : tc?.label}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {total} {total === 1 ? 'opportunity' : 'opportunities'} found
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-glass rounded-2xl p-6 h-72 animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(99,102,241,0.1)' }}>
            <Briefcase size={28} style={{ color: '#6366f1' }} />
          </div>
          <h3 className="font-semibold text-lg mb-2">No opportunities found</h3>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            {savedOnly ? "You haven't saved any opportunities yet." : "Check back soon — new opportunities are posted regularly."}
          </p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp._id} opp={opp} onSave={handleSave} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
