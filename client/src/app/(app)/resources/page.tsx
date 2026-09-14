'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { resourcesApi } from '@/lib/api';
import { Resource } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  BookOpen, Upload, Search, Download, Heart, Eye, Filter,
  FileText, X, Plus, ChevronDown,
} from 'lucide-react';

const BRANCHES = ['All', 'CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'AIDS', 'AIML', 'Other'];
const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'notes', label: '📝 Notes' },
  { value: 'pyq', label: '📄 PYQ' },
  { value: 'assignment', label: '📋 Assignment' },
  { value: 'reference', label: '📚 Reference' },
  { value: 'lab_manual', label: '🔬 Lab Manual' },
  { value: 'other', label: '📎 Other' },
];

export default function ResourcesPage() {
  const { user } = useAuth();
  const canUpload = user?.role === 'admin' || user?.role === 'faculty';
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('All');
  const [type, setType] = useState('');
  const [year, setYear] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '', description: '', subject: '', branch: 'CSE',
    year: '', type: 'notes', tags: '', file: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 12 };
      if (search) params.search = search;
      if (branch !== 'All') params.branch = branch;
      if (type) params.type = type;
      if (year) params.year = year;

      const res = await resourcesApi.getAll(params);
      setResources(res.data.resources || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchResources, 300);
    return () => clearTimeout(timer);
  }, [search, branch, type, year]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) { toast.error('Please select a file'); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadForm.file);
      fd.append('title', uploadForm.title);
      fd.append('description', uploadForm.description);
      fd.append('subject', uploadForm.subject);
      fd.append('branch', uploadForm.branch);
      if (uploadForm.year) fd.append('year', uploadForm.year);
      fd.append('type', uploadForm.type);
      if (uploadForm.tags) fd.append('tags', uploadForm.tags);

      await resourcesApi.upload(fd);
      toast.success('Resource uploaded! It will be visible after approval.');
      setShowUpload(false);
      fetchResources();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (id: string) => {
    try {
      const res = await resourcesApi.like(id);
      setResources((prev) =>
        prev.map((r) => r._id === id ? { ...r, likes: res.data.liked ? [...(r.likes || []), 'me'] : (r.likes || []).slice(0, -1) } : r)
      );
    } catch { toast.error('Failed'); }
  };

  const handleDownload = async (resource: Resource) => {
    await resourcesApi.trackDownload(resource._id);
    window.open(resource.fileUrl, '_blank');
  };

  const typeColors: Record<string, string> = {
    notes: 'badge-primary', pyq: 'badge-accent', assignment: 'badge-warning',
    reference: 'badge-success', lab_manual: 'badge-danger', other: 'badge-primary',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen size={26} style={{ color: 'var(--color-primary)' }} />
            Resource Vault
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {total} resources available · Notes, PYQs, Assignments & more
          </p>
        </div>
        {canUpload && (
          <button id="upload-resource-btn" onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Upload
          </button>
        )}
      </div>

      {/* Search + Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input id="resource-search" type="text" placeholder="Search by title, subject, tags..."
              className="input-field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select id="resource-branch-filter" className="input-field w-auto" value={branch} onChange={(e) => setBranch(e.target.value)}>
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select id="resource-type-filter" className="input-field w-auto" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select id="resource-year-filter" className="input-field w-auto" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All Years</option>
            {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-semibold">No resources found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters or upload the first one!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resources.map((resource, i) => (
            <motion.div
              key={resource._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 flex flex-col gap-3"
            >
              {/* Icon + Type badge */}
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <FileText size={22} style={{ color: 'var(--color-primary)' }} />
                </div>
                <span className={`badge ${typeColors[resource.type] || 'badge-primary'}`}>
                  {resource.type.replace('_', ' ')}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">{resource.title}</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {resource.subject} · {resource.branch}{resource.year ? ` · Y${resource.year}` : ''}
                </p>
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {resource.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Uploader */}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                by {typeof resource.uploadedBy === 'object' ? (resource.uploadedBy?.name || 'Anonymous') : 'Anonymous'}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-glass)' }}>
                <button
                  id={`download-${resource._id}`}
                  onClick={() => handleDownload(resource)}
                  className="btn-primary flex-1 py-1.5 text-xs flex items-center justify-center gap-1"
                >
                  <Download size={13} /> Download
                </button>
                <button
                  id={`like-${resource._id}`}
                  onClick={() => handleLike(resource._id)}
                  className="p-2 rounded-xl transition-colors hover:bg-white/5 flex items-center gap-1 text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Heart size={14} /> {resource.likes?.length || 0}
                </button>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Eye size={13} /> {resource.views}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Upload size={20} style={{ color: 'var(--color-primary)' }} /> Upload Resource
              </h2>
              <button onClick={() => setShowUpload(false)}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title *</label>
                <input id="upload-title" type="text" required placeholder="e.g. Data Structures - Unit 3 Notes" className="input-field"
                  value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subject *</label>
                  <input id="upload-subject" type="text" required placeholder="e.g. Data Structures" className="input-field"
                    value={uploadForm.subject} onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type</label>
                  <select id="upload-type" className="input-field" value={uploadForm.type}
                    onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}>
                    {TYPES.slice(1).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Branch</label>
                  <select id="upload-branch" className="input-field" value={uploadForm.branch}
                    onChange={(e) => setUploadForm({ ...uploadForm, branch: e.target.value })}>
                    {BRANCHES.slice(1).map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Year</label>
                  <select id="upload-year" className="input-field" value={uploadForm.year}
                    onChange={(e) => setUploadForm({ ...uploadForm, year: e.target.value })}>
                    <option value="">All Years</option>
                    {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tags (comma-separated)</label>
                <input id="upload-tags" type="text" placeholder="e.g. trees, sorting, graphs" className="input-field"
                  value={uploadForm.tags} onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>File * (PDF, DOC, PPT — max 25MB)</label>
                <div className="border-2 border-dashed rounded-xl p-6 text-center transition-colors"
                  style={{ borderColor: uploadForm.file ? 'var(--color-success)' : 'var(--border-glass)' }}>
                  <input id="upload-file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    className="hidden" onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })} />
                  {uploadForm.file ? (
                    <div className="text-sm" style={{ color: 'var(--color-success)' }}>
                      ✅ {uploadForm.file.name} ({(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ) : (
                    <label htmlFor="upload-file" className="cursor-pointer">
                      <Upload size={28} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Click to select a file</p>
                    </label>
                  )}
                </div>
              </div>
              <button id="upload-submit" type="submit" disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2">
                {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Upload Resource'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
