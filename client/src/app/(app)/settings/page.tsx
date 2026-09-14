'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, usersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  User, Lock, Bell, Palette, Shield, Camera, Save,
  Eye, EyeOff, CheckCircle, AlertTriangle, LogOut,
  ChevronRight, Trash2, Download, Moon, Sun, Monitor,
} from 'lucide-react';

const TABS = [
  { id: 'profile',   label: 'Profile',   icon: User },
  { id: 'security',  label: 'Security',  icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account',   label: 'Account',   icon: Shield },
] as const;

type Tab = typeof TABS[number]['id'];

const BRANCHES = ['CSE','ECE','ME','CE','EEE','IT','AIDS','AIML','Other'];
const YEARS    = [1, 2, 3, 4];
const SKILLS_LIST = [
  'React','Node.js','Python','Java','C++','ML/AI','Data Science',
  'UI/UX','DevOps','Cloud','Android','iOS','Blockchain','Cybersecurity',
  'DSA','DBMS','Computer Networks','Mathematics',
];

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>('profile');

  // Profile form
  const [profile, setProfile] = useState({
    name: '', bio: '', branch: '', year: 1,
    phone: '', linkedin: '', github: '', portfolio: '',
    skills: [] as string[], interests: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    emailAnnouncements: true,
    emailJobs: true,
    emailMessages: true,
    browserNotifications: false,
  });

  // Appearance
  const [theme, setTheme] = useState<'dark' | 'system'>('dark');
  const [accentColor, setAccentColor] = useState('#6366f1');

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const ACCENT_COLORS = [
    '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#8b5cf6', '#ec4899', '#f97316',
  ];

  useEffect(() => {
    if (user) {
      setProfile({
        name:        user.name || '',
        bio:         user.bio || '',
        branch:      user.branch || '',
        year:        user.year || 1,
        phone:       user.phone || '',
        linkedin:    user.linkedin || '',
        github:      user.github || '',
        portfolio:   user.portfolio || '',
        skills:      user.skills || [],
        interests:   (user.interests || []).join(', '),
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const toggleSkill = (skill: string) => {
    setProfile((p) => ({
      ...p,
      skills: p.skills.includes(skill) ? p.skills.filter((s) => s !== skill) : [...p.skills, skill],
    }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Max 5 MB');

    const reader = new FileReader();
    reader.onload = (r) => setAvatarPreview(r.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await usersApi.updateAvatar(fd);
      if (res.data?.user) updateUser(res.data.user);
      toast.success('Avatar updated!');
    } catch { toast.error('Upload failed'); setAvatarPreview(user?.avatar || null); }
    finally { setUploadingAvatar(false); }
  };

  const saveProfile = async () => {
    if (!profile.name.trim()) return toast.error('Name is required');
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({
        ...profile,
        interests: profile.interests.split(',').map((s) => s.trim()).filter(Boolean),
      });
      if (res.data?.user) updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to save'); }
    finally { setSavingProfile(false); }
  };

  const changePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error('All fields required');
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Min 6 characters');
    setSavingPw(true);
    try {
      await authApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Incorrect current password'); }
    finally { setSavingPw(false); }
  };

  const pwStrength = (pw: string) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)         s++;
    if (/[A-Z]/.test(pw))       s++;
    if (/[0-9]/.test(pw))       s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength = pwStrength(pwForm.newPassword);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#06b6d4', '#10b981'][strength];

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield size={26} style={{ color: 'var(--color-primary)' }} /> Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage your account, security and preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">

        {/* ── Sidebar Tabs ── */}
        <div className="md:w-52 flex-shrink-0">
          <div className="glass-card p-2 space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} id={`settings-tab-${id}`} onClick={() => setTab(id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
                style={{
                  background: tab === id ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.1))' : 'transparent',
                  color: tab === id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderLeft: tab === id ? '2px solid #6366f1' : '2px solid transparent',
                }}>
                <Icon size={16} style={{ color: tab === id ? '#6366f1' : 'var(--text-muted)' }} />
                {label}
                {tab === id && <ChevronRight size={14} className="ml-auto" style={{ color: '#6366f1' }} />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content Panel ── */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

              {/* ═══════════ PROFILE ═══════════ */}
              {tab === 'profile' && (
                <div className="space-y-5">
                  {/* Avatar */}
                  <div className="glass-card p-6">
                    <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                      <User size={18} style={{ color: '#6366f1' }} /> Profile Picture
                    </h2>
                    <div className="flex items-center gap-5">
                      <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden"
                          style={{ boxShadow: '0 0 0 2px rgba(99,102,241,0.3)' }}>
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                              style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                              {user.name?.[0]}
                            </div>
                          )}
                        </div>
                        {uploadingAvatar && (
                          <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(0,0,0,0.6)' }}>
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">{user.name}</p>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                          {user.rollNumber} · {user.branch} · {user.role}
                        </p>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        <button onClick={() => fileRef.current?.click()}
                          className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                          <Camera size={14} /> Change Photo
                        </button>
                        <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>JPG, PNG up to 5 MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="glass-card p-6 space-y-4">
                    <h2 className="font-bold text-base flex items-center gap-2">
                      <User size={18} style={{ color: '#06b6d4' }} /> Basic Information
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Full Name *</label>
                        <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          placeholder="Your full name"
                          className="w-full px-3 py-2.5 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Phone</label>
                        <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          placeholder="+91 9999999999"
                          className="w-full px-3 py-2.5 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Branch</label>
                        <select value={profile.branch} onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl text-sm">
                          <option value="">Select branch</option>
                          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Year</label>
                        <select value={profile.year} onChange={(e) => setProfile({ ...profile, year: Number(e.target.value) })}
                          className="w-full px-3 py-2.5 rounded-xl text-sm">
                          {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Bio</label>
                      <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        placeholder="Tell others about yourself..." rows={3}
                        className="w-full px-3 py-2.5 rounded-xl text-sm resize-none" />
                      <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>{profile.bio.length}/300</p>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="glass-card p-6 space-y-4">
                    <h2 className="font-bold text-base flex items-center gap-2">
                      🔗 Social Links
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { key: 'linkedin',  label: 'LinkedIn URL',  ph: 'https://linkedin.com/in/...' },
                        { key: 'github',    label: 'GitHub URL',    ph: 'https://github.com/...' },
                        { key: 'portfolio', label: 'Portfolio URL', ph: 'https://yoursite.com' },
                      ].map(({ key, label, ph }) => (
                        <div key={key}>
                          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
                          <input value={(profile as any)[key]} onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                            placeholder={ph} className="w-full px-3 py-2.5 rounded-xl text-sm" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="glass-card p-6 space-y-4">
                    <h2 className="font-bold text-base flex items-center gap-2">
                      ⚡ Skills & Interests
                    </h2>
                    <div>
                      <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
                        Skills (select all that apply)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SKILLS_LIST.map((skill) => (
                          <button key={skill} onClick={() => toggleSkill(skill)}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                            style={{
                              background: profile.skills.includes(skill) ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                              color: profile.skills.includes(skill) ? 'var(--color-primary-light)' : 'var(--text-muted)',
                              border: `1px solid ${profile.skills.includes(skill) ? 'rgba(99,102,241,0.4)' : 'var(--border-glass)'}`,
                            }}>
                            {profile.skills.includes(skill) ? '✓ ' : ''}{skill}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                        Interests (comma separated)
                      </label>
                      <input value={profile.interests} onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                        placeholder="e.g. Open Source, Robotics, Finance"
                        className="w-full px-3 py-2.5 rounded-xl text-sm" />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={saveProfile} disabled={savingProfile}
                      className="btn-primary flex items-center gap-2 px-8">
                      <Save size={15} /> {savingProfile ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              )}

              {/* ═══════════ SECURITY ═══════════ */}
              {tab === 'security' && (
                <div className="space-y-5">
                  <div className="glass-card p-6 space-y-5">
                    <h2 className="font-bold text-base flex items-center gap-2">
                      <Lock size={18} style={{ color: '#ef4444' }} /> Change Password
                    </h2>

                    {/* Current */}
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Current Password</label>
                      <div className="relative">
                        <input type={showPw.current ? 'text' : 'password'} value={pwForm.currentPassword}
                          onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                          className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm" />
                        <button onClick={() => setShowPw({ ...showPw, current: !showPw.current })}
                          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                          {showPw.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* New */}
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>New Password</label>
                      <div className="relative">
                        <input type={showPw.new ? 'text' : 'password'} value={pwForm.newPassword}
                          onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                          placeholder="Min 6 characters"
                          className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm" />
                        <button onClick={() => setShowPw({ ...showPw, new: !showPw.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                          {showPw.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {/* Strength bar */}
                      {pwForm.newPassword && (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="h-1 flex-1 rounded-full transition-all"
                                style={{ background: i <= strength ? strengthColor : 'rgba(255,255,255,0.1)' }} />
                            ))}
                          </div>
                          <p className="text-xs" style={{ color: strengthColor }}>{strengthLabel}</p>
                        </div>
                      )}
                    </div>

                    {/* Confirm */}
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Confirm Password</label>
                      <div className="relative">
                        <input type={showPw.confirm ? 'text' : 'password'} value={pwForm.confirmPassword}
                          onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                          placeholder="Repeat new password"
                          className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm" />
                        <button onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                          {showPw.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444' }}>
                          <AlertTriangle size={11} /> Passwords don't match
                        </p>
                      )}
                      {pwForm.confirmPassword && pwForm.newPassword === pwForm.confirmPassword && pwForm.newPassword && (
                        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#10b981' }}>
                          <CheckCircle size={11} /> Passwords match
                        </p>
                      )}
                    </div>

                    <button onClick={changePassword} disabled={savingPw}
                      className="btn-primary flex items-center gap-2">
                      <Lock size={15} /> {savingPw ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>

                  {/* Active Sessions info */}
                  <div className="glass-card p-6">
                    <h2 className="font-bold text-base mb-3 flex items-center gap-2">
                      <Monitor size={18} style={{ color: '#8b5cf6' }} /> Account Info
                    </h2>
                    <div className="space-y-3 text-sm">
                      {[
                        { label: 'Email', value: user.email },
                        { label: 'Roll Number', value: user.rollNumber },
                        { label: 'Role', value: user.role },
                        { label: 'Member Since', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-2"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════ NOTIFICATIONS ═══════════ */}
              {tab === 'notifications' && (
                <div className="space-y-5">
                  <div className="glass-card p-6 space-y-1">
                    <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                      <Bell size={18} style={{ color: '#f59e0b' }} /> Notification Preferences
                    </h2>
                    {[
                      { key: 'emailAnnouncements', label: 'Announcements', desc: 'Campus announcements and news' },
                      { key: 'emailJobs',          label: 'Job Alerts',    desc: 'New placement & internship opportunities' },
                      { key: 'emailMessages',      label: 'Messages',      desc: 'When you receive a new message' },
                      { key: 'browserNotifications', label: 'Browser Push', desc: 'Real-time browser notifications' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-4"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                        </div>
                        {/* Toggle Switch */}
                        <button onClick={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                          className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
                          style={{ background: (notifPrefs as any)[key] ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)' }}>
                          <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform"
                            style={{ left: (notifPrefs as any)[key] ? '22px' : '2px' }} />
                        </button>
                      </div>
                    ))}
                    <div className="pt-4">
                      <button onClick={() => toast.success('Notification preferences saved!')}
                        className="btn-primary flex items-center gap-2">
                        <Save size={15} /> Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════ ACCOUNT ═══════════ */}
              {tab === 'account' && (
                <div className="space-y-5">
                  {/* Data export */}
                  <div className="glass-card p-6">
                    <h2 className="font-bold text-base mb-1 flex items-center gap-2">
                      <Download size={18} style={{ color: '#06b6d4' }} /> Export Your Data
                    </h2>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                      Download a copy of your CampusGrid profile data.
                    </p>
                    <button onClick={() => {
                      const data = JSON.stringify({ user, exportedAt: new Date().toISOString() }, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url;
                      a.download = `campusgrid-${user.rollNumber}-data.json`; a.click();
                      URL.revokeObjectURL(url);
                      toast.success('Data exported!');
                    }} className="btn-secondary flex items-center gap-2">
                      <Download size={15} /> Export as JSON
                    </button>
                  </div>

                  {/* Sign out */}
                  <div className="glass-card p-6">
                    <h2 className="font-bold text-base mb-1 flex items-center gap-2">
                      <LogOut size={18} style={{ color: '#f59e0b' }} /> Sign Out
                    </h2>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                      Sign out from your current session on this device.
                    </p>
                    <button onClick={logout}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="glass-card p-6" style={{ border: '1px solid rgba(239,68,68,0.25)' }}>
                    <h2 className="font-bold text-base mb-1 flex items-center gap-2" style={{ color: '#ef4444' }}>
                      <AlertTriangle size={18} /> Danger Zone
                    </h2>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                      Once you delete your account, all data will be permanently removed. This action cannot be undone.
                    </p>
                    <button onClick={() => toast.error('Please contact admin to delete your account.')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <Trash2 size={15} /> Delete Account
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
