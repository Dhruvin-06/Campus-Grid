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
  Sparkles, GraduationCap, ChevronRight,
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
      <div className="card p-4 transition-colors hover:bg-[var(--surface-hover)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${color}14` }}>
              <Icon size={15} style={{ color }} />
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </div>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--text-muted)' }} />
        </div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
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
    { id: 'resources', title: 'Learning Hub', subtitle: 'Notes, PDFs & PYQs', href: '/resources', icon: BookOpen, color: '#818cf8' },
    { id: 'ai-assistant', title: 'AI Assistant', subtitle: 'Ask your syllabus & docs', href: '/ai-assistant', icon: Bot, color: '#a78bfa' },
    { id: 'peers', title: 'Peer Network', subtitle: 'Connect with students', href: '/peers', icon: Users, color: '#4ade80' },
    { id: 'opportunities', title: 'Opportunities', subtitle: 'Jobs, internships & more', href: '/opportunities', icon: Briefcase, color: '#fbbf24' },
    { id: 'feed', title: 'Campus Feed', subtitle: 'Announcements & posts', href: '/feed', icon: Newspaper, color: '#f472b6' },
    { id: 'lostfound', title: 'Lost & Found', subtitle: 'Report & claim items', href: '/lostfound', icon: MapPin, color: '#38bdf8' },
  ];

  if (user?.role === 'admin') {
    featureCards.push({
      id: 'admin', title: 'Admin Console', subtitle: 'Manage platform', href: '/admin', icon: Shield, color: '#f87171',
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {greeting}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Here&apos;s what&apos;s happening across your campus.
        </p>
      </motion.div>

      {/* AI Search */}
      <form onSubmit={handleAISearch}>
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg card">
          <Sparkles size={16} style={{ color: 'var(--primary)' }} />
          <input
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Ask CampusGrid anything..."
            className="w-full bg-transparent outline-none text-sm border-none p-0"
            style={{ color: 'var(--text-primary)' }}
          />
          <button type="submit" className="flex items-center justify-center p-1.5 rounded-md transition-colors hover:bg-white/5"
            style={{ color: 'var(--primary)' }}>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {user?.role === 'admin' ? (
          <>
            <StatKPI icon={GraduationCap} label="Students" value={stats?.totalStudents} color="#818cf8" href="/peers" />
            <StatKPI icon={AlertCircle} label="Pending Resources" value={stats?.pendingResources} color="#f87171" href="/resources?tab=pending" />
            <StatKPI icon={CheckCircle2} label="Pending Posts" value={stats?.pendingPosts} color="#fbbf24" href="/feed" />
            <StatKPI icon={Briefcase} label="Active Drives" value={stats?.totalOpportunities} color="#4ade80" href="/opportunities" />
          </>
        ) : user?.role === 'faculty' ? (
          <>
            <StatKPI icon={BookOpen} label="Learning Hub" value={stats?.totalResources} color="#4ade80" href="/resources" />
            <StatKPI icon={AlertCircle} label="Pending Approvals" value={stats?.pendingResources} color="#f87171" href="/resources?tab=pending" />
            <StatKPI icon={Newspaper} label="Pending Reviews" value={stats?.pendingPosts} color="#fbbf24" href="/feed" />
            <StatKPI icon={GraduationCap} label="Students" value={stats?.totalStudents} color="#818cf8" href="/peers" />
          </>
        ) : (
          <>
            <StatKPI icon={Briefcase} label="Active Drives" value={stats?.totalOpportunities} color="#fbbf24" href="/opportunities" />
            <StatKPI icon={CheckCircle2} label="Saved Drives" value={stats?.mySavedOpps} color="#818cf8" href="/opportunities?saved=true" />
            <StatKPI icon={BookOpen} label="Resources" value={stats?.totalResources} color="#4ade80" href="/resources" />
            <StatKPI icon={Bell} label="Unread Alerts" value={unreadCount} color="#a78bfa" href="/notifications" />
          </>
        )}
      </div>

      {/* Mid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Opportunities */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Briefcase size={15} style={{ color: '#fbbf24' }} /> Latest Opportunities
            </h2>
            <Link href="/opportunities" className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: 'var(--text-muted)' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />)}
            </div>
          ) : recentOpportunities.length === 0 ? (
            <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>No active opportunities yet</p>
          ) : (
            <div className="space-y-2">
              {recentOpportunities.map((opp) => (
                <div key={opp._id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(251,191,36,0.1)' }}>
                    <Briefcase size={14} style={{ color: '#fbbf24' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{opp.title}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{opp.company} · <span className="capitalize">{opp.type}</span></p>
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
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Newspaper size={15} style={{ color: '#818cf8' }} /> Campus Announcements
            </h2>
            <Link href="/feed" className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: 'var(--text-muted)' }}>
              View feed <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />)}
            </div>
          ) : recentAnnouncements.length === 0 ? (
            <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>No announcements yet</p>
          ) : (
            <div className="space-y-2">
              {recentAnnouncements.map((ann) => (
                <div key={ann._id} className="flex items-start gap-2.5 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  {ann.isPinned && <div className="w-1 h-full min-h-[32px] rounded-full flex-shrink-0" style={{ background: '#fbbf24' }} />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{ann.title}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{ann.content}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {ann.postedBy?.name} · {new Date(ann.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feature Grid */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.id} href={card.href} className="block group">
                <div className="card p-4 transition-colors hover:bg-[var(--surface-hover)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${card.color}14` }}>
                    <Icon size={16} style={{ color: card.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{card.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{card.subtitle}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
