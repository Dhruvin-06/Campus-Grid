'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { lostFoundApi } from '@/lib/api';
import { LostFoundItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import { useRouter } from 'next/navigation';
import { MapPin, Search, Plus, X, CheckCircle, Camera, MessageSquare, PhoneCall, Send, Hand } from 'lucide-react';

const CATEGORIES = ['electronics', 'stationery', 'clothing', 'id_card', 'books', 'keys', 'wallet', 'other'];

const catEmoji: Record<string, string> = {
  electronics: '💻', stationery: '✏️', clothing: '👕',
  id_card: '🪪', books: '📚', keys: '🔑', wallet: '👛', other: '📦',
};

export default function LostFoundPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'lost' | 'found' | ''>('');
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Claim & Reach out state
  const [selectedClaimItem, setSelectedClaimItem] = useState<LostFoundItem | null>(null);
  const [claimMessage, setClaimMessage] = useState('');
  const [claiming, setClaiming] = useState(false);

  const [form, setForm] = useState({
    type: 'lost', title: '', description: '', category: 'other',
    location: '', contactInfo: '', image: null as File | null,
  });
  const [creating, setCreating] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params: any = { resolved: false };
      if (typeFilter) params.type = typeFilter;
      if (catFilter) params.category = catFilter;
      if (search) params.search = search;
      const res = await lostFoundApi.getAll(params);
      setItems(res.data.posts || []);
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(fetchItems, 300);
    return () => clearTimeout(t);
  }, [typeFilter, catFilter, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('type', form.type);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('location', form.location);
      if (form.contactInfo) fd.append('contactInfo', form.contactInfo);
      if (form.image) fd.append('image', form.image);
      await lostFoundApi.create(fd);
      toast.success('Post created!');
      setShowCreate(false);
      fetchItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setCreating(false); }
  };

  const handleResolve = async (id: string) => {
    try {
      await lostFoundApi.resolve(id, {});
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast.success('Marked as resolved!');
    } catch { toast.error('Failed'); }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimItem) return;
    setClaiming(true);
    try {
      const res = await lostFoundApi.claim(selectedClaimItem._id, { message: claimMessage });
      toast.success(res.data.message || 'Notification sent!');
      setSelectedClaimItem(null);
      setClaimMessage('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send claim notification');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Campus Services</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2">
            <MapPin size={26} className="text-indigo-400" /> Lost & Found
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Report lost items, claim found belongings, or reach out to owners directly.
          </p>
        </div>
        <button id="create-lostfound-btn" onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Post Item
        </button>
      </div>

      {/* Filters */}
      <div className="saas-card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {(['', 'lost', 'found'] as const).map((t) => (
            <button
              key={t}
              id={`filter-${t || 'all'}`}
              onClick={() => setTypeFilter(t)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: typeFilter === t
                  ? t === 'lost' ? 'rgba(239,68,68,0.8)' : t === 'found' ? 'rgba(16,185,129,0.8)' : 'linear-gradient(135deg, #4f46e5, #06b6d4)'
                  : 'rgba(255,255,255,0.05)',
                color: typeFilter === t ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${typeFilter === t ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {t === '' ? 'All' : t === 'lost' ? '🔴 Lost' : '🟢 Found'}
            </button>
          ))}
        </div>

        <select id="cat-filter" className="input-field w-auto text-xs font-medium" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{catEmoji[c]} {c}</option>)}
        </select>

        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input id="lf-search" type="text" placeholder="Search items, location..." className="input-field pl-9 text-xs"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="saas-card p-5 space-y-3">
              <div className="skeleton h-36 rounded-xl" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="saas-card p-16 text-center">
          <MapPin size={48} className="mx-auto mb-4 opacity-20 text-slate-400" />
          <p className="font-bold text-white text-base">No items posted yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Lost something? Post it here to let others help!
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="saas-card p-0 overflow-hidden flex flex-col"
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 flex items-center justify-center text-5xl"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {catEmoji[item.category] || '📦'}
                </div>
              )}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm line-clamp-1 text-white">{item.title}</h3>
                  <span className={`saas-badge ${item.type === 'lost' ? 'saas-badge-danger' : 'saas-badge-success'}`}>
                    {item.type === 'lost' ? '🔴 Lost' : '🟢 Found'}
                  </span>
                </div>
                <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1"><MapPin size={11} /> {item.location}</span>
                  {item.contactInfo && (
                    <span className="px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px]" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>
                      <PhoneCall size={10} /> {item.contactInfo}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-auto pt-3 border-t flex-wrap" style={{ borderColor: 'var(--border-glass)' }}>
                  <p className="text-xs flex-1 truncate" style={{ color: 'var(--text-muted)' }}>
                    by <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.postedBy?.name}</span>
                  </p>

                  {item.postedBy?._id !== user?._id && (
                    <button
                      onClick={() => setSelectedClaimItem(item)}
                      className="flex items-center gap-1 text-xs py-1 px-2.5 rounded-lg font-medium transition-all"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}
                    >
                      <Hand size={12} /> Reach Out
                    </button>
                  )}

                  {item.postedBy?._id !== user?._id && (
                    <button
                      onClick={() => router.push('/chat')}
                      className="flex items-center gap-1 text-xs py-1 px-2 rounded-lg transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                      title="Direct Chat"
                    >
                      <MessageSquare size={12} />
                    </button>
                  )}

                  {(item.postedBy?._id === user?._id || user?.role === 'admin') && (
                    <button
                      id={`resolve-${item._id}`}
                      onClick={() => handleResolve(item._id)}
                      className="flex items-center gap-1 text-xs py-1 px-2.5 rounded-lg transition-colors"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}
                    >
                      <CheckCircle size={12} /> Resolve
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Post Lost/Found Item">
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            {['lost', 'found'].map((t) => (
              <button key={t} type="button" id={`type-${t}`}
                onClick={() => setForm({ ...form, type: t })}
                className="py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: form.type === t ? (t === 'lost' ? 'rgba(239,68,68,0.8)' : 'rgba(16,185,129,0.8)') : 'rgba(255,255,255,0.05)',
                  color: form.type === t ? 'white' : 'var(--text-secondary)',
                }}>
                {t === 'lost' ? '🔴 I Lost Something' : '🟢 I Found Something'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Item Name *</label>
            <input id="lf-title" type="text" required className="input-field text-sm" placeholder="e.g. Black Laptop Bag"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description *</label>
            <textarea id="lf-desc" required rows={3} className="input-field text-sm resize-none" placeholder="Describe the item in detail..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
              <select id="lf-category" className="input-field text-sm" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{catEmoji[c]} {c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Location *</label>
              <input id="lf-location" type="text" required className="input-field text-sm" placeholder="e.g. Library 2nd Floor"
                value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Contact Info (optional)</label>
            <input id="lf-contact" type="text" className="input-field text-sm" placeholder="Phone or email"
              value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Image (optional)</label>
            <div className="border-2 border-dashed rounded-xl p-4 text-center transition-colors"
              style={{ borderColor: form.image ? 'var(--color-success)' : 'var(--border-glass)' }}>
              <input id="lf-image" type="file" accept="image/*" className="hidden"
                onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })} />
              {form.image ? (
                <p className="text-sm" style={{ color: 'var(--color-success)' }}>✅ {form.image.name}</p>
              ) : (
                <label htmlFor="lf-image" className="cursor-pointer">
                  <Camera size={24} className="mx-auto mb-1 opacity-40" />
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Click to add a photo</p>
                </label>
              )}
            </div>
          </div>
          <button id="lf-submit" type="submit" disabled={creating} className="btn-primary w-full flex items-center justify-center gap-2">
            {creating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Post Item'}
          </button>
        </form>
      </Modal>

      {/* Reach Out / Claim Modal */}
      <Modal
        isOpen={!!selectedClaimItem}
        onClose={() => setSelectedClaimItem(null)}
        title={selectedClaimItem?.type === 'lost' ? 'Reach Out to Owner' : 'Claim Found Item'}
      >
        {selectedClaimItem && (
          <form onSubmit={handleClaimSubmit} className="space-y-4">
            <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-2xl">{catEmoji[selectedClaimItem.category] || '📦'}</div>
              <div>
                <p className="font-semibold text-sm">{selectedClaimItem.title}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Posted by {selectedClaimItem.postedBy?.name} · {selectedClaimItem.location}
                </p>
              </div>
            </div>

            {selectedClaimItem.contactInfo && (
              <div className="p-3 rounded-xl flex items-center gap-2 text-xs" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>
                <PhoneCall size={14} />
                <span>Provided Contact: <strong>{selectedClaimItem.contactInfo}</strong></span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Message / Identification Proof *
              </label>
              <textarea
                required
                rows={3}
                className="input-field text-sm resize-none"
                placeholder={
                  selectedClaimItem.type === 'lost'
                    ? 'e.g. I found this item near Lab 3. Contact me to retrieve it!'
                    : 'e.g. I lost this wallet! It contains my student ID card and library card.'
                }
                value={claimMessage}
                onChange={(e) => setClaimMessage(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={claiming}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {claiming ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={14} /> Send & Notify Uploader</>}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedClaimItem(null);
                  router.push('/chat');
                }}
                className="btn-secondary flex items-center justify-center gap-1 text-xs px-3"
              >
                <MessageSquare size={14} /> Direct Chat
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
