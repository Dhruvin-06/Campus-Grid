"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, contentApi, opportunitiesApi, notificationsApi, usersApi } from "@/lib/api";
import Link from "next/link";
import {
  BookOpen, Briefcase, Users, Newspaper, MapPin, Bell,
  ArrowRight, CheckCircle2, AlertCircle, Shield,
  GraduationCap, ChevronRight, TrendingUp,
} from "lucide-react";

function StatCard({
  icon: Icon, label, value, color, href,
}: {
  icon: any; label: string; value: string | number | undefined; color: string; href: string;
}) {
  return (
    <Link href={href} className="block group">
      <div className="card p-4 transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: `${color}14` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity"
            style={{ color: "var(--text-muted)" }} />
        </div>
        <p className="text-2xl font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
          {value ?? "—"}
        </p>
        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
      </div>
    </Link>
  );
}

const featureGrid = [
  { id: "resources",    title: "Learning Hub",   subtitle: "Notes, PDFs & PYQs",       href: "/resources",    icon: BookOpen,   color: "#4F46E5" },
  { id: "peers",        title: "Peer Network",   subtitle: "Connect with students",     href: "/peers",        icon: Users,      color: "#16A34A" },
  { id: "opportunities",title: "Opportunities",  subtitle: "Jobs, internships & more",  href: "/opportunities",icon: Briefcase,  color: "#D97706" },
  { id: "feed",         title: "Campus Feed",    subtitle: "Announcements & posts",     href: "/feed",         icon: Newspaper,  color: "#0284C7" },
  { id: "lostfound",    title: "Lost & Found",   subtitle: "Report & claim items",      href: "/lostfound",    icon: MapPin,     color: "#DC2626" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [recentOpportunities, setRecentOpportunities] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [annRes, notifRes, oppRes, statsRes] = await Promise.all([
          contentApi.getAnnouncements({ limit: 4 }),
          notificationsApi.getUnreadCount(),
          opportunitiesApi.getAll({ limit: 4 }),
          user?.role === "admin" ? adminApi.getAnalytics() : usersApi.getStats(),
        ]);
        setRecentAnnouncements(annRes.data.announcements || []);
        setUnreadCount(notifRes.data.count || 0);
        setRecentOpportunities(oppRes.data.opportunities || []);
        setStats(statsRes.data.stats || null);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user?.role]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const allFeatures = user?.role === "admin"
    ? [...featureGrid, { id: "admin", title: "Admin Console", subtitle: "Manage platform", href: "/admin", icon: Shield, color: "#DC2626" }]
    : featureGrid;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Welcome banner */}
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="rounded-xl p-5 flex items-center justify-between gap-4"
          style={{ background: "var(--primary)", color: "white" }}>
          <div>
            <p className="text-sm font-medium opacity-80 mb-0.5">{greeting}</p>
            <h1 className="text-xl font-bold text-white">{user?.name?.split(" ")[0]} 👋</h1>
            <p className="text-sm mt-1 opacity-70">
              {user?.rollNumber} · {user?.branch}{user?.year ? ` · Year ${user.year}` : ""} ·{" "}
              <span className="capitalize">{user?.role}</span>
            </p>
          </div>
          <div className="hidden sm:flex w-12 h-12 rounded-xl items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <GraduationCap size={24} color="white" />
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="w-9 h-9 rounded-lg animate-pulse" style={{ background: "var(--bg-secondary)" }} />
              <div className="h-7 w-16 rounded animate-pulse" style={{ background: "var(--bg-secondary)" }} />
              <div className="h-3 w-20 rounded animate-pulse" style={{ background: "var(--bg-secondary)" }} />
            </div>
          ))
        ) : user?.role === "admin" ? (
          <>
            <StatCard icon={GraduationCap} label="Total Students" value={stats?.totalStudents} color="#4F46E5" href="/peers" />
            <StatCard icon={AlertCircle}   label="Pending Resources" value={stats?.pendingResources} color="#DC2626" href="/resources?tab=pending" />
            <StatCard icon={TrendingUp}    label="Pending Posts" value={stats?.pendingPosts} color="#D97706" href="/feed" />
            <StatCard icon={Briefcase}     label="Active Drives" value={stats?.totalOpportunities} color="#16A34A" href="/opportunities" />
          </>
        ) : user?.role === "faculty" ? (
          <>
            <StatCard icon={BookOpen}      label="Resources" value={stats?.totalResources} color="#4F46E5" href="/resources" />
            <StatCard icon={AlertCircle}   label="Pending Approvals" value={stats?.pendingResources} color="#DC2626" href="/resources?tab=pending" />
            <StatCard icon={TrendingUp}    label="Pending Reviews" value={stats?.pendingPosts} color="#D97706" href="/feed" />
            <StatCard icon={GraduationCap} label="Students" value={stats?.totalStudents} color="#16A34A" href="/peers" />
          </>
        ) : (
          <>
            <StatCard icon={Briefcase}    label="Active Drives" value={stats?.totalOpportunities} color="#D97706" href="/opportunities" />
            <StatCard icon={CheckCircle2} label="Saved Drives"  value={stats?.mySavedOpps} color="#4F46E5" href="/opportunities?saved=true" />
            <StatCard icon={BookOpen}     label="Resources"     value={stats?.totalResources} color="#16A34A" href="/resources" />
            <StatCard icon={Bell}         label="Unread Alerts" value={unreadCount} color="#0284C7" href="/notifications" />
          </>
        )}
      </div>

      {/* Mid section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Opportunities */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Briefcase size={15} style={{ color: "#D97706" }} /> Latest Opportunities
            </h2>
            <Link href="/opportunities" className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: "var(--primary)" }}>
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map((i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--bg-secondary)" }} />)}
            </div>
          ) : recentOpportunities.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>No active opportunities yet</p>
          ) : (
            <div className="space-y-2">
              {recentOpportunities.map((opp) => (
                <div key={opp._id} className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(217,119,6,0.1)" }}>
                    <Briefcase size={14} style={{ color: "#D97706" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>{opp.title}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{opp.company} · <span className="capitalize">{opp.type}</span></p>
                  </div>
                  {opp.isVerified && (
                    <span className="badge badge-success flex-shrink-0">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Newspaper size={15} style={{ color: "#4F46E5" }} /> Campus Announcements
            </h2>
            <Link href="/feed" className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: "var(--primary)" }}>
              View feed <ArrowRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map((i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--bg-secondary)" }} />)}
            </div>
          ) : recentAnnouncements.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>No announcements yet</p>
          ) : (
            <div className="space-y-2">
              {recentAnnouncements.map((ann) => (
                <div key={ann._id} className="flex items-start gap-2.5 p-3 rounded-lg"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  {ann.isPinned && <div className="w-1 min-h-[32px] rounded-full flex-shrink-0 mt-0.5" style={{ background: "#D97706" }} />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>{ann.title}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{ann.content}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {ann.postedBy?.name} · {new Date(ann.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allFeatures.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.id} href={card.href} className="block group">
                <div className="card p-4 flex items-center gap-3 transition-all hover:shadow-md">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${card.color}12` }}>
                    <Icon size={17} style={{ color: card.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{card.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{card.subtitle}</p>
                  </div>
                  <ChevronRight size={15} className="flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity"
                    style={{ color: "var(--text-muted)" }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
