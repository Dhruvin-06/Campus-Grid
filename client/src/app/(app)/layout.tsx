'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Bot, Briefcase, Users, MessageSquare,
  Newspaper, MapPin, Bell, Settings, LogOut, GraduationCap,
  Menu, X, ChevronRight, Shield, Sparkles, Search, Command,
} from 'lucide-react';
import { notificationsApi } from '@/lib/api';

// ─── Navigation Structure ─────────────────────────────────────────────────────

const studentNav = [
  { section: 'MAIN', items: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { section: 'LEARN', items: [
    { href: '/resources',     label: 'Learning Hub',  icon: BookOpen },
    { href: '/ai-assistant',  label: 'AI Assistant',  icon: Bot },
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
    { href: '/ai-assistant', label: 'AI Assistant', icon: Bot },
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
    { href: '/ai-assistant', label: 'AI Assistant',  icon: Bot },
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
  { section: 'ADMINISTRATION', items: [
    { href: '/admin', label: 'Admin Console', icon: Shield },
  ]},
];

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  student:   { label: 'Student',       color: '#818CF8', bg: 'rgba(79,70,229,0.15)'  },
  faculty:   { label: 'Faculty',       color: '#34D399', bg: 'rgba(16,185,129,0.15)' },
  admin:     { label: 'Admin',         color: '#F87171', bg: 'rgba(239,68,68,0.15)'  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
          <p style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium">Loading CampusGrid OS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const role = user?.role || 'student';
  const rc = roleConfig[role] || roleConfig.student;

  const navSections =
    role === 'faculty'   ? facultyNav   :
    role === 'admin'     ? adminNav     :
    studentNav;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const currentPageName = (() => {
    const raw = pathname.split('/').filter(Boolean)[0] || 'dashboard';
    if (raw === 'lostfound') return 'Lost & Found';
    if (raw === 'ai-assistant') return 'AI Assistant';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  })();

  return (
    <div className="flex min-h-screen bg-[#070A13] text-slate-100 relative">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="flex flex-col h-full overflow-hidden">

          {/* Logo Header */}
          <div className="flex-shrink-0 p-4 border-b border-white/[0.08]">
            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 ring-1 ring-indigo-400/30 pulse-glow"
                  style={{ background: 'var(--gradient-primary)' }}>
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h1 className="font-extrabold text-base leading-tight tracking-tight text-white gradient-text">CampusGrid</h1>
                  <p className="text-[10px] font-medium text-cyan-400/80">Smart Campus OS</p>
                </div>
              </div>

              <button
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                onClick={() => setSidebarOpen(false)}
                title="Close sidebar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {navSections.map(({ section, items }) => (
              <div key={section}>
                <p className="text-[10px] font-bold uppercase tracking-wider px-3 mb-2 text-slate-400/60">
                  {section}
                </p>
                <div className="space-y-1">
                  {items.map(({ href, label, icon: Icon }) => (
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

          {/* User Profile & Footer Section */}
          <div className="flex-shrink-0 p-3 border-t border-white/[0.08] bg-slate-950/80 backdrop-blur-md">
            <Link href="/profile"
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.06] transition-all"
              onClick={() => setSidebarOpen(false)}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 overflow-hidden ring-2 ring-indigo-500/40 shadow-sm shadow-indigo-500/30"
                style={{ background: 'var(--gradient-primary)' }}>
                {user?.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  : user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs truncate text-white">{user?.name}</p>
                <p className="text-[10px] truncate text-slate-400">
                  {user?.rollNumber || user?.branch}
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.color}40` }}>
                {rc.label}
              </span>
            </Link>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06] px-1">
              <Link href="/settings" onClick={() => setSidebarOpen(false)}
                className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                <Settings size={14} /> Settings
              </Link>
              <button onClick={logout} className="text-xs flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors">
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:pl-[260px]' : 'pl-0'}`}>
        {/* Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 backdrop-blur-2xl border-b border-white/[0.08]" style={{ background: 'rgba(3, 7, 18, 0.85)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(prev => !prev)}
              title="Toggle sidebar"
              className="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-slate-300 border border-white/5">
              <Menu size={18} />
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">CampusGrid</span>
              <span className="text-slate-600">/</span>
              <span className="font-bold text-white gradient-text-cyan">{currentPageName}</span>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-3">
            {/* Search shortcut button */}
            <Link href="/resources"
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all hover:border-indigo-500/40 hover:bg-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
              <Search size={13} />
              <span>Search resources, opportunities...</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300 font-mono">⌘K</kbd>
            </Link>

            {/* AI Assistant shortcut */}
            <Link href="/ai-assistant"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm shadow-violet-500/20"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#C084FC' }}>
              <Sparkles size={13} />
              <span className="hidden md:inline">AI Copilot</span>
            </Link>

            {/* Notifications */}
            <Link href="/notifications" className="relative p-2 rounded-xl transition-colors hover:bg-white/10 text-slate-300 border border-transparent hover:border-white/10">
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 animate-pulse" />
              )}
            </Link>

            {/* User Avatar */}
            <Link href="/profile" className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden ring-2 ring-cyan-400/40 shadow-sm shadow-cyan-500/30"
                style={{ background: 'var(--gradient-primary)' }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                  : user?.name?.[0]?.toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

