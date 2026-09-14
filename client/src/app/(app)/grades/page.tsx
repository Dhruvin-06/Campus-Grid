'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { gradesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, TrendingUp, Award, ChevronDown, ChevronUp, Save } from 'lucide-react';

const SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];
const GRADES = ['O', 'A+', 'A', 'B+', 'B', 'C', 'F', '-'];
const GRADE_COLORS: Record<string, string> = {
  O: '#10b981', 'A+': '#06b6d4', A: '#6366f1', 'B+': '#8b5cf6',
  B: '#f59e0b', C: '#f97316', F: '#ef4444', '-': '#6b7280',
};
const GRADE_POINTS: Record<string, number> = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, F: 0, '-': 0 };

interface Subject {
  name: string; code: string; credits: number; grade: string; internalMarks: number; externalMarks: number;
}
interface GradeRecord { semester: string; year: number; subjects: Subject[]; sgpa: number; cgpa: number; _id?: string; }

const blankSubject = (): Subject => ({ name: '', code: '', credits: 3, grade: '-', internalMarks: 0, externalMarks: 0 });

export default function GradesPage() {
  const [records, setRecords] = useState<GradeRecord[]>([]);
  const [cgpa, setCgpa] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeSem, setActiveSem] = useState('Semester 1');
  const [editing, setEditing] = useState<GradeRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await gradesApi.getAll();
      setRecords(res.data.records || []);
      setCgpa(res.data.cgpa || 0);
    } catch { toast.error('Failed to load grades'); }
    finally { setLoading(false); }
  };

  const startEdit = async (sem: string) => {
    try {
      const res = await gradesApi.getSemester(sem);
      const rec = res.data.record;
      setEditing({ ...rec, semester: sem, subjects: rec.subjects?.length ? rec.subjects : [blankSubject()] });
      setActiveSem(sem);
    } catch { toast.error('Failed'); }
  };

  const computeSGPA = (subjects: Subject[]) => {
    const valid = subjects.filter((s) => s.grade !== '-');
    const totalCred = valid.reduce((sum, s) => sum + Number(s.credits), 0);
    const weighted = valid.reduce((sum, s) => sum + Number(s.credits) * (GRADE_POINTS[s.grade] ?? 0), 0);
    return totalCred > 0 ? Math.round((weighted / totalCred) * 100) / 100 : 0;
  };

  const saveRecord = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await gradesApi.upsert({ semester: editing.semester, year: editing.year, subjects: editing.subjects });
      toast.success('Grades saved!');
      setEditing(null);
      fetchAll();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const deleteRecord = async (sem: string) => {
    if (!confirm(`Delete ${sem}?`)) return;
    try {
      await gradesApi.deleteSemester(sem);
      toast.success('Deleted');
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const updateSubject = (idx: number, field: keyof Subject, val: any) => {
    if (!editing) return;
    const updated = [...editing.subjects];
    (updated[idx] as any)[field] = val;
    setEditing({ ...editing, subjects: updated });
  };

  const getCgpaColor = (c: number) => c >= 8.5 ? '#10b981' : c >= 7 ? '#06b6d4' : c >= 6 ? '#f59e0b' : '#ef4444';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp size={26} style={{ color: '#06b6d4' }} /> CGPA Tracker
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Track grades & calculate CGPA across semesters</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={activeSem} onChange={(e) => setActiveSem(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
            {SEMESTERS.map((s) => <option key={s} value={s} style={{ background: '#0f1629' }}>{s}</option>)}
          </select>
          <button onClick={() => startEdit(activeSem)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> {records.find((r) => r.semester === activeSem) ? 'Edit' : 'Add'} Semester
          </button>
        </div>
      </div>

      {/* CGPA Showcase */}
      {records.length > 0 && (
        <div className="glass-card p-6 flex items-center gap-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at right, rgba(6,182,212,0.08) 0%, transparent 60%)' }} />
          <div className="relative">
            <svg width={100} height={100} viewBox="0 0 100 100" className="rotate-[-90deg]">
              <circle cx={50} cy={50} r={42} fill="none" strokeWidth={8} stroke="rgba(255,255,255,0.07)" />
              <circle cx={50} cy={50} r={42} fill="none" strokeWidth={8}
                stroke={getCgpaColor(cgpa)}
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - cgpa / 10)}`}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
              <span className="text-2xl font-bold" style={{ color: getCgpaColor(cgpa) }}>{cgpa.toFixed(2)}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>CGPA</span>
            </div>
          </div>
          <div>
            <p className="text-xl font-bold">{cgpa >= 9 ? '🏆 Outstanding' : cgpa >= 8 ? '⭐ Excellent' : cgpa >= 7 ? '👍 Good' : cgpa >= 6 ? '📈 Average' : '📚 Needs Work'}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{records.length} semester{records.length !== 1 ? 's' : ''} recorded</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {records.map((r) => (
                <span key={r.semester} className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--color-primary-light)' }}>
                  {r.semester.replace('Semester ', 'S')}: {r.sgpa}
                </span>
              ))}
            </div>
          </div>
          <Award size={80} className="absolute right-6 opacity-5 hidden md:block" />
        </div>
      )}

      {/* Semester Records */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : records.length === 0 && !editing ? (
        <div className="glass-card p-12 text-center">
          <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold mb-2">No grade records yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Start by adding your first semester grades</p>
          <button onClick={() => startEdit('Semester 1')} className="btn-primary">Add Semester 1</button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec, ri) => (
            <motion.div key={rec.semester} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ri * 0.05 }}
              className="glass-card overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setExpanded(expanded === rec.semester ? null : rec.semester)}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <span className="text-lg font-bold" style={{ color: '#6366f1' }}>{rec.sgpa}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>SGPA</span>
                  </div>
                  <div>
                    <p className="font-semibold">{rec.semester}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{rec.subjects?.length || 0} subjects</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(rec.semester); }}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--color-primary-light)' }}>
                    Edit
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteRecord(rec.semester); }}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                    <Trash2 size={13} />
                  </button>
                  {expanded === rec.semester ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>
              {expanded === rec.semester && rec.subjects?.length > 0 && (
                <div className="border-t overflow-x-auto" style={{ borderColor: 'var(--border-glass)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.03)' }}>
                        {['Subject', 'Credits', 'Int.', 'Ext.', 'Grade', 'GP'].map((h) => (
                          <th key={h} className="px-4 py-2 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rec.subjects.map((s, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="px-4 py-2 font-medium">{s.name} {s.code && <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>({s.code})</span>}</td>
                          <td className="px-4 py-2">{s.credits}</td>
                          <td className="px-4 py-2">{s.internalMarks}</td>
                          <td className="px-4 py-2">{s.externalMarks}</td>
                          <td className="px-4 py-2">
                            <span className="text-xs px-2 py-0.5 rounded-lg font-bold" style={{ background: `${GRADE_COLORS[s.grade]}20`, color: GRADE_COLORS[s.grade] }}>{s.grade}</span>
                          </td>
                          <td className="px-4 py-2 font-semibold">{GRADE_POINTS[s.grade] ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Inline Editor */}
      {editing && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{editing.semester} — Enter Grades</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm px-3 py-1 rounded-lg font-semibold"
                style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
                SGPA: {computeSGPA(editing.subjects)}
              </span>
            </div>
          </div>
          <div className="space-y-2 mb-4">
            {editing.subjects.map((subj, idx) => (
              <div key={idx} className="flex gap-2 items-center flex-wrap">
                <input value={subj.name} onChange={(e) => updateSubject(idx, 'name', e.target.value)}
                  placeholder="Subject name *" className="flex-1 min-w-[140px] px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                <input value={subj.code} onChange={(e) => updateSubject(idx, 'code', e.target.value)}
                  placeholder="Code" className="w-20 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                <input type="number" min={1} max={6} value={subj.credits} onChange={(e) => updateSubject(idx, 'credits', Number(e.target.value))}
                  placeholder="Cred" className="w-16 px-2 py-2 rounded-xl text-sm outline-none text-center"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }} />
                <select value={subj.grade} onChange={(e) => updateSubject(idx, 'grade', e.target.value)}
                  className="w-20 px-2 py-2 rounded-xl text-sm outline-none text-center font-bold"
                  style={{ background: `${GRADE_COLORS[subj.grade]}20`, border: `1px solid ${GRADE_COLORS[subj.grade]}50`, color: GRADE_COLORS[subj.grade] }}>
                  {GRADES.map((g) => <option key={g} value={g} style={{ background: '#0f1629', color: GRADE_COLORS[g] }}>{g}</option>)}
                </select>
                <button onClick={() => { const subs = [...editing.subjects]; subs.splice(idx, 1); setEditing({ ...editing, subjects: subs }); }}
                  className="p-2 rounded-xl" style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing({ ...editing, subjects: [...editing.subjects, blankSubject()] })}
              className="btn-secondary flex items-center gap-2">
              <Plus size={15} /> Add Subject
            </button>
            <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
            <button onClick={saveRecord} disabled={saving} className="btn-primary flex items-center gap-2 ml-auto">
              <Save size={15} /> {saving ? 'Saving...' : 'Save Grades'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
