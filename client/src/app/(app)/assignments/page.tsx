'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { assignmentsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, Clock, AlertTriangle, CheckCircle2, Circle, Loader } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';

type Status = 'todo' | 'in_progress' | 'done';
type Priority = 'low' | 'medium' | 'high';

interface Assignment {
  _id: string; title: string; description: string; subject: string;
  dueDate: string; priority: Priority; status: Status; tags: string[];
}

const COLUMNS: { id: Status; label: string; icon: any; color: string }[] = [
  { id: 'todo', label: 'To Do', icon: Circle, color: '#6366f1' },
  { id: 'in_progress', label: 'In Progress', icon: Loader, color: '#f59e0b' },
  { id: 'done', label: 'Done', icon: CheckCircle2, color: '#10b981' },
];

const PRIORITY_COLORS: Record<Priority, string> = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };

const emptyForm = { title: '', description: '', subject: '', dueDate: '', priority: 'medium' as Priority, tags: '' };

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await assignmentsApi.getAll();
      setAssignments(res.data.assignments || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const createAssignment = async () => {
    if (!form.title.trim()) return toast.error('Title required');
    try {
      const res = await assignmentsApi.create({
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setAssignments((prev) => [res.data.assignment, ...prev]);
      setShowModal(false);
      setForm(emptyForm);
      toast.success('Assignment added!');
    } catch { toast.error('Failed to create'); }
  };

  const moveAssignment = async (id: string, newStatus: Status) => {
    setAssignments((prev) => prev.map((a) => a._id === id ? { ...a, status: newStatus } : a));
    try {
      await assignmentsApi.update(id, { status: newStatus });
    } catch { toast.error('Failed to update'); fetchAll(); }
  };

  const deleteAssignment = async (id: string) => {
    setAssignments((prev) => prev.filter((a) => a._id !== id));
    try {
      await assignmentsApi.delete(id);
      toast.success('Deleted');
    } catch { toast.error('Failed'); fetchAll(); }
  };

  const getCol = (status: Status) => assignments.filter((a) => a.status === status);

  const handleDragStart = (id: string) => setDragging(id);
  const handleDrop = (status: Status) => {
    if (dragging) moveAssignment(dragging, status);
    setDragging(null);
    setDragOver(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle2 size={26} style={{ color: '#10b981' }} /> Assignment Tracker
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Drag cards between columns to update status</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Assignment
        </button>
      </div>

      {/* Stats bar */}
      {!loading && (
        <div className="flex gap-3 flex-wrap">
          {COLUMNS.map((col) => (
            <div key={col.id} className="glass-card px-4 py-2 flex items-center gap-2">
              <col.icon size={14} style={{ color: col.color }} />
              <span className="text-sm font-semibold" style={{ color: col.color }}>{getCol(col.id).length}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{col.label}</span>
            </div>
          ))}
          {assignments.filter((a) => a.status !== 'done' && a.dueDate && isPast(new Date(a.dueDate))).length > 0 && (
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: '#ef4444' }} />
              <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                {assignments.filter((a) => a.status !== 'done' && a.dueDate && isPast(new Date(a.dueDate))).length}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Overdue</span>
            </div>
          )}
        </div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-64 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COLUMNS.map((col) => (
            <div key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
              onDrop={() => handleDrop(col.id)}
              onDragLeave={() => setDragOver(null)}
              className="rounded-2xl p-1 transition-all min-h-[400px]"
              style={{ background: dragOver === col.id ? `${col.color}10` : 'transparent', border: `1px solid ${dragOver === col.id ? col.color + '40' : 'transparent'}` }}>
              {/* Column Header */}
              <div className="flex items-center gap-2 px-3 py-2 mb-3">
                <col.icon size={16} style={{ color: col.color }} />
                <span className="font-semibold text-sm">{col.label}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: `${col.color}20`, color: col.color }}>{getCol(col.id).length}</span>
              </div>
              {/* Cards */}
              <div className="space-y-3 px-1">
                <AnimatePresence>
                  {getCol(col.id).map((a) => {
                    const isOverdue = a.status !== 'done' && a.dueDate && isPast(new Date(a.dueDate));
                    return (
                      <motion.div key={a._id} layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        draggable
                        onDragStart={() => handleDragStart(a._id)}
                        className="glass-card p-4 cursor-grab active:cursor-grabbing group relative"
                        style={{ borderLeft: `3px solid ${PRIORITY_COLORS[a.priority]}` }}>
                        <button onClick={() => deleteAssignment(a._id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
                          style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)' }}>
                          <Trash2 size={12} />
                        </button>
                        <p className="font-semibold text-sm pr-6 mb-1">{a.title}</p>
                        {a.subject && <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{a.subject}</p>}
                        {a.description && <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{a.description}</p>}
                        <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                            style={{ background: `${PRIORITY_COLORS[a.priority]}20`, color: PRIORITY_COLORS[a.priority] }}>
                            {a.priority}
                          </span>
                          {a.dueDate && (
                            <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}
                              style={!isOverdue ? { color: 'var(--text-muted)' } : {}}>
                              <Clock size={10} />
                              {isOverdue ? '⚠️ ' : ''}{formatDistanceToNow(new Date(a.dueDate), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        {a.tags?.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {a.tags.map((t) => (
                              <span key={t} className="text-xs px-1.5 py-0.5 rounded-md"
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>#{t}</span>
                            ))}
                          </div>
                        )}
                        {/* Quick status buttons */}
                        <div className="flex gap-1 mt-3">
                          {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                            <button key={c.id} onClick={() => moveAssignment(a._id, c.id)}
                              className="text-xs px-2 py-1 rounded-lg flex-1 text-center transition-all"
                              style={{ background: `${c.color}15`, color: c.color }}>
                              → {c.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {getCol(col.id).length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed"
                    style={{ borderColor: `${col.color}20` }}>
                    <col.icon size={24} style={{ color: `${col.color}40` }} />
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Drop here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)} />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="glass-card p-6 w-full max-w-md relative" style={{ background: 'rgba(15,22,45,0.98)' }}
                onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowModal(false)} className="absolute top-4 right-4" style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
                <h2 className="text-lg font-bold mb-5">New Assignment</h2>
                <div className="space-y-3">
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Title *" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Subject" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Description (optional)" rows={3}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Due Date</label>
                      <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Priority</label>
                      <div className="flex gap-1">
                        {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                          <button key={p} onClick={() => setForm({ ...form, priority: p })}
                            className="flex-1 py-2 rounded-xl text-xs capitalize font-semibold transition-all"
                            style={{ background: form.priority === p ? PRIORITY_COLORS[p] : `${PRIORITY_COLORS[p]}20`, color: form.priority === p ? 'white' : PRIORITY_COLORS[p] }}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="Tags (comma separated: math, exam, project)"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={createAssignment} className="btn-primary flex-1">Create</button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
