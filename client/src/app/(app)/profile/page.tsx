'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { User, Edit3, Save, X, BookOpen, Briefcase, Award, Plus } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'AIDS', 'AIML', 'Other'];

const SUGGESTED_SKILLS = [
  'React', 'Node.js', 'Python', 'Java', 'C++', 'Machine Learning',
  'Data Science', 'Flutter', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL',
  'TypeScript', 'Next.js', 'Django', 'Spring Boot', 'Kotlin', 'Swift',
  'Blockchain', 'Cybersecurity', 'UI/UX', 'DevOps', 'GraphQL', 'Redis',
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    branch: user?.branch || 'CSE',
    year: user?.year || 1,
    linkedin: user?.linkedin || '',
    github: user?.github || '',
    skills: [...(user?.skills || [])],
    interests: [...(user?.interests || [])],
  });
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const startEdit = () => {
    setForm({
      name: user?.name || '',
      bio: user?.bio || '',
      branch: user?.branch || 'CSE',
      year: user?.year || 1,
      linkedin: user?.linkedin || '',
      github: user?.github || '',
      skills: [...(user?.skills || [])],
      interests: [...(user?.interests || [])],
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authApi.updateProfile({
        name: form.name,
        bio: form.bio,
        branch: form.branch,
        year: form.year,
        linkedIn: form.linkedin,
        github: form.github,
        skills: form.skills,
        interests: form.interests,
      });
      updateUser(res.data.user);
      setEditing(false);
      toast.success('Profile updated! ✨');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (!s || form.skills.includes(s)) return;
    setForm((prev) => ({ ...prev, skills: [...prev.skills, s] }));
    setNewSkill('');
  };

  const removeSkill = (skill: string) =>
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));

  const addInterest = () => {
    const s = newInterest.trim();
    if (!s || form.interests.includes(s)) return;
    setForm((prev) => ({ ...prev, interests: [...prev.interests, s] }));
    setNewInterest('');
  };

  const removeInterest = (i: string) =>
    setForm((prev) => ({ ...prev, interests: prev.interests.filter((x) => x !== i) }));

  const SKILL_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];
  const getSkillColor = (s: string) => SKILL_COLORS[s.charCodeAt(0) % SKILL_COLORS.length];

  const roleColors: Record<string, string> = {
    student: '#6366f1', faculty: '#06b6d4', admin: '#ef4444',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Account Overview</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2">
          <User size={26} className="text-indigo-400" /> My Profile
        </h1>
        <p className="text-xs text-slate-400 mt-1">Manage your public academic identity, skills, and interests.</p>
      </div>

      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="saas-card p-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center font-bold text-3xl text-white"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #06b6d4)' }}>
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                : user?.name?.[0]?.toUpperCase()
              }
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-slate-900"
              style={{ background: 'var(--color-success)' }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                id="profile-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field text-xl font-bold mb-2"
              />
            ) : (
              <h2 className="text-2xl font-extrabold text-white">{user?.name}</h2>
            )}
            <p className="text-xs text-slate-400 mb-2">
              {user?.rollNumber} · {user?.email}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="saas-badge" style={{ background: `${roleColors[user?.role || 'student']}20`, color: roleColors[user?.role || 'student'] }}>
                {user?.role?.replace('_', ' ')}
              </span>
              <span className="saas-badge saas-badge-indigo">{user?.branch}</span>
              {user?.year && <span className="saas-badge saas-badge-violet">Year {user.year}</span>}
            </div>
          </div>

          {/* Edit button */}
          <div className="flex gap-2">
            {editing ? (
              <>
                <button id="cancel-edit" onClick={() => setEditing(false)} className="btn-secondary py-2 px-3">
                  <X size={16} />
                </button>
                <button id="save-profile" onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} /> Save</>}
                </button>
              </>
            ) : (
              <button id="edit-profile" onClick={startEdit} className="btn-secondary flex items-center gap-2">
                <Edit3 size={15} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-5">
          {editing ? (
            <textarea
              id="profile-bio"
              rows={3}
              placeholder="Write a short bio about yourself..."
              className="input-field resize-none text-sm"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={300}
            />
          ) : (
            <p className="text-sm" style={{ color: user?.bio ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
              {user?.bio || 'No bio yet. Click Edit to add one.'}
            </p>
          )}
        </div>

        {/* Social links */}
        {editing && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="relative">
              <FaGithub size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input id="profile-github" type="url" placeholder="GitHub URL" className="input-field pl-9 text-sm"
                value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} />
            </div>
            <div className="relative">
              <FaLinkedin size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#0077b5' }} />
              <input id="profile-linkedin" type="url" placeholder="LinkedIn URL" className="input-field pl-9 text-sm"
                value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
            </div>
          </div>
        )}

        {/* Social link badges (view mode) */}
        {!editing && (user?.github || user?.linkedin) && (
          <div className="flex gap-3 mt-4">
            {user.github && (
              <a href={user.github} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
                <FaGithub size={15} /> GitHub
              </a>
            )}
            {user.linkedin && (
              <a href={user.linkedin} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm hover:opacity-80" style={{ color: '#0077b5' }}>
                <FaLinkedin size={15} /> LinkedIn
              </a>
            )}
          </div>
        )}

        {/* Branch / Year (editing) */}
        {editing && user?.role === 'student' && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Branch</label>
              <select id="profile-branch" className="input-field text-sm" value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Year</label>
              <select id="profile-year" className="input-field text-sm" value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}>
                {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>
        )}
      </motion.div>

      {/* Skills */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="saas-card p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Award size={18} style={{ color: '#f59e0b' }} /> Skills
        </h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {(editing ? form.skills : user?.skills || []).map((skill) => (
            <span key={skill} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
              style={{ background: `${getSkillColor(skill)}20`, color: getSkillColor(skill), border: `1px solid ${getSkillColor(skill)}30` }}>
              {skill}
              {editing && (
                <button onClick={() => removeSkill(skill)} className="hover:opacity-70">
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
          {!editing && (!user?.skills || user.skills.length === 0) && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No skills added. Click Edit to add your skills!</p>
          )}
        </div>

        {editing && (
          <>
            <div className="flex gap-2 mb-3">
              <input id="new-skill-input" type="text" placeholder="Add a skill..."
                className="input-field flex-1 text-sm" value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))} />
              <button id="add-skill-btn" onClick={() => addSkill(newSkill)} className="btn-primary px-4 py-2">
                <Plus size={16} />
              </button>
            </div>
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Suggested:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SKILLS.filter((s) => !form.skills.includes(s)).slice(0, 12).map((s) => (
                  <button key={s} onClick={() => addSkill(s)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-90"
                    style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary-light)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Interests */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="saas-card p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <BookOpen size={18} style={{ color: 'var(--color-accent)' }} /> Interests
        </h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {(editing ? form.interests : user?.interests || []).map((interest) => (
            <span key={interest} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold saas-badge-violet">
              {interest}
              {editing && (
                <button onClick={() => removeInterest(interest)} className="hover:opacity-70">
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
          {!editing && (!user?.interests || user.interests.length === 0) && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No interests listed.</p>
          )}
        </div>
        {editing && (
          <div className="flex gap-2">
            <input id="new-interest-input" type="text" placeholder="Add an interest (e.g. Open Source, Robotics)..."
              className="input-field flex-1 text-sm" value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())} />
            <button id="add-interest-btn" onClick={addInterest} className="btn-primary px-4 py-2">
              <Plus size={16} />
            </button>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="saas-card p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Briefcase size={18} style={{ color: 'var(--color-primary)' }} /> Activity
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Connections', value: user?.connections?.length || 0 },
            { label: 'Skills', value: user?.skills?.length || 0 },
            { label: 'Interests', value: user?.interests?.length || 0 },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)' }}>
              <p className="text-2xl font-bold gradient-text">{value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
