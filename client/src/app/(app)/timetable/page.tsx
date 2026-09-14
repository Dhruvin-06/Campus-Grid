'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { timetableApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, Clock, MapPin, X, BookOpen } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 11 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);
const SLOT_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const SLOT_TYPES = ['lecture', 'lab', 'tutorial', 'free'];

interface Slot {
  _id: string;
  day: string;
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  color: string;
  type: string;
}

const emptySlot = { day: 'Monday', subject: '', teacher: '', room: '', startTime: '09:00', endTime: '10:00', color: '#6366f1', type: 'lecture' };

export default function TimetablePage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'faculty';
  const [timetable, setTimetable] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSlot, setEditSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState(emptySlot);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTimetable(); }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await timetableApi.get();
      setTimetable(res.data.timetable);
    } catch { toast.error('Failed to load timetable'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditSlot(null); setForm(emptySlot); setShowModal(true); };
  const openEdit = (slot: Slot) => { setEditSlot(slot); setForm({ ...slot }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.subject.trim()) return toast.error('Subject is required');
    setSaving(true);
    try {
      if (editSlot) {
        const res = await timetableApi.updateSlot(editSlot._id, form);
        setTimetable(res.data.timetable);
        toast.success('Slot updated!');
      } else {
        const res = await timetableApi.addSlot(form);
        setTimetable(res.data.timetable);
        toast.success('Slot added!');
      }
      setShowModal(false);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (slotId: string) => {
    try {
      const res = await timetableApi.deleteSlot(slotId);
      setTimetable(res.data.timetable);
      toast.success('Slot removed');
    } catch { toast.error('Failed to delete'); }
  };

  const getSlotsForDay = (day: string): Slot[] =>
    (timetable?.slots || []).filter((s: Slot) => s.day === day).sort((a: Slot, b: Slot) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen size={26} style={{ color: '#6366f1' }} /> Timetable
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {timetable?.semester || 'Your weekly class schedule'}
          </p>
        </div>
        {canEdit && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Slot
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {DAYS.map((d) => <div key={d} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {DAYS.map((day, di) => (
            <motion.div key={day} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: di * 0.05 }}>
              <div className="glass-card p-3 h-full min-h-[200px]">
                <p className="text-xs font-bold uppercase tracking-wider mb-3 text-center"
                  style={{ color: 'var(--text-muted)' }}>{day.slice(0, 3)}</p>
                <div className="space-y-2">
                  {getSlotsForDay(day).map((slot) => (
                    <motion.div key={slot._id} layout
                      className="rounded-xl p-2.5 cursor-pointer group relative"
                      style={{ background: `${slot.color}20`, borderLeft: `3px solid ${slot.color}` }}
                      onClick={() => canEdit && openEdit(slot)}>
                      <p className="text-xs font-semibold truncate" style={{ color: slot.color }}>{slot.subject}</p>
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={10} /> {slot.startTime}–{slot.endTime}
                      </p>
                      {slot.room && (
                        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          <MapPin size={10} /> {slot.room}
                        </p>
                      )}
                      {canEdit && (
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(slot._id); }}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                          style={{ color: '#f87171' }}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                  {getSlotsForDay(day).length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No classes</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)} />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="glass-card p-6 w-full max-w-md relative"
                style={{ background: 'rgba(15,22,45,0.98)' }}
                onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowModal(false)} className="absolute top-4 right-4" style={{ color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
                <h2 className="text-lg font-bold mb-5">{editSlot ? 'Edit Slot' : 'Add Class Slot'}</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Day</label>
                      <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
                        {DAYS.map((d) => <option key={d} value={d} style={{ background: '#0f1629' }}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Type</label>
                      <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none capitalize"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
                        {SLOT_TYPES.map((t) => <option key={t} value={t} style={{ background: '#0f1629' }}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Subject *</label>
                    <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Data Structures" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Start Time</label>
                      <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>End Time</label>
                      <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Teacher</label>
                      <input value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                        placeholder="Prof. Name" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Room</label>
                      <input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}
                        placeholder="Lab-3 / A101" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {SLOT_COLORS.map((c) => (
                        <button key={c} onClick={() => setForm({ ...form, color: c })}
                          className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                          style={{ background: c, outline: form.color === c ? `2px solid white` : 'none', outlineOffset: '2px' }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                    {saving ? 'Saving...' : editSlot ? 'Update' : 'Add Slot'}
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
