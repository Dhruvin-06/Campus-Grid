'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, jobsApi, contentApi } from '@/lib/api';
import Link from 'next/link';
import {
  Users, BookOpen, Briefcase, MessageSquare,
  TrendingUp, Clock, ArrowRight, Bell, Star,
  CalendarDays, CheckCircle2, ClipboardList, Calendar
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalResources: number;
  totalJobs: number;
  totalBlogs: number;
  totalLostFound: number;
  pendingItems: number;
}

const studentLinks = [
  { href: '/timetable',  label: 'Timetable',    icon: CalendarDays,  color: 'text-indigo-400',  bg: 'bg-indigo-400/10'  },
  { href: '/attendance', label: 'Attendance',   icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { href: '/grades',     label: 'CGPA Tracker', icon: TrendingUp,    color: 'text-violet-400',  bg: 'bg-violet-400/10'  },
  { href: '/resources',  label: 'Resources',    icon: BookOpen,      color: 'text-cyan-400',    bg: 'bg-cyan-400/10'    },
];

const facultyLinks = [
  { href: '/attendance',  label: 'Mark Attendance',  icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { href: '/assignments', label: 'Assignments',      icon: ClipboardList, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { href: '/resources',   label: 'Upload Resources', icon: BookOpen,      color: 'text-violet-400',  bg: 'bg-violet-400/10' },
  { href: '/grades',      label: 'Grade Entry',      icon: TrendingUp,    color: 'text-amber-400',   bg: 'bg-amber-400/10'  },
];

const placementLinks = [
  { href: '/jobs',          label: 'Manage Jobs',     icon: Briefcase,    color: 'text-indigo-400',  bg: 'bg-indigo-400/10'  },
  { href: '/events',        label: 'Placement Drives',icon: Calendar,     color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { href: '/peers',         label: 'Student Network', icon: Users,        color: 'text-violet-400',  bg: 'bg-violet-400/10'  },
  { href: '/announcements', label: 'Broadcasts',      icon: Bell,         color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, annRes] = await Promise.all([
          jobsApi.getAll({ limit: 3 }),
          contentApi.getAnnouncements({ limit: 3 }),
        ]);
        setRecentJobs(jobsRes.data.jobs || []);
        setRecentAnnouncements(annRes.data.announcements || []);

        if (user?.role === 'admin') {
          const adminRes = await adminApi.getAnalytics();
          setStats(adminRes.data.stats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const quickLinks =
    user?.role === 'faculty'        ? facultyLinks :
    user?.role === 'placement_cell' ? placementLinks :
    studentLinks;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card relative overflow-hidden p-8 sm:p-10"
      >
        {/* subtle gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%)' }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            {/* Greeting pill */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--color-primary-light)' }}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              {greeting}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Welcome back,{' '}
              <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-base max-w-xl" style={{ color: 'var(--text-secondary)' }}>
              Here is what's happening across CampusGrid today. You have{' '}
              {user?.role === 'admin' ? stats?.pendingItems ?? 0 : 'new'} pending items requiring your attention.
            </p>
          </div>

          {/* User meta — desktop only */}
          <div className="hidden sm:flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.rollNumber}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {user?.branch}{user?.year ? ` · Year ${user.year}` : ''}
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-md text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}
            >
              {user?.role?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Admin Stats ── */}
      {user?.role === 'admin' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users',   value: stats.totalUsers,     icon: Users,     color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.25)'  },
            { label: 'Resources',     value: stats.totalResources,  icon: BookOpen,  color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)'  },
            { label: 'Active Jobs',   value: stats.totalJobs,       icon: Briefcase, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)'  },
            { label: 'Pending Items', value: stats.pendingItems,    icon: Clock,     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)'  },
          ].map(({ label, value, icon: Icon, color, bg, border }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-5 flex items-center gap-4 group"
              style={{ borderColor: border }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{ background: bg, color }}
              >
                <Icon size={22} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Quick Links (non-admin) ── */}
      {user?.role !== 'admin' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map(({ label, href, icon: Icon, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Link
                href={href}
                className="glass-card flex flex-col items-center justify-center p-5 group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${bg} ${color} group-hover:scale-110 transition-transform`}>
                  <Icon size={22} />
                </div>
                <span className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  {label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Main Content: Jobs + Announcements ── */}
      <div className={`grid ${user?.role === 'faculty' ? 'grid-cols-1' : 'lg:grid-cols-2'} gap-6`}>

        {/* Recent Jobs — hidden for faculty */}
        {user?.role !== 'faculty' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Briefcase size={18} style={{ color: '#10b981' }} />
                Latest Opportunities
              </h2>
              <Link
                href="/jobs"
                className="flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: 'var(--color-primary-light)' }}
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            <div className="space-y-3">
              {loading
                ? Array(3).fill(0).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}>
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                ))
                : recentJobs.length === 0
                  ? (
                    <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No opportunities yet.</p>
                  )
                  : recentJobs.map((job) => (
                    <Link
                      key={job._id}
                      href={`/jobs/${job._id}`}
                      className="flex items-start gap-3 p-4 rounded-xl transition-all group"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                        style={{ background: 'var(--gradient-primary)' }}
                      >
                        {job.company?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{job.title}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{job.company}</p>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0"
                        style={
                          job.type === 'placement'
                            ? { background: 'rgba(99,102,241,0.15)',  color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)'  }
                            : job.type === 'internship'
                            ? { background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }
                            : { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
                        }
                      >
                        {job.type}
                      </span>
                    </Link>
                  ))
              }
            </div>
          </motion.div>
        )}

        {/* Recent Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Bell size={18} style={{ color: '#f59e0b' }} />
              Announcements
            </h2>
            <Link
              href="/announcements"
              className="flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: 'var(--color-primary-light)' }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-3">
            {loading
              ? Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}>
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-full" />
                </div>
              ))
              : recentAnnouncements.length === 0
                ? (
                  <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No announcements yet.</p>
                )
                : recentAnnouncements.map((ann) => (
                  <div
                    key={ann._id}
                    className="p-4 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {ann.isPinned && <Star size={13} className="mt-0.5 flex-shrink-0" style={{ color: '#f59e0b', fill: '#f59e0b' }} />}
                      <p className="font-semibold text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{ann.title}</p>
                      <span
                        className="ml-auto flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold"
                        style={
                          ann.type === 'urgent'
                            ? { background: 'rgba(239,68,68,0.15)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.25)'  }
                            : { background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }
                        }
                      >
                        {ann.type}
                      </span>
                    </div>
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{ann.content}</p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
            }
          </div>
        </motion.div>

      </div>
    </div>
  );
}
