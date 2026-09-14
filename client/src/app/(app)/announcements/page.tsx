'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { contentApi } from '@/lib/api';
import { Announcement, Blog } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Newspaper, Bell, Plus, X, Pin, Calendar, Heart, MessageSquare, ChevronDown } from 'lucide-react';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'announcements' | 'blogs'>('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [blogComment, setBlogComment] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    // announcement fields
    title: '', content: '', type: 'general', isPinned: false,
    // blog extra
    excerpt: '', tags: '', mode: 'announcement' as 'announcement' | 'blog',
  });
  const [creating, setCreating] = useState(false);

  const canAnnounce = user?.role === 'admin' || user?.role === 'faculty';

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [annRes, blogRes] = await Promise.all([
        contentApi.getAnnouncements({ limit: 20 }),
        contentApi.getBlogs({ limit: 9 }),
      ]);
      setAnnouncements(annRes.data.announcements || []);
      setBlogs(blogRes.data.blogs || []);
    } catch { toast.error('Failed to load content'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      if (form.mode === 'announcement') {
        await contentApi.createAnnouncement({
          title: form.title, content: form.content, type: form.type, isPinned: form.isPinned,
        });
        toast.success('Announcement posted!');
      } else {
        const fd = new FormData();
        fd.append('title', form.title);
        fd.append('content', form.content);
        fd.append('excerpt', form.excerpt || form.content.substring(0, 200));
        if (form.tags) fd.append('tags', form.tags);
        await contentApi.createBlog(fd);
        toast.success('Blog submitted for approval!');
      }
      setShowForm(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setCreating(false); }
  };

  const handleLikeBlog = async (id: string) => {
    try {
      const res = await contentApi.likeBlog(id);
      setBlogs((prev) => prev.map((b) =>
        b._id === id ? { ...b, likes: res.data.liked ? [...(b.likes || []), 'me'] : (b.likes || []).slice(0, -1) } : b
      ));
    } catch { }
  };

  const handleComment = async (blogId: string) => {
    const content = blogComment[blogId]?.trim();
    if (!content) return;
    try {
      await contentApi.commentBlog(blogId, content);
      setBlogComment((prev) => ({ ...prev, [blogId]: '' }));
      toast.success('Comment added!');
    } catch { toast.error('Failed to comment'); }
  };

  const typeColors: Record<string, string> = {
    general: 'badge-primary', urgent: 'badge-danger',
    event: 'badge-accent', holiday: 'badge-success', exam: 'badge-warning',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper size={26} style={{ color: '#06b6d4' }} />
            Campus Feed
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Announcements, events, and student blogs
          </p>
        </div>
        <button id="create-content-btn" onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> {canAnnounce ? 'Post' : 'Write Blog'}
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {(['announcements', 'blogs'] as const).map((t) => (
          <button key={t} id={`tab-${t}`} onClick={() => setTab(t)}
            className="px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all"
            style={{
              background: tab === t ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'rgba(255,255,255,0.05)',
              color: tab === t ? 'white' : 'var(--text-secondary)',
            }}>
            {t === 'announcements' ? '📢 Announcements' : '✍️ Blogs'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-4/5" />
            </div>
          ))}
        </div>
      ) : tab === 'announcements' ? (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Bell size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold">No announcements yet</p>
            </div>
          ) : announcements.map((ann, i) => (
            <motion.div key={ann._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
              style={ann.type === 'urgent' ? { borderColor: 'rgba(239,68,68,0.3)' } : {}}>
              <div className="flex items-start gap-3 mb-3">
                {ann.isPinned && <Pin size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#f59e0b', fill: '#f59e0b' }} />}
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <h3 className="font-bold">{ann.title}</h3>
                    <span className={`badge ${typeColors[ann.type] || 'badge-primary'}`}>{ann.type}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{ann.content}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>by {typeof ann.postedBy === 'object' ? ann.postedBy.name : 'Admin'}</span>
                <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(ann.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blogs.length === 0 ? (
            <div className="glass-card p-12 text-center col-span-3">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold">No blogs published yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Be the first to write one!</p>
            </div>
          ) : blogs.map((blog, i) => (
            <motion.div key={blog._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass-card overflow-hidden flex flex-col">
              {blog.coverImage && <img src={blog.coverImage} alt={blog.title} className="w-full h-40 object-cover" />}
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {blog.tags?.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
                  </div>
                  <h3 className="font-bold line-clamp-2">{blog.title}</h3>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{blog.excerpt}</p>
                </div>
                <div className="flex items-center gap-2 text-xs mt-auto" style={{ color: 'var(--text-muted)' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                    {typeof blog.author === 'object' ? blog.author.name[0] : 'A'}
                  </div>
                  <span>{typeof blog.author === 'object' ? blog.author.name : 'Author'}</span>
                  <span className="ml-auto">{new Date(blog.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: 'var(--border-glass)' }}>
                  <button id={`like-blog-${blog._id}`} onClick={() => handleLikeBlog(blog._id)}
                    className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--text-secondary)' }}>
                    <Heart size={14} /> {blog.likes?.length || 0}
                  </button>
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <MessageSquare size={13} /> {blog.comments?.length || 0}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Create Post</h2>
              <button onClick={() => setShowForm(false)}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
            </div>

            {/* Mode selector */}
            {canAnnounce && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(['announcement', 'blog'] as const).map((m) => (
                  <button key={m} type="button" id={`mode-${m}`} onClick={() => setForm({ ...form, mode: m })}
                    className="py-2 rounded-xl text-sm font-medium capitalize transition-all"
                    style={{
                      background: form.mode === m ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'rgba(255,255,255,0.05)',
                      color: form.mode === m ? 'white' : 'var(--text-secondary)',
                    }}>
                    {m === 'announcement' ? '📢 Announcement' : '✍️ Blog'}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Title *</label>
                <input id="content-title" type="text" required className="input-field text-sm" placeholder="Title"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              {form.mode === 'announcement' && canAnnounce && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
                    <select id="ann-type" className="input-field text-sm" value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      {['general', 'urgent', 'event', 'holiday', 'exam'].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input id="ann-pinned" type="checkbox" checked={form.isPinned}
                      onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} />
                    <label htmlFor="ann-pinned" className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pin announcement</label>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Content *</label>
                <textarea id="content-body" required rows={5} className="input-field text-sm resize-none" placeholder="Write your content here..."
                  value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
              {form.mode === 'blog' && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tags (comma-separated)</label>
                  <input id="blog-tags" type="text" className="input-field text-sm" placeholder="react, webdev, campus-life"
                    value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
              )}
              <button id="content-submit" type="submit" disabled={creating} className="btn-primary w-full flex items-center justify-center gap-2">
                {creating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Publish'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
