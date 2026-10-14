'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { resourcesApi } from '@/lib/api';
import { Resource } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import FilePreviewModal from '@/components/FilePreviewModal';
import {
  BookOpen, Search, Upload, Download, Eye,
  Clock, FileText, Plus, Heart, Check, X,
  ExternalLink, AlertCircle, RefreshCw, CheckCircle2,
} from 'lucide-react';

const BRANCHES = ['All', 'CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'AIDS', 'AIML', 'Other'];
const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'notes', label: 'Notes' },
  { value: 'pyq', label: 'PYQ' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'reference', label: 'Reference' },
  { value: 'lab_manual', label: 'Lab Manual' },
  { value: 'other', label: 'Other' },
];

export default function ResourcesPage() {
  const { user } = useAuth();
  const canUpload = user?.role === 'admin' || user?.role === 'faculty';

  const [activeTab, setActiveTab] = useState<'published' | 'pending'>('published');
  const [resources, setResources] = useState<Resource[]>([]);
  const [pendingResources, setPendingResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(false);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('All');
  const [type, setType] = useState('');
  const [year, setYear] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [previewItem, setPreviewItem] = useState<{ id?: string; title: string; fileUrl: string; fileName?: string; subject?: string; branch?: string } | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '', description: '', subject: '', branch: 'CSE',
    year: '', type: 'notes', tags: '', file: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [total, setTotal] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Check URL query for tab=pending
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'pending' && canUpload) {
        setActiveTab('pending');
      }
    }
  }, [canUpload]);

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

  const fetchPendingResources = async () => {
    if (!canUpload) return;
    setLoadingPending(true);
    try {
      const res = await resourcesApi.getPending();
      setPendingResources(res.data.resources || []);
    } catch {
      // ignore
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchResources, 300);
    return () => clearTimeout(timer);
  }, [search, branch, type, year]);

  useEffect(() => {
    if (canUpload) {
      fetchPendingResources();
    }
  }, [canUpload]);

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
      const isStaff = user?.role === 'admin' || user?.role === 'faculty';
      toast.success(isStaff ? 'Resource uploaded and published!' : 'Resource submitted for review.');
      setShowUpload(false);
      setUploadForm({
        title: '', description: '', subject: '', branch: 'CSE',
        year: '', type: 'notes', tags: '', file: null,
      });
      fetchResources();
      if (canUpload) fetchPendingResources();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      await resourcesApi.approve(id);
      toast.success('Resource approved & published!');
      setPendingResources((prev) => prev.filter((r) => r._id !== id));
      fetchResources();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve resource');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    try {
      await resourcesApi.delete(id);
      toast.success('Resource rejected and removed');
      setPendingResources((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject resource');
    } finally {
      setActionLoadingId(null);
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

  const handleDownload = (resource: Resource) => {
    const downloadUrl = resourcesApi.getDownloadUrl(resource._id);
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <BookOpen size={20} style={{ color: 'var(--primary)' }} />
            Learning Hub
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {total} resources available
          </p>
        </div>
        <button id="upload-resource-btn" onClick={() => setShowUpload(true)} className="btn-primary text-sm">
          <Plus size={16} /> {canUpload ? 'Upload Resource' : 'Submit Resource'}
        </button>
      </div>

      {/* Tabs */}
      {canUpload && (
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <button
            onClick={() => setActiveTab('published')}
            className="flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
            style={{
              background: activeTab === 'published' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'published' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <BookOpen size={14} /> Published ({total})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className="flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
            style={{
              background: activeTab === 'pending' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'pending' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Clock size={14} /> Pending
            {pendingResources.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded font-medium"
                style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}>
                {pendingResources.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* PUBLISHED TAB */}
      {activeTab === 'published' && (
        <>
          {/* Search + Filters */}
          <div className="card p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="resource-search" type="text" placeholder="Search resources..."
                  className="w-full pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
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

          {/* Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="card p-5 space-y-3">
                  <div className="h-5 w-3/4 rounded animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
                  <div className="h-4 w-full rounded animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
                  <div className="h-4 w-1/2 rounded animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
                </div>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="card p-12 text-center">
              <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No resources found</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or upload the first one!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {resources.map((resource, i) => (
                <motion.div
                  key={resource._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="card p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--primary-muted)' }}>
                      <FileText size={18} style={{ color: 'var(--primary)' }} />
                    </div>
                    <span className="badge badge-primary text-xs capitalize">
                      {resource.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1" style={{ color: 'var(--text-primary)' }}>{resource.title}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
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

                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    by {typeof resource.uploadedBy === 'object' ? (resource.uploadedBy?.name || 'Anonymous') : 'Anonymous'}
                  </p>

                  <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                      onClick={() => setPreviewItem({
                        id: resource._id,
                        title: resource.title,
                        fileUrl: resource.fileUrl,
                        fileName: resource.fileName,
                        subject: resource.subject,
                        branch: resource.branch,
                      })}
                      className="btn-secondary py-1.5 px-2.5 text-xs"
                      title="Preview Document"
                    >
                      <Eye size={13} /> Preview
                    </button>
                    <button
                      id={`download-${resource._id}`}
                      onClick={() => handleDownload(resource)}
                      className="btn-primary flex-1 py-1.5 text-xs"
                    >
                      <Download size={13} /> Download
                    </button>
                    <button
                      id={`like-${resource._id}`}
                      onClick={() => handleLike(resource._id)}
                      className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-secondary)] flex items-center gap-1 text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Heart size={14} /> {resource.likes?.length || 0}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* PENDING TAB */}
      {activeTab === 'pending' && canUpload && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Clock size={16} style={{ color: '#eab308' }} />
                Pending Submissions ({pendingResources.length})
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Review student submissions before publishing.
              </p>
            </div>
            <button onClick={fetchPendingResources} className="btn-secondary text-xs py-1.5 px-3">
              <RefreshCw size={13} className={loadingPending ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {loadingPending ? (
            <div className="py-12 text-center">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2" style={{ color: 'var(--primary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading pending submissions...</p>
            </div>
          ) : pendingResources.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: 'var(--success)' }} />
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>No Pending Submissions</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>All submissions are reviewed.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {pendingResources.map((r) => (
                <div key={r._id} className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--warning-muted)' }}>
                      <FileText size={18} style={{ color: '#eab308' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{r.title}</h3>
                        <span className="badge badge-warning text-xs uppercase">{r.type}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {r.subject} · {r.branch} {r.year ? `· Year ${r.year}` : ''}
                      </p>
                      {r.description && (
                        <p className="text-xs mt-1 line-clamp-2 p-2 rounded-md" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                          {r.description}
                        </p>
                      )}
                      <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                        By {r.uploadedBy?.name || 'Student'} ({r.uploadedBy?.rollNumber || 'N/A'})
                        {r.fileSize && ` · ${(r.fileSize / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 pt-3 md:pt-0" style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                      onClick={() => setPreviewItem({ id: r._id, title: r.title, fileUrl: r.fileUrl, fileName: r.fileName, subject: r.subject, branch: r.branch })}
                      className="btn-secondary py-1.5 px-3 text-xs"
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <button
                      onClick={() => handleReject(r._id)}
                      disabled={actionLoadingId === r._id}
                      className="btn-danger py-1.5 px-3 text-xs"
                    >
                      <X size={14} /> Reject
                    </button>
                    <button
                      onClick={() => handleApprove(r._id)}
                      disabled={actionLoadingId === r._id}
                      className="py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                      style={{ background: 'var(--success)', color: '#fff' }}
                    >
                      {actionLoadingId === r._id ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <><Check size={14} /> Approve</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title={canUpload ? 'Upload Resource' : 'Submit Resource'} maxWidth="max-w-lg">
        {!canUpload && (
          <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--info-muted)', color: '#60a5fa' }}>
            Your submission will be reviewed before it goes live.
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title *</label>
            <input id="upload-title" type="text" required placeholder="e.g. Data Structures - Unit 3 Notes" className="input-field"
              value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subject *</label>
              <input id="upload-subject" type="text" required placeholder="e.g. Data Structures" className="input-field"
                value={uploadForm.subject} onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type</label>
              <select id="upload-type" className="input-field" value={uploadForm.type}
                onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}>
                {TYPES.slice(1).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Branch</label>
              <select id="upload-branch" className="input-field" value={uploadForm.branch}
                onChange={(e) => setUploadForm({ ...uploadForm, branch: e.target.value })}>
                {BRANCHES.slice(1).map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Year</label>
              <select id="upload-year" className="input-field" value={uploadForm.year}
                onChange={(e) => setUploadForm({ ...uploadForm, year: e.target.value })}>
                <option value="">All Years</option>
                {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tags (comma-separated)</label>
            <input id="upload-tags" type="text" placeholder="e.g. trees, sorting, graphs" className="input-field"
              value={uploadForm.tags} onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>File * (PDF, DOC, PPT — max 25MB)</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
              style={{ borderColor: uploadForm.file ? 'var(--success)' : 'var(--border)' }}>
              <input id="upload-file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                className="hidden" onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })} />
              {uploadForm.file ? (
                <div className="text-sm" style={{ color: 'var(--success)' }}>
                  ✅ {uploadForm.file.name} ({(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              ) : (
                <label htmlFor="upload-file" className="cursor-pointer">
                  <Upload size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Click to select a file</p>
                </label>
              )}
            </div>
          </div>
          <button id="upload-submit" type="submit" disabled={uploading} className="btn-primary w-full">
            {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Upload Resource'}
          </button>
        </form>
      </Modal>

      {/* File Preview Modal */}
      {previewItem && (
        <FilePreviewModal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title={previewItem.title}
          fileUrl={previewItem.fileUrl}
          resourceId={previewItem.id}
          fileName={previewItem.fileName}
          subject={previewItem.subject}
          branch={previewItem.branch}
        />
      )}
    </div>
  );
}
