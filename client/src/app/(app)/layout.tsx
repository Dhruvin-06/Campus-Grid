"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, BookOpen, Briefcase, Users, MessageSquare,
  Newspaper, MapPin, Bell, Settings, LogOut, GraduationCap,
  Menu, X, Shield, ChevronRight,
} from "lucide-react";
import { notificationsApi } from "@/lib/api";

// ─── Navigation ────────────────────────────────────────────────────────────────

const studentNav = [
  { section: "MAIN", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { section: "LEARN", items: [
    { href: "/resources", label: "Learning Hub", icon: BookOpen },
  ]},
  { section: "CAREER", items: [
    { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  ]},
  { section: "NETWORK", items: [
    { href: "/peers", label: "Peer Network", icon: Users },
    { href: "/chat",  label: "Messages",    icon: MessageSquare },
  ]},
  { section: "CAMPUS", items: [
    { href: "/feed",      label: "Campus Feed",  icon: Newspaper },
    { href: "/lostfound", label: "Lost & Found", icon: MapPin },
  ]},
];

const facultyNav = [
  { section: "MAIN", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { section: "LEARN", items: [
    { href: "/resources", label: "Learning Hub", icon: BookOpen },
  ]},
  { section: "NETWORK", items: [
    { href: "/peers", label: "Student Network", icon: Users },
    { href: "/chat",  label: "Messages",        icon: MessageSquare },
  ]},
  { section: "CAMPUS", items: [
    { href: "/feed",      label: "Campus Feed",  icon: Newspaper },
    { href: "/lostfound", label: "Lost & Found", icon: MapPin },
  ]},
];

const adminNav = [
  { section: "MAIN", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { section: "LEARN", items: [
    { href: "/resources", label: "Learning Hub", icon: BookOpen },
  ]},
  { section: "CAREER", items: [
    { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  ]},
  { section: "NETWORK", items: [
    { href: "/peers", label: "Peer Network", icon: Users },
    { href: "/chat",  label: "Messages",    icon: MessageSquare },
  ]},
  { section: "CAMPUS", items: [
    { href: "/feed",      label: "Campus Feed",  icon: Newspaper },
    { href: "/lostfound", label: "Lost & Found", icon: MapPin },
  ]},
  { section: "ADMIN", items: [
    { href: "/admin", label: "Admin Console", icon: Shield },
  ]},
];

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  student: { label: "Student", color: "#4F46E5", bg: "#EEF2FF" },
  faculty: { label: "Faculty", color: "#16A34A", bg: "#F0FDF4" },
  admin:   { label: "Admin",   color: "#DC2626", bg: "#FEF2F2" },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login");
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "var(--primary)" }}>
            <GraduationCap size={20} color="white" />
          </div>
          <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const role = user?.role || "student";
  const rc = roleConfig[role] || roleConfig.student;
  const navSections = role === "faculty" ? facultyNav : role === "admin" ? adminNav : studentNav;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const currentPageName = (() => {
    const raw = pathname.split("/").filter(Boolean)[0] || "dashboard";
    if (raw === "lostfound") return "Lost & Found";
    const map: Record<string, string> = {
      dashboard: "Dashboard", resources: "Learning Hub", opportunities: "Opportunities",
      peers: "Peer Network", chat: "Messages", feed: "Campus Feed",
      notifications: "Notifications", profile: "Profile", settings: "Settings",
      admin: "Admin Console",
    };
    return map[raw] || raw.charAt(0).toUpperCase() + raw.slice(1);
  })();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(15,23,42,0.3)", backdropFilter: "blur(2px)" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div className="flex-shrink-0 px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--primary)" }}>
                  <GraduationCap size={17} color="white" />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>CampusGrid</p>
                  <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Smart Campus Platform</p>
                </div>
              </Link>
              <button
                className="p-1.5 rounded-md lg:hidden transition-colors"
                style={{ color: "var(--text-muted)" }}
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {navSections.map(({ section, items }: { section: string; items: { href: string; label: string; icon: any }[] }) => (
              <div key={section}>
                <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1.5"
                  style={{ color: "var(--text-muted)" }}>
                  {section}
                </p>
                <div className="space-y-0.5">
                  {items.map(({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`sidebar-link ${isActive(href) ? "active" : ""}`}
                    >
                      <Icon size={15} />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User footer */}
          <div className="flex-shrink-0 p-3" style={{ borderTop: "1px solid var(--border)" }}>
            <Link href="/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2.5 p-2 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-xs flex-shrink-0 overflow-hidden"
                style={{ background: "var(--primary)" }}>
                {user?.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  : user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {user?.rollNumber || user?.branch}
                </p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0"
                style={{ background: rc.bg, color: rc.color }}>
                {rc.label}
              </span>
            </Link>

            <div className="flex items-center justify-between mt-1.5 pt-1.5 px-1" style={{ borderTop: "1px solid var(--border)" }}>
              <Link href="/settings" onClick={() => setSidebarOpen(false)}
                className="text-xs flex items-center gap-1.5 transition-colors hover:text-[var(--primary)] py-1"
                style={{ color: "var(--text-muted)" }}>
                <Settings size={13} /> Settings
              </Link>
              <button onClick={logout}
                className="text-xs flex items-center gap-1.5 transition-colors py-1"
                style={{ color: "var(--danger)" }}>
                <LogOut size={13} /> Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: 0 }}>

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-14"
          style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle sidebar"
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
              style={{ color: "var(--text-secondary)" }}>
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              <span style={{ color: "var(--text-muted)" }}>CampusGrid</span>
              <ChevronRight size={13} style={{ color: "var(--text-muted)" }} />
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{currentPageName}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link href="/notifications"
              className="relative p-2 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Notifications">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ background: "var(--primary)" }} />
              )}
            </Link>

            <Link href="/profile" className="flex items-center ml-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white overflow-hidden ring-2 ring-indigo-200 transition-all"
                style={{ background: "var(--primary)" }}>
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
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
