'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Briefcase, Users, MessageSquare,
  Newspaper, MapPin, Bell, Settings, LogOut, GraduationCap,
  Menu, X, Shield,
} from 'lucide-react';

import { notificationsApi } from '@/lib/api';

// ─── Navigation Structure ─────────────────────────────────────────────────────

const studentNav = [
  { section: 'MAIN', items: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { section: 'LEARN', items: [
    { href: '/resources',     label: 'Learning Hub',  icon: BookOpen },
  ]},

  { section: 'CAREER', items: [
    { href: '/opportunities', label: 'Opportunities',  icon: Briefcase },
  ]},
  { section: 'NETWORK', items: [
    { href: '/peers', label: 'Peer Network', icon: Users },
    { href: '/chat',  label: 'Messages',     icon: MessageSquare },
  ]},
  { section: 'CAMPUS', items: [
    { href: '/feed',      label: 'Campus Feed',  icon: Newspaper },
    { href: '/lostfound', label: 'Lost & Found', icon: MapPin },
  ]},
];

const facultyNav = [
  { section: 'MAIN', items: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { section: 'LEARN', items: [
    { href: '/resources',    label: 'Learning Hub', icon: BookOpen },
  ]},

  { section: 'NETWORK', items: [
    { href: '/peers', label: 'Student Network', icon: Users },
    { href: '/chat',  label: 'Messages',        icon: MessageSquare },
  ]},
  { section: 'CAMPUS', items: [
    { href: '/feed',      label: 'Campus Feed',  icon: Newspaper },
    { href: '/lostfound', label: 'Lost & Found', icon: MapPin },
  ]},
];

const adminNav = [
  { section: 'MAIN', items: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { section: 'LEARN', items: [
    { href: '/resources',    label: 'Learning Hub',  icon: BookOpen },
  ]},

  { section: 'CAREER', items: [
    { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
  ]},
  { section: 'NETWORK', items: [
    { href: '/peers', label: 'Peer Network', icon: Users },
    { href: '/chat',  label: 'Messages',     icon: MessageSquare },
  ]},
  { section: 'CAMPUS', items: [
    { href: '/feed',      label: 'Campus Feed',  icon: Newspaper },
    { href: '/lostfound', label: 'Lost & Found', icon: MapPin },
  ]},
  { section: 'ADMIN', items: [
    { href: '/admin', label: 'Admin Console', icon: Shield },
  ]},
];

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  student:   { label: 'Student', color: '#818cf8', bg: 'rgba(99,102,241,0.1)' },
  faculty:   { label: 'Faculty', color: '#4ade80', bg: 'rgba(34,197,94,0.1)' },
  admin:     { label: 'Admin',   color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Removed auto-open effect to ensure sidebar is always closed by default

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      setUnreadCount(res.data.count || 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const role = user?.role || 'student';
  const rc = roleConfig[role] || roleConfig.student;

  const navSections =
    role === 'faculty' ? facultyNav :
    role === 'admin'   ? adminNav   :
    studentNav;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const currentPageName = (() => {
    const raw = pathname.split('/').filter(Boolean)[0] || 'dashboard';
    if (raw === 'lostfound') return 'Lost & Found';
    return raw.charAt(0).toUpperCase() + raw.slice(1);

  })();

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div className="flex-shrink-0 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ background: 'var(--primary)' }}>
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h1 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>CampusGrid</h1>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Campus Platform</p>
                </div>
              </div>
              <button
                className="p-1 rounded-md hover:bg-white/5 transition-colors lg:hidden"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {navSections.map(({ section, items }: { section: string; items: { href: string; label: string; icon: any }[] }) => (
              <div key={section}>
                <p className="text-[11px] font-semibold uppercase tracking-wider px-2 mb-1.5"
                  style={{ color: 'var(--text-muted)' }}>
                  {section}
                </p>
                <div className="space-y-0.5">
                  {items.map(({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`sidebar-link ${isActive(href) ? 'active' : ''}`}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User footer */}
          <div className="flex-shrink-0 p-3" style={{ borderTop: '1px solid var(--border)' }}>
            <Link href="/profile"
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
              onClick={() => setSidebarOpen(false)}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-xs flex-shrink-0 overflow-hidden"
                style={{ background: 'var(--primary)' }}>
                {user?.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  : user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {user?.rollNumber || user?.branch}
                </p>
              </div>
              <span className="text-[11px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                style={{ background: rc.bg, color: rc.color }}>
                {rc.label}
              </span>
            </Link>

            <div className="flex items-center justify-between mt-2 pt-2 px-1" style={{ borderTop: '1px solid var(--border)' }}>
              <Link href="/settings" onClick={() => setSidebarOpen(false)}
                className="text-xs flex items-center gap-1.5 transition-colors hover:text-white"
                style={{ color: 'var(--text-muted)' }}>
                <Settings size={14} /> Settings
              </Link>
              <button onClick={logout}
                className="text-xs flex items-center gap-1.5 transition-colors"
                style={{ color: 'var(--danger)' }}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${sidebarOpen ? 'lg:pl-[256px]' : 'pl-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-14"
          style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle sidebar"
              className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-secondary)' }}>
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              <span style={{ color: 'var(--text-muted)' }}>CampusGrid</span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{currentPageName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Link href="/notifications"
              className="relative p-2 rounded-md transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Notifications">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400" />
              )}
            </Link>

            {/* User avatar */}
            <Link href="/profile" className="flex items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white overflow-hidden"
                style={{ background: 'var(--primary)' }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                  : user?.name?.[0]?.toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
