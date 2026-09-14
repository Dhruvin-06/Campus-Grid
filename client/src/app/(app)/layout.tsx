'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Briefcase, MessageSquare, Search,
  Bell, MapPin, Users, Newspaper, Settings, LogOut, GraduationCap,
  Menu, X, ChevronRight, Shield, CalendarDays, CheckCircle2,
  TrendingUp, ClipboardList, Trophy, Calendar, UsersRound,
  FileText, UserCheck, BarChart3, Building2,
} from 'lucide-react';

// ─── Role-based nav config ────────────────────────────────────────────────────

/** Shown to ALL authenticated users */
const commonNav = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/announcements', label: 'Announcements', icon: Newspaper },
  { href: '/chat',          label: 'Messages',      icon: MessageSquare },
  { href: '/lostfound',     label: 'Lost & Found',  icon: MapPin },
];

/** Student-only tools */
const studentNav = [
  { href: '/resources',    label: 'Resource Vault', icon: BookOpen },
  { href: '/jobs',         label: 'Placements',     icon: Briefcase },
  { href: '/peers',        label: 'Peer Network',   icon: Users },
  { href: '/timetable',   label: 'Timetable',      icon: CalendarDays },
  { href: '/attendance',   label: 'Attendance',     icon: CheckCircle2 },
  { href: '/grades',       label: 'CGPA Tracker',   icon: TrendingUp },
  { href: '/assignments',  label: 'Assignments',    icon: ClipboardList },
  { href: '/studygroups',  label: 'Study Groups',   icon: UsersRound },
  { href: '/events',       label: 'Events',         icon: Calendar },
  { href: '/leaderboard',  label: 'Leaderboard',    icon: Trophy },
];

/** Faculty-only tools */
const facultyNav = [
  { href: '/resources',   label: 'Resources',       icon: BookOpen },
  { href: '/timetable',  label: 'Timetable',        icon: CalendarDays },
  { href: '/attendance',  label: 'Mark Attendance', icon: CheckCircle2 },
  { href: '/assignments', label: 'Assignments',     icon: ClipboardList },
  { href: '/grades',      label: 'Grade Entry',     icon: TrendingUp },
  { href: '/events',      label: 'Events',          icon: Calendar },
  { href: '/peers',       label: 'Student Network', icon: Users },
];

/** Placement Cell tools */
const placementNav = [
  { href: '/jobs',        label: 'Manage Jobs',     icon: Briefcase },
  { href: '/resources',  label: 'Resources',        icon: BookOpen },
  { href: '/events',     label: 'Events',           icon: Calendar },
  { href: '/peers',      label: 'Student Network',  icon: Users },
];

/** Admin tools (shown in addition to admin's section) */
const adminOnlyNav = [
  { href: '/admin',      label: 'Admin Panel',     icon: Shield },
];

// ─── Role metadata ─────────────────────────────────────────────────────────────
const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  student:       { label: 'Student',       color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  faculty:       { label: 'Faculty',       color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  admin:         { label: 'Admin',         color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
  placement_cell:{ label: 'Placement Cell',color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: 3, borderColor: 'rgba(99,102,241,0.3)', borderTopColor: '#6366f1' }} />
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Loading CampusGrid...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const role = user?.role || 'student';
  const rc = roleConfig[role] || roleConfig.student;

  // Pick the role-specific nav section
  const roleNav =
    role === 'faculty'        ? facultyNav :
    role === 'placement_cell' ? placementNav :
    role === 'admin'          ? [...studentNav] :  // admin sees all
    studentNav;

  const roleSectionLabel =
    role === 'faculty'        ? 'Teaching Tools' :
    role === 'placement_cell' ? 'Recruitment Tools' :
    role === 'admin'          ? 'All Tools' :
    'Student Tools';

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Fixed top: Logo + User */}
          <div className="flex-shrink-0 p-4">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-4 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--gradient-primary)' }}>
              <GraduationCap size={20} color="white" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight gradient-text">CampusGrid</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Smart Campus OS</p>
            </div>
            <button className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={18} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          {/* User info */}
          <Link href="/profile" className="flex items-center gap-3 p-3 rounded-12 mb-2 transition-all hover:bg-white/5 rounded-xl overflow-hidden">
            <div className="relative rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 overflow-hidden"
              style={{ background: 'var(--gradient-primary)', width: 40, height: 40, minWidth: 40, minHeight: 40 }}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" style={{ width: '100%', height: '100%' }} />
              ) : (
                user?.name?.[0]?.toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.rollNumber} · {user?.branch}
              </p>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          </Link>

          {/* Role badge */}
          <div className="mx-1 mb-2 px-3 py-1.5 rounded-lg flex items-center gap-2"
            style={{ background: rc.bg }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: rc.color }} />
            <span className="text-xs font-semibold" style={{ color: rc.color }}>{rc.label}</span>
          </div>

          </div>{/* end fixed-top */}

          {/* Scrollable Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 pb-2 space-y-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* Common nav — all roles */}
            <p className="text-xs font-semibold uppercase tracking-wider px-3 mt-2 mb-2" style={{ color: 'var(--text-muted)' }}>
              Menu
            </p>
            {commonNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${pathname === href || pathname.startsWith(href + '/') ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}

            {/* Role-specific nav */}
            <p className="text-xs font-semibold uppercase tracking-wider px-3 mt-4 mb-2" style={{ color: 'var(--text-muted)' }}>
              {roleSectionLabel}
            </p>
            {roleNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${pathname === href || pathname.startsWith(href + '/') ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}

            {/* Admin panel — only for admin & placement_cell */}
            {(role === 'admin' || role === 'placement_cell') && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider px-3 mt-4 mb-2" style={{ color: 'var(--text-muted)' }}>
                  Administration
                </p>
                {adminOnlyNav.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`sidebar-link ${pathname.startsWith(href) ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* Fixed Bottom */}
          <div className="flex-shrink-0 px-4 pb-4">
            <div className="border-t pt-4" style={{ borderColor: 'var(--border-glass)' }}>
            <Link href="/settings" className="sidebar-link mb-1">
              <Settings size={18} />
              <span>Settings</span>
            </Link>
            <button onClick={logout} className="sidebar-link w-full text-left" style={{ color: '#f87171' }}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'md:ml-[260px]' : ''}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button 
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors md:hidden bg-transparent border-none"
          >
            <Menu size={22} style={{ color: 'var(--text-primary)' }} />
          </button>

          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl flex-1 max-w-md"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search resources, students, jobs..." className="bg-transparent outline-none text-sm w-full"
              style={{ color: 'var(--text-primary)' }} />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button id="notifications-btn" className="relative p-2 rounded-full transition-colors hover:bg-white/10">
              <Bell size={20} style={{ color: 'var(--text-secondary)' }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-primary)] ring-2 ring-[#0B1120]" />
            </button>
            <Link href="/profile" className="relative group flex-shrink-0">
              <div className="rounded-full flex items-center justify-center text-sm font-bold text-white transition-all ring-2 ring-transparent group-hover:ring-indigo-500/50 overflow-hidden"
                style={{ background: 'var(--gradient-primary)', width: 32, height: 32, minWidth: 32, minHeight: 32 }}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" style={{ width: '100%', height: '100%' }} />
                ) : (
                  user?.name?.[0]?.toUpperCase()
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
