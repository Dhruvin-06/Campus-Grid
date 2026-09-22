'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { contentApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/Modal';
import {
  Newspaper, Megaphone, Heart, MessageSquare, Plus, Pin, Clock,
  Users, BookOpen, Award, Briefcase, Zap, Tag, X, Send, ChevronDown,
  Pencil, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const FEED_CATEGORIES = [
  { value: 'all',        label: 'All',        icon: Newspaper },
  { value: 'general',    label: 'General',    icon: Megaphone },
  { value: 'placement',  label: 'Placement',  icon: Briefcase },
  { value: 'achievement',label: 'Achievement',icon: Award },
  { value: 'event',      label: 'Events',     icon: Zap },
  { value: 'academic',   label: 'Academic',   icon: BookOpen },
  { value: 'project',    label: 'Projects',   icon: Tag },
];

const categoryConfig: Record<string, { color: string; bg: string }> = {
  general:     { color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  placement:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  achievement: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  event:       { color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  academic:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  project:     { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function FeedCard({
  post,
  onLike,
  onComment,
  onEdit,
  onDelete,
}: {
  post: any;
  onLike: (id: string) => void;
  onComment: (id: string, text: string) => void;
  onEdit?: (post: any) => void;
  onDelete?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const { user } = useAuth();
  const cc = categoryConfig[post.category] || categoryConfig.general;
  const isLong = post.content.length > 300;
  const canManage = user?.role === 'admin' || post.author?._id === user?._id;

  const submitComment = () => {
    if (!commentText.trim()) return;
    onComment(post._id, commentText.trim());
    setCommentText('');
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="card-glass rounded-2xl p-5 space-y-4"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Author row */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-white flex-shrink-0"
          style={{ background: 'var(--gradient-primary)' }}>
          {post.author?.avatar
            ? <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
            : post.author?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{post.author?.name}</p>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{post.author?.branch}</span>
            <span>·</span>
            <Clock size={10} />
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>

        {/* Category badge */}
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0"
          style={{ background: cc.bg, color: cc.color }}>
          {post.category}
        </span>

        {/* Admin/Author action buttons */}
        {canManage && (
          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
            <button
              onClick={() => onEdit?.(post)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-indigo-400"
              title="Edit Post"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete?.(post._id)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-red-400"
              title="Delete Post"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <h3 className="font-bold text-base mb-2">{post.title}</h3>
        {post.coverImage && (
          <img src={post.coverImage} alt={post.title}
            className="w-full rounded-xl mb-3 object-cover" style={{ maxHeight: 280 }} />
        )}
        <div className={`text-sm leading-relaxed ${!expanded && isLong ? 'line-clamp-4' : ''}`}
          style={{ color: 'var(--text-secondary)' }}>
          {post.content}
        </div>
        {isLong && (
          <button onClick={() => setExpanded(!expanded)}
            className="text-xs mt-1 font-medium" style={{ color: '#6366f1' }}>
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag: string) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={() => onLike(post._id)}
          className="flex items-center gap-1.5 text-sm transition-all hover:scale-105"
          style={{ color: post.likes?.includes(user?._id) ? '#f43f5e' : 'var(--text-muted)' }}>
          <Heart size={15} fill={post.likes?.includes(user?._id) ? '#f43f5e' : 'none'} />
          <span>{post.likes?.length || 0}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm transition-all hover:scale-105"
          style={{ color: 'var(--text-muted)' }}>
          <MessageSquare size={15} />
          <span>{post.comments?.length || 0}</span>
        </button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
            {(post.comments || []).map((c: any, i: number) => (
              <div key={i} className="flex gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'var(--gradient-primary)' }}>
                  {c.user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="font-semibold mr-2">{c.user?.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{c.content}</span>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                placeholder="Add a comment…"
                className="flex-1 px-3 py-2 rounded-xl text-sm bg-transparent outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }} />
              <button onClick={submitComment}
                className="p-2 rounded-xl transition-all"
                style={{ background: commentText.trim() ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)' }}>
                <Send size={14} color="white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CampusFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general', tags: '' });
  const [submitting, setSubmitting] = useState(false);

  // Edit & Delete state
  const [editingItem, setEditingItem] = useState<{
    type: 'announcement' | 'post';
    id: string;
    title: string;
    content: string;
    category?: string;
  } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const [feedRes, annRes] = await Promise.all([
        contentApi.getFeed({ category: category === 'all' ? undefined : category, limit: 20 }),
        contentApi.getAnnouncements({ limit: 10 }),
      ]);
      setPosts(feedRes.data.posts || []);
      setAnnouncements(annRes.data.announcements || []);
    } catch {
      toast.error('Failed to load campus feed');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const handleLike = async (id: string) => {
    try {
      const res = await contentApi.likePost(id);
      setPosts((prev) => prev.map((p) => {
        if (p._id !== id) return p;
        const liked = res.data.liked;
        const likes = liked
          ? [...(p.likes || []), user?._id]
          : (p.likes || []).filter((l: string) => l !== user?._id);
        return { ...p, likes };
      }));
    } catch { /* silent */ }
  };

  const handleComment = async (id: string, content: string) => {
    try {
      const res = await contentApi.commentPost(id, content);
      setPosts((prev) => prev.map((p) => p._id === id ? { ...p, comments: res.data.comments } : p));
    } catch { toast.error('Failed to post comment'); }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('title', newPost.title);
      form.append('content', newPost.content);
      form.append('category', newPost.category);
      if (newPost.tags) form.append('tags', newPost.tags);
      await contentApi.createPost(form);
      toast.success(
        ['admin', 'faculty'].includes(user?.role || '')
          ? 'Post published!'
          : 'Post submitted for review!'
      );
      setShowCreatePost(false);
      setNewPost({ title: '', content: '', category: 'general', tags: '' });
      fetchFeed();
    } catch {
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await contentApi.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      toast.success('Announcement deleted');
    } catch {
      toast.error('Failed to delete announcement');
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await contentApi.deletePost(id);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      if (editingItem.type === 'announcement') {
        await contentApi.updateAnnouncement(editingItem.id, {
          title: editingItem.title,
          content: editingItem.content,
        });
        setAnnouncements((prev) =>
          prev.map((a) => (a._id === editingItem.id ? { ...a, title: editingItem.title, content: editingItem.content } : a))
        );
        toast.success('Announcement updated');
      } else {
        await contentApi.updatePost(editingItem.id, {
          title: editingItem.title,
          content: editingItem.content,
          category: editingItem.category,
        });
        setPosts((prev) =>
          prev.map((p) =>
            p._id === editingItem.id
              ? { ...p, title: editingItem.title, content: editingItem.content, category: editingItem.category || p.category }
              : p
          )
        );
        toast.success('Post updated');
      }
      setEditingItem(null);
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Newspaper size={28} className="text-pink-400" />
            Campus Feed
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Announcements, achievements, events & student posts
          </p>
        </div>
        <button onClick={() => setShowCreatePost(!showCreatePost)}
          className="btn-primary flex items-center gap-2 text-sm py-2 px-4 rounded-xl">
          <Plus size={16} />
          {showCreatePost ? 'Cancel' : 'Post'}
        </button>
      </div>

      {/* Announcements pinned bar */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider px-1 flex items-center gap-1.5"
            style={{ color: 'var(--text-muted)' }}>
            <Megaphone size={11} /> Official Announcements
          </p>
          {announcements.map((ann) => (
            <motion.div key={ann._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-start gap-3 p-3 rounded-xl relative group"
              style={{ background: ann.isPinned ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${ann.isPinned ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
              {ann.isPinned && <Pin size={12} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{ann.title}</p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{ann.content}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {ann.postedBy?.name} · {timeAgo(ann.createdAt)}
                </p>
              </div>

              {/* Admin/Creator controls */}
              {(user?.role === 'admin' || ann.postedBy?._id === user?._id) && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditingItem({ type: 'announcement', id: ann._id, title: ann.title, content: ann.content })}
                    className="p-1 rounded-lg hover:bg-white/10 text-indigo-400 transition-colors"
                    title="Edit Announcement"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteAnnouncement(ann._id)}
                    className="p-1 rounded-lg hover:bg-white/10 text-red-400 transition-colors"
                    title="Delete Announcement"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Post form */}
      <AnimatePresence>
        {showCreatePost && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card-glass rounded-2xl p-5 space-y-3 overflow-hidden"
            style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
            <h3 className="font-semibold">Create a Post</h3>
            <input value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              placeholder="Title *"
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-transparent outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }} />
            <textarea value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="What would you like to share? *"
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl text-sm resize-none bg-transparent outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }} />
            <div className="flex gap-3">
              <select value={newPost.category} onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}>
                {FEED_CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input value={newPost.tags} onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                placeholder="Tags (comma-separated)"
                className="flex-1 px-3 py-2 rounded-xl text-sm bg-transparent outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }} />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {['admin', 'faculty'].includes(user?.role || '') ? '✅ Will be published immediately' : '⏳ Will be reviewed before publishing'}
              </p>
              <button onClick={handleCreatePost} disabled={submitting || !newPost.title.trim() || !newPost.content.trim()}
                className="btn-primary text-sm py-2 px-5 rounded-xl flex items-center gap-2"
                style={{ opacity: submitting || !newPost.title.trim() ? 0.6 : 1 }}>
                <Send size={14} />
                {submitting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FEED_CATEGORIES.map(({ value, label, icon: Icon }) => (
          <button key={value} onClick={() => setCategory(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${category === value ? 'text-white' : ''}`}
            style={{
              background: category === value ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${category === value ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
              color: category === value ? '#a5b4fc' : 'var(--text-muted)',
              flexShrink: 0,
            }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(99,102,241,0.1)' }}>
            <Newspaper size={28} style={{ color: '#6366f1' }} />
          </div>
          <h3 className="font-semibold text-lg mb-2">No posts yet</h3>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            Be the first to share something with your campus!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <FeedCard
              key={post._id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              onEdit={(p) => setEditingItem({ type: 'post', id: p._id, title: p.title, content: p.content, category: p.category })}
              onDelete={handleDeletePost}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={editingItem?.type === 'announcement' ? 'Edit Official Announcement' : 'Edit Campus Post'}
        maxWidth="max-w-lg"
      >
        {editingItem && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Title *</label>
              <input
                type="text"
                required
                className="input-field text-sm"
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
              />
            </div>

            {editingItem.type === 'post' && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
                <select
                  className="input-field text-sm"
                  value={editingItem.category || 'general'}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                >
                  {FEED_CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Content *</label>
              <textarea
                required
                rows={5}
                className="input-field text-sm resize-none"
                value={editingItem.content}
                onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {savingEdit ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
