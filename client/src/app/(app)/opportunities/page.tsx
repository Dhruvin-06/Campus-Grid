'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { opportunitiesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Briefcase, MapPin, Calendar, ExternalLink, Bookmark, BookmarkCheck,
  Search, Filter, Clock, Building2, Zap, Award, GraduationCap, ChevronDown,
  X, CheckCircle2, Star, Pencil, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';

const TYPES = ['all', 'placement', 'internship', 'hackathon'] as const;

const typeConfig = {
  placement:  { label: 'Placement',  color: '#818cf8', bg: 'rgba(99,102,241,0.1)',  icon: Briefcase },
  internship: { label: 'Internship', color: '#4ade80', bg: 'rgba(34,197,94,0.1)',   icon: Award },
  hackathon:  { label: 'Hackathon',  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  icon: Zap },
};

function OpportunityCard({
  opp, onSave, onEdit, onDelete,
}: {
  opp: any;
  onSave: (id: string) => void;
  onEdit?: (opp: any) => void;
  onDelete?: (id: string) => void;
}) {
  const { user } = useAuth();
  const tc = typeConfig[opp.type as keyof typeof typeConfig];
  const Icon = tc?.icon || Briefcase;
  const isExpired = opp.deadline && new Date(opp.deadline) < new Date();
  const posterId = typeof opp.postedBy === 'object' ? opp.postedBy?._id : opp.postedBy;
  const canManage = user?.role === 'admin' || (posterId && user?._id && posterId === user?._id);

  const daysLeft = opp.deadline
    ? Math.max(0, Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="card p-5 flex flex-col gap-3"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium px-2 py-0.5 rounded"
            style={{ background: tc?.bg, color: tc?.color }}>
            {tc?.label || opp.type}
          </span>
          {opp.isVerified && (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
              style={{ background: 'var(--success-muted)', color: 'var(--success)' }}>
              <CheckCircle2 size={11} /> Verified
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {canManage && onEdit && (
            <button onClick={() => onEdit(opp)}
              className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
              style={{ color: 'var(--primary)' }} title="Edit" aria-label="Edit opportunity">
              <Pencil size={14} />
            </button>
          )}
          {canManage && onDelete && (
            <button onClick={() => onDelete(opp._id)}
              className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
              style={{ color: 'var(--danger)' }} title="Delete" aria-label="Delete opportunity">
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={() => onSave(opp._id)}
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
            title={opp.isSaved ? 'Unsave' : 'Save'} aria-label={opp.isSaved ? 'Unsave' : 'Save'}>
            {opp.isSaved
              ? <BookmarkCheck size={15} style={{ color: 'var(--primary)' }} />
              : <Bookmark size={15} style={{ color: 'var(--text-muted)' }} />}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: tc?.bg || 'var(--primary-muted)' }}>
          <Icon size={18} style={{ color: tc?.color || 'var(--primary)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>{opp.title}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{opp.company}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm line-clamp-2" style={{ color: 'var(--text-muted)' }}>{opp.description}</p>

      {/* Skills */}
      {opp.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {opp.skills.slice(0, 4).map((skill: string) => (
            <span key={skill} className="tag">{skill}</span>
          ))}
          {opp.skills.length > 4 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+{opp.skills.length - 4} more</span>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        {opp.location && <span className="flex items-center gap-1"><MapPin size={11} />{opp.location}</span>}
        {opp.packageOrStipend && <span className="flex items-center gap-1"><Star size={11} />{opp.packageOrStipend}</span>}
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

      {/* Apply */}
      {opp.applicationLink && (
        <a
          href={opp.applicationLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-auto text-sm py-2"
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

  const [editingOpp, setEditingOpp] = useState<any>(null);
  const [submittingOpp, setSubmittingOpp] = useState(false);

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

  const handleDeleteOpp = async (id: string) => {
    if (!confirm('Are you sure you want to remove this opportunity?')) return;
    try {
      await opportunitiesApi.delete(id);
      setOpportunities((prev) => prev.filter((o) => o._id !== id));
      toast.success('Opportunity removed');
    } catch {
      toast.error('Failed to remove opportunity');
    }
  };

  const handleUpdateOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpp) return;
    setSubmittingOpp(true);
    try {
      await opportunitiesApi.update(editingOpp._id, editingOpp);
      toast.success('Opportunity updated!');
      setEditingOpp(null);
      fetchOpportunities();
    } catch {
      toast.error('Failed to update opportunity');
    } finally {
      setSubmittingOpp(false);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: '', company: '', type: 'placement', description: '', location: 'On-Campus', packageOrStipend: '', applicationLink: '', skills: '', branch: 'CSE,ECE,IT', minCGPA: '0',
  });
  const [submitting, setSubmitting] = useState(false);

  const canCreate = user?.role === 'admin';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await opportunitiesApi.create(form);
      toast.success('Opportunity posted!');
      setShowCreateModal(false);
      setForm({ title: '', company: '', type: 'placement', description: '', location: 'On-Campus', packageOrStipend: '', applicationLink: '', skills: '', branch: 'CSE,ECE,IT', minCGPA: '0' });
      fetchOpportunities();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post opportunity');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormFields = (data: any, onChange: (d: any) => void) => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Title *</label>
        <input required value={data.title || ''} onChange={e => onChange({ ...data, title: e.target.value })} className="input-field" placeholder="Software Engineer Intern" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Company *</label>
          <input required value={data.company || ''} onChange={e => onChange({ ...data, company: e.target.value })} className="input-field" placeholder="Google / TCS" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
          <select value={data.type || 'placement'} onChange={e => onChange({ ...data, type: e.target.value })} className="input-field">
            <option value="placement">Placement</option>
            <option value="internship">Internship</option>
            <option value="hackathon">Hackathon</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description *</label>
        <textarea required value={data.description || ''} onChange={e => onChange({ ...data, description: e.target.value })} rows={3} className="input-field" placeholder="Role details..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Stipend / Package</label>
          <input value={data.packageOrStipend || ''} onChange={e => onChange({ ...data, packageOrStipend: e.target.value })} className="input-field" placeholder="12 LPA" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Location</label>
          <input value={data.location || ''} onChange={e => onChange({ ...data, location: e.target.value })} className="input-field" placeholder="Remote / Bangalore" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Application Link</label>
        <input value={data.applicationLink || ''} onChange={e => onChange({ ...data, applicationLink: e.target.value })} className="input-field" placeholder="https://careers.company.com/..." />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Briefcase size={20} style={{ color: '#fbbf24' }} />
            Opportunities
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Verified opportunities for your campus.
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">
            + Post Opportunity
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search opportunities..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Clear search">
              <X size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
        <button onClick={() => setSavedOnly(!savedOnly)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: savedOnly ? 'var(--primary)' : 'var(--surface)',
            border: `1px solid ${savedOnly ? 'var(--primary)' : 'var(--border)'}`,
            color: savedOnly ? '#fff' : 'var(--text-secondary)',
          }}>
          <Bookmark size={14} /> Saved
        </button>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Post Opportunity" maxWidth="max-w-lg">
        <form onSubmit={handleCreate}>
          {renderFormFields(form, setForm)}
          <div className="flex items-center justify-end gap-2 pt-4">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm">{submitting ? 'Posting...' : 'Post Opportunity'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editingOpp && (
        <Modal isOpen={!!editingOpp} onClose={() => setEditingOpp(null)} title="Edit Opportunity" maxWidth="max-w-lg">
          <form onSubmit={handleUpdateOpp}>
            {renderFormFields(editingOpp, setEditingOpp)}
            <div className="flex items-center justify-end gap-2 pt-4">
              <button type="button" onClick={() => setEditingOpp(null)} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" disabled={submittingOpp} className="btn-primary text-sm">{submittingOpp ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Type tabs */}
      <div className="flex gap-1 p-1 rounded-lg flex-wrap" style={{ background: 'var(--bg-secondary)' }}>
        {TYPES.map((type) => {
          const tc = type === 'all' ? null : typeConfig[type];
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className="px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors"
              style={{
                background: activeType === type ? 'var(--surface)' : 'transparent',
                color: activeType === type ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {type === 'all' ? 'All' : tc?.label}
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
            <div key={i} className="card p-6 h-64 animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase size={32} className="mx-auto mb-3 opacity-20" />
          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>No opportunities found</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {savedOnly ? "You haven't saved any opportunities yet." : "Check back soon."}
          </p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp._id}
                opp={opp}
                onSave={handleSave}
                onEdit={(o) => setEditingOpp(o)}
                onDelete={handleDeleteOpp}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
