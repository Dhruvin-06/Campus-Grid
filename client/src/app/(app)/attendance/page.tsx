'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { attendanceApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, CheckCircle, AlertTriangle, BookOpen, Calendar } from 'lucide-react';

const SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

interface SubjectAtt {
  _id: string;
  subject: string;
  teacher: string;
  totalClasses: number;
  attendedClasses: number;
  records: any[];
}

export default function AttendancePage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'faculty';
  const [semester, setSemester] = useState(user?.year ? `Semester ${(user.year - 1) * 2 + 1}` : 'Semester 1');
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showLogModal, setShowLogModal] = useState<SubjectAtt | null>(null);
  const [subjectForm, setSubjectForm] = useState({ subject: '', teacher: '' });
  const [logForm, setLogForm] = useState({ date: new Date().toISOString().split('T')[0], status: 'present', note: '' });

  useEffect(() => { fetchAttendance(); }, [semester]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.get(semester);
      setAttendance(res.data.attendance);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  const addSubject = async () => {
    if (!subjectForm.subject.trim()) return toast.error('Subject name required');
    try {
      const res = await attendanceApi.addSubject({ semester, ...subjectForm });
      setAttendance(res.data.attendance);
      setSubjectForm({ subject: '', teacher: '' });
      setShowAddSubject(false);
      toast.success('Subject added!');
    } catch { toast.error('Failed to add'); }
  };

  const logAttendance = async () => {
    if (!showLogModal) return;
    try {
      const res = await attendanceApi.logAttendance(showLogModal._id, { semester, ...logForm });
      setAttendance(res.data.attendance);
      setShowLogModal(null);
      toast.success('Logged!');
    } catch { toast.error('Failed to log'); }
  };

  const removeSubject = async (id: string) => {
    if (!confirm('Remove this subject?')) return;
    try {
      const res = await attendanceApi.removeSubject(id, semester);
      setAttendance(res.data.attendance);
      toast.success('Subject removed');
    } catch { toast.error('Failed'); }
  };

  const getPercentage = (subj: SubjectAtt) => {
    if (subj.totalClasses === 0) return 0;
    return Math.round((subj.attendedClasses / subj.totalClasses) * 100);
  };

  const getColor = (pct: number) => pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';

  const subjects: SubjectAtt[] = attendance?.subjects || [];
  const overallPct = subjects.length > 0
    ? Math.round(subjects.reduce((sum, s) => sum + getPercentage(s), 0) / subjects.length)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle size={26} style={{ color: '#10b981' }} /> Attendance Tracker
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Track your class attendance per subject</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={semester} onChange={(e) => setSemester(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
            {SEMESTERS.map((s) => <option key={s} value={s} style={{ background: '#0f1629' }}>{s}</option>)}
          </select>
          {canEdit && (
            <button onClick={() => setShowAddSubject(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add Subject
            </button>
          )}
        </div>
      </div>

      {/* Overall summary */}
      {subjects.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">Overall Attendance</p>
            <span className="text-2xl font-bold" style={{ color: getColor(overallPct) }}>{overallPct}%</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }} animate={{ width: `${overallPct}%` }} transition={{ duration: 0.8 }}
              style={{ background: getColor(overallPct) }} />
          </div>
          {overallPct < 75 && (
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#f59e0b' }}>
              <AlertTriangle size={12} /> Below 75% — Attendance shortage risk
            </p>
          )}
        </div>
      )}

      {/* Subject cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold mb-2">No subjects yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Add your subjects to start tracking attendance</p>
          {canEdit && (
            <button onClick={() => setShowAddSubject(true)} className="btn-primary">
              <Plus size={15} className="inline mr-2" /> Add First Subject
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {subjects.map((subj, i) => {
            const pct = getPercentage(subj);
            const color = getColor(pct);
            const classesNeeded = pct < 75 && subj.totalClasses > 0
              ? Math.ceil((0.75 * subj.totalClasses - subj.attendedClasses) / 0.25)
              : 0;
            return (
              <motion.div key={subj._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="glass-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{subj.subject}</p>
                    {subj.teacher && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subj.teacher}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold" style={{ color }}>{pct}%</span>
                    {canEdit && (
                      <button onClick={() => removeSubject(subj._id)} className="p-1 rounded-lg transition-colors hover:bg-red-500/10"
                        style={{ color: '#f87171' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.07 }}
                    style={{ background: color }} />
                </div>
                <div className="flex items-center justify-between text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  <span>{subj.attendedClasses}/{subj.totalClasses} classes</span>
                  {pct < 75 && classesNeeded > 0
                    ? <span style={{ color: '#f59e0b' }}>⚠️ Need {classesNeeded} more present</span>
                    : <span style={{ color: '#10b981' }}>✓ Safe</span>}
                </div>
                {canEdit && (
                  <button onClick={() => { setShowLogModal(subj); setLogForm({ date: new Date().toISOString().split('T')[0], status: 'present', note: '' }); }}
                    className="w-full py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--color-primary-light)', border: '1px solid rgba(99,102,241,0.25)' }}>
                    <Calendar size={13} /> Log Today's Class
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Subject Modal */}
      <AnimatePresence>
        {showAddSubject && (
          <>
            <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddSubject(false)} />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="glass-card p-6 w-full max-w-sm relative" style={{ background: 'rgba(15,22,45,0.98)' }}
                onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowAddSubject(false)} className="absolute top-4 right-4" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
                <h2 className="text-lg font-bold mb-4">Add Subject</h2>
                <div className="space-y-3">
                  <input value={subjectForm.subject} onChange={(e) => setSubjectForm({ ...subjectForm, subject: e.target.value })}
                    placeholder="Subject Name *" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  <input value={subjectForm.teacher} onChange={(e) => setSubjectForm({ ...subjectForm, teacher: e.target.value })}
                    placeholder="Teacher Name (optional)" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAddSubject(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={addSubject} className="btn-primary flex-1">Add</button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Log Attendance Modal */}
      <AnimatePresence>
        {showLogModal && (
          <>
            <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLogModal(null)} />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="glass-card p-6 w-full max-w-sm relative" style={{ background: 'rgba(15,22,45,0.98)' }}
                onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowLogModal(null)} className="absolute top-4 right-4" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
                <h2 className="text-lg font-bold mb-1">Log Attendance</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{showLogModal.subject}</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Date</label>
                    <input type="date" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                  </div>
                  <div className="flex gap-2">
                    {['present', 'absent', 'late'].map((s) => (
                      <button key={s} onClick={() => setLogForm({ ...logForm, status: s })}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
                        style={{
                          background: logForm.status === s
                            ? s === 'present' ? '#10b981' : s === 'absent' ? '#ef4444' : '#f59e0b'
                            : 'rgba(255,255,255,0.06)',
                          color: logForm.status === s ? 'white' : 'var(--text-secondary)',
                        }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowLogModal(null)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={logAttendance} className="btn-primary flex-1">Log</button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
