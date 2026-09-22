'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, contentApi, opportunitiesApi, notificationsApi, usersApi } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Bot, Briefcase, Users, Newspaper, MapPin, Bell,
  ArrowRight, CheckCircle2, AlertCircle, Shield,
  Sparkles, Search, GraduationCap, ChevronRight,
} from 'lucide-react';

function StatKPI({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: any;
  label: string;
  value: string | number | undefined;
  color: string;
  href: string;
}) {
  return (
    <Link href={href} className="block group">
      <div className="saas-card p-4 transition-all duration-200 hover:-translate-y-0.5"
        style={{ background: 'rgba(17, 24, 39, 0.7)' }}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <Icon size={14} style={{ color }} />
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
          <ChevronRight size={12} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" style={{ color }} />
        </div>
        <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {value ?? '—'}
        </p>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [recentOpportunities, setRecentOpportunities] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [annRes, notifRes, oppRes, statsRes] = await Promise.all([
          contentApi.getAnnouncements({ limit: 4 }),
          notificationsApi.getUnreadCount(),
          opportunitiesApi.getAll({ limit: 4 }),
          user?.role === 'admin' ? adminApi.getAnalytics() : usersApi.getStats(),
        ]);
        setRecentAnnouncements(annRes.data.announcements || []);
        setUnreadCount(notifRes.data.count || 0);
        setRecentOpportunities(oppRes.data.opportunities || []);
        setStats(statsRes.data.stats || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.role]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const handleAISearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiQuery.trim()) {
      router.push(`/ai-assistant?q=${encodeURIComponent(aiQuery.trim())}`);
    }
  };

  const featureCards = [
    {
      id: 'resources',
      title: 'Learning Hub',
      subtitle: 'Verified Notes, PDFs & PYQs',
      href: '/resources',
      icon: BookOpen,
      statLabel: stats?.totalResources !== undefined ? `${stats.totalResources} Items` : 'Academic Notes',
      color: '#818CF8',
    },
    {
      id: 'ai-assistant',
      title: 'AI Copilot',
      subtitle: 'Ask your syllabus & study docs',
      href: '/ai-assistant',
      icon: Bot,
      statLabel: 'Smart Assistant',
      color: '#C084FC',
    },
    {
      id: 'peers',
      title: 'Peer Network',
      subtitle: 'Connect with students & faculty',
      href: '/peers',
      icon: Users,
      statLabel: stats?.totalStudents !== undefined ? `${stats.totalStudents} Peers` : 'Directory',
      color: '#34D399',
    },
    {
      id: 'opportunities',
      title: 'Opportunities',
      subtitle: 'Placements, internships & hackathons',
      href: '/opportunities',
      icon: Briefcase,
      statLabel: stats?.totalOpportunities !== undefined ? `${stats.totalOpportunities} Active` : 'Career Portal',
      color: '#FBBF24',
    },
    {
      id: 'feed',
      title: 'Campus Feed',
      subtitle: 'Official announcements & posts',
      href: '/feed',
      icon: Newspaper,
      statLabel: 'Feed',
      color: '#F472B6',
    },
    {
      id: 'lostfound',
      title: 'Lost & Found',
      subtitle: 'Report, locate & claim items',
      href: '/lostfound',
      icon: MapPin,
      statLabel: stats?.totalLostFound !== undefined ? `${stats.totalLostFound} Active Items` : 'Claim Portal',
      color: '#22D3EE',
    },
  ];

  if (user?.role === 'admin') {
    featureCards.push({
      id: 'admin',
      title: 'Admin Console',
      subtitle: 'Manage moderation & platform users',
      href: '/admin',
      icon: Shield,
      statLabel: stats?.pendingItems ? `${stats.pendingItems} Pending Review` : 'Console',
      color: '#F87171',
    });
  }

  return (
    <div className="space-y-6">
      {/* ─── Command Center Header ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Here&apos;s what&apos;s happening across your campus today.
          </p>
        </div>

        {/* ─── Prominent AI Command Copilot Search Bar ────────────────────────── */}
        <form onSubmit={handleAISearch} className="relative group">
          <div className="absolute inset-0 rounded-xl blur-md transition-opacity opacity-50 group-hover:opacity-100 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.3) 0%, rgba(124,58,237,0.3) 100%)' }} />
          <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
            style={{ background: '#111827', border: '1px solid rgba(124, 58, 237, 0.4)' }}>
            <Sparkles size={18} style={{ color: '#C084FC' }} />
            <input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="✨ Ask CampusGrid anything (e.g., Explain binary search, find CSE notes, placement updates)..."
              className="w-full bg-transparent outline-none text-sm font-medium border-none p-0"
              style={{ color: 'var(--text-primary)' }}
            />
            <button type="submit" className="flex items-center justify-center p-2 rounded-lg transition-all hover:bg-indigo-600 text-white"
              style={{ background: 'var(--color-primary)' }}>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </motion.div>

      {/* ─── KPI Stat Cards (Tailored per Role) ───────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {user?.role === 'admin' ? (
            <>
              <StatKPI icon={GraduationCap} label="Students" value={stats?.totalStudents} color="#818CF8" href="/peers" />
              <StatKPI icon={AlertCircle} label="Pending Resources" value={stats?.pendingResources} color="#F87171" href="/resources" />
              <StatKPI icon={CheckCircle2} label="Pending Feed Posts" value={stats?.pendingPosts} color="#FBBF24" href="/feed" />
              <StatKPI icon={Briefcase} label="Active Drives" value={stats?.totalOpportunities} color="#34D399" href="/opportunities" />
            </>
          ) : user?.role === 'faculty' ? (
            <>
              <StatKPI icon={BookOpen} label="Learning Hub" value={stats?.totalResources} color="#34D399" href="/resources" />
              <StatKPI icon={AlertCircle} label="Pending Note Approvals" value={stats?.pendingResources} color="#F87171" href="/resources" />
              <StatKPI icon={Newspaper} label="Pending Post Reviews" value={stats?.pendingPosts} color="#FBBF24" href="/feed" />
              <StatKPI icon={GraduationCap} label="Student Directory" value={stats?.totalStudents} color="#818CF8" href="/peers" />
            </>
          ) : user?.role === 'placement' ? (
            <>
              <StatKPI icon={Briefcase} label="Active Drives" value={stats?.totalOpportunities} color="#FBBF24" href="/opportunities" />
              <StatKPI icon={GraduationCap} label="Total Students" value={stats?.totalStudents} color="#818CF8" href="/peers" />
              <StatKPI icon={Newspaper} label="Campus Notices" value={recentAnnouncements.length} color="#34D399" href="/feed" />
              <StatKPI icon={Bell} label="Unread Alerts" value={unreadCount} color="#C084FC" href="/notifications" />
            </>
          ) : (
            <>
              <StatKPI icon={Briefcase} label="Active Drives" value={stats?.totalOpportunities} color="#FBBF24" href="/opportunities" />
              <StatKPI icon={CheckCircle2} label="My Saved Drives" value={stats?.mySavedOpps} color="#818CF8" href="/opportunities?saved=true" />
              <StatKPI icon={BookOpen} label="Verified Resources" value={stats?.totalResources} color="#34D399" href="/resources" />
              <StatKPI icon={Bell} label="Unread Alerts" value={unreadCount} color="#C084FC" href="/notifications" />
            </>
          )}
        </div>
      </motion.div>


      {/* ─── Mid Section: Career Opportunities & Campus Feed ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Career Opportunities */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="saas-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Briefcase size={16} style={{ color: '#FBBF24' }} /> Latest Opportunities
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Verified internships, placements & hackathons</p>
            </div>
            <Link href="/opportunities" className="text-xs font-semibold flex items-center gap-1 hover:underline"
              style={{ color: '#FBBF24' }}>
              View all <ArrowRight size={11} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg animate-pulse bg-slate-800/50" />)}
            </div>
          ) : recentOpportunities.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No active opportunities posted yet</div>
          ) : (
            <div className="space-y-2.5">
              {recentOpportunities.map((opp) => (
                <div key={opp._id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-white/[0.04]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <Briefcase size={14} style={{ color: '#FBBF24' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate text-slate-200">{opp.title}</p>
                    <p className="text-[11px] truncate text-slate-400">{opp.company} · <span className="capitalize">{opp.type}</span></p>
                  </div>
                  {opp.isVerified && (
                    <span className="saas-badge saas-badge-emerald flex-shrink-0">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Campus Announcements */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}
          className="saas-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Newspaper size={16} style={{ color: '#818CF8' }} /> Campus Announcements
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Official university notices & updates</p>
            </div>
            <Link href="/feed" className="text-xs font-semibold flex items-center gap-1 hover:underline"
              style={{ color: '#818CF8' }}>
              View feed <ArrowRight size={11} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg animate-pulse bg-slate-800/50" />)}
            </div>
          ) : recentAnnouncements.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No announcements yet</div>
          ) : (
            <div className="space-y-2.5">
              {recentAnnouncements.map((ann) => (
                <div key={ann._id} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/50 border border-white/[0.04]">
                  {ann.isPinned && <div className="w-1 h-full min-h-[32px] rounded-full bg-amber-500 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate text-slate-200">{ann.title}</p>
                    <p className="text-[11px] truncate text-slate-400 mt-0.5">{ann.content}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {ann.postedBy?.name} · {new Date(ann.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Bottom Feature Navigation Grid ───────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
        <h2 className="text-sm font-bold uppercase tracking-wider mb-3 text-slate-400">Campus Ecosystem Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.id} href={card.href} className="block group">
                <div className="saas-card p-4 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: `${card.color}15`, border: `1px solid ${card.color}30` }}>
                      <Icon size={16} style={{ color: card.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-white group-hover:text-indigo-400 transition-colors">{card.title}</p>
                      <p className="text-[11px] text-slate-400">{card.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold flex-shrink-0"
                    style={{ background: `${card.color}15`, color: card.color }}>
                    {card.statLabel}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

