'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { GraduationCap, User, Mail, Lock, Hash, ArrowRight, Eye, EyeOff } from 'lucide-react';

const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'AIDS', 'AIML', 'Other'];
const ROLES = [
  { value: 'student', label: '🎓 Student' },
  { value: 'faculty', label: '👨‍🏫 Faculty' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', rollNumber: '', password: '',
    confirmPassword: '', role: 'student', branch: 'CSE', year: 1,
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: string, val: any) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        rollNumber: form.rollNumber,
        password: form.password,
        role: form.role,
        branch: form.branch,
        year: form.role === 'student' ? form.year : undefined,
      });
      toast.success('Account created! Welcome to CampusGrid 🎉');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/5 w-80 h-80 rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/5 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      </div>

      <div className="w-full max-w-lg relative z-10 py-8">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
            <GraduationCap size={28} color="white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Join CampusGrid</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">Create your campus account</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>I am a...</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    id={`role-${r.value}`}
                    onClick={() => set('role', r.value)}
                    className="py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{
                      background: form.role === r.value ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${form.role === r.value ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                      color: form.role === r.value ? 'white' : 'var(--text-secondary)',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2-column grid for short fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input id="reg-name" type="text" required placeholder="John Doe" className="input-field pl-9 text-sm"
                    value={form.name} onChange={(e) => set('name', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Roll Number</label>
                <div className="relative">
                  <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input id="reg-roll" type="text" required placeholder="21CSE001" className="input-field pl-9 text-sm"
                    value={form.rollNumber} onChange={(e) => set('rollNumber', e.target.value.toUpperCase())} />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>College Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="reg-email" type="email" required placeholder="rollno@college.edu" className="input-field pl-9 text-sm"
                  value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
            </div>

            {/* Branch + Year */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Branch</label>
                <select id="reg-branch" className="input-field text-sm" value={form.branch} onChange={(e) => set('branch', e.target.value)}>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              {form.role === 'student' && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Year</label>
                  <select id="reg-year" className="input-field text-sm" value={form.year} onChange={(e) => set('year', Number(e.target.value))}>
                    {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input id="reg-password" type={showPass ? 'text' : 'password'} required minLength={6} placeholder="Min 6 chars"
                    className="input-field pl-9 pr-8 text-sm" value={form.password} onChange={(e) => set('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input id="reg-confirm-password" type={showPass ? 'text' : 'password'} required placeholder="Re-enter"
                    className="input-field pl-9 text-sm" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} />
                </div>
              </div>
            </div>

            <motion.button id="register-submit" type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Create Account</span><ArrowRight size={16} /></>}
            </motion.button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold" style={{ color: 'var(--color-primary-light)' }}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
