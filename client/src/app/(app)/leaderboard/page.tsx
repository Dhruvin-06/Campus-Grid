'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { leaderboardApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useAuthCtx } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Trophy, Medal, Star, BookOpen, Users, Bookmark, Filter } from 'lucide-react';

const BRANCHES = ['All', 'CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT', 'AIDS', 'AIML', 'Other'];

interface LeaderEntry {
  _id: string; name: string; avatar: string; rollNumber: string;
  branch: string; year: number; score: number; rank: number;
  skills: string[];
  breakdown: { resources: number; connections: number; bookmarks: number };
}

const RANK_STYLES: Record<number, { bg: string; color: string; icon: string; border: string }> = {
  1: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', icon: '🥇', border: '1px solid rgba(251,191,36,0.3)' },
  2: { bg: 'rgba(156,163,175,0.12)', color: '#9ca3af', icon: '🥈', border: '1px solid rgba(156,163,175,0.3)' },
  3: { bg: 'rgba(180,83,9,0.12)', color: '#b45309', icon: '🥉', border: '1px solid rgba(180,83,9,0.3)' },
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('');

  useEffect(() => { fetchLeaderboard(); }, [branchFilter, yearFilter]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (branchFilter !== 'All') params.branch = branchFilter;
      if (yearFilter) params.year = yearFilter;
      const res = await leaderboardApi.get(params);
      setLeaderboard(res.data.leaderboard || []);
      setMyRank(res.data.myRank);
    } catch { toast.error('Failed to load leaderboard'); }
    finally { setLoading(false); }
  };

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const myEntry = leaderboard.find((e) => String(e._id) === String(user?._id));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy size={26} style={{ color: '#fbbf24' }} /> Leaderboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Ranked by resources, connections &amp; engagement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
            {BRANCHES.map((b) => <option key={b} value={b} style={{ background: '#0f1629' }}>{b}</option>)}
          </select>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
            <option value="" style={{ background: '#0f1629' }}>All Years</option>
            {[1, 2, 3, 4].map((y) => <option key={y} value={y} style={{ background: '#0f1629' }}>Year {y}</option>)}
          </select>
        </div>
      </div>

      {/* My Rank Banner */}
      {myRank && myEntry && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 flex items-center gap-4"
          style={{ border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.06)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', color: 'white' }}>
            #{myRank}
          </div>
          <div>
            <p className="font-semibold text-sm">Your Rank</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Score: {myEntry.score} pts · {myEntry.branch}</p>
          </div>
          <div className="ml-auto flex gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1"><BookOpen size={11} /> {myEntry.breakdown.resources} uploads</span>
            <span className="flex items-center gap-1"><Users size={11} /> {myEntry.breakdown.connections} peers</span>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : leaderboard.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Trophy size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold">No data yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Upload resources and connect with peers to earn points!</p>
        </div>
      ) : (
        <>
          {/* Podium Top 3 */}
          {topThree.length > 0 && (
            <div className="flex items-end justify-center gap-4 py-6">
              {/* 2nd */}
              {topThree[1] && (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black text-white"
                    style={{ background: 'linear-gradient(135deg, #9ca3af, #6b7280)', boxShadow: '0 4px 20px rgba(156,163,175,0.3)' }}>
                    {topThree[1].name[0]}
                  </div>
                  <p className="text-xs font-semibold text-center max-w-[80px] truncate">{topThree[1].name.split(' ')[0]}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{topThree[1].score}pts</p>
                  <div className="w-20 h-20 rounded-t-xl flex items-end justify-center pb-2 text-2xl font-black"
                    style={{ background: 'rgba(156,163,175,0.15)', border: '1px solid rgba(156,163,175,0.2)' }}>🥈</div>
                </motion.div>
              )}
              {/* 1st */}
              {topThree[0] && (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white"
                      style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 8px 30px rgba(251,191,36,0.5)' }}>
                      {topThree[0].name[0]}
                    </div>
                    <span className="absolute -top-2 -right-2 text-xl">👑</span>
                  </div>
                  <p className="text-sm font-bold text-center max-w-[90px] truncate">{topThree[0].name.split(' ')[0]}</p>
                  <p className="text-sm font-bold" style={{ color: '#fbbf24' }}>{topThree[0].score}pts</p>
                  <div className="w-24 h-28 rounded-t-xl flex items-end justify-center pb-2 text-2xl font-black"
                    style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}>🥇</div>
                </motion.div>
              )}
              {/* 3rd */}
              {topThree[2] && (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black text-white"
                    style={{ background: 'linear-gradient(135deg, #b45309, #92400e)', boxShadow: '0 4px 20px rgba(180,83,9,0.3)' }}>
                    {topThree[2].name[0]}
                  </div>
                  <p className="text-xs font-semibold text-center max-w-[80px] truncate">{topThree[2].name.split(' ')[0]}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{topThree[2].score}pts</p>
                  <div className="w-20 h-14 rounded-t-xl flex items-end justify-center pb-2 text-2xl font-black"
                    style={{ background: 'rgba(180,83,9,0.12)', border: '1px solid rgba(180,83,9,0.2)' }}>🥉</div>
                </motion.div>
              )}
            </div>
          )}

          {/* Score Breakdown Legend */}
          <div className="glass-card p-3 flex gap-4 flex-wrap text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1"><BookOpen size={11} style={{ color: '#6366f1' }} /> Resource upload = 5pts</span>
            <span className="flex items-center gap-1"><Users size={11} style={{ color: '#10b981' }} /> Peer connection = 2pts</span>
            <span className="flex items-center gap-1"><Bookmark size={11} style={{ color: '#f59e0b' }} /> Job bookmark = 1pt</span>
          </div>

          {/* Full List */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-glass)' }}>
              <p className="font-semibold text-sm">Full Rankings ({leaderboard.length})</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {leaderboard.map((entry, i) => {
                const isMe = String(entry._id) === String(user?._id);
                const rs = RANK_STYLES[entry.rank];
                return (
                  <motion.div key={entry._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/3"
                    style={isMe ? { background: 'rgba(99,102,241,0.08)', borderLeft: '2px solid #6366f1' } : {}}>
                    {/* Rank */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={rs ? { background: rs.bg, color: rs.color, border: rs.border } : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                      {rs ? rs.icon : `#${entry.rank}`}
                    </div>
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${isMe ? '#6366f1' : '#475569'}, ${isMe ? '#06b6d4' : '#334155'})` }}>
                      {entry.avatar ? <img src={entry.avatar} alt="" className="w-full h-full object-cover rounded-full" /> : entry.name[0]}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate flex items-center gap-1">
                        {entry.name} {isMe && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#6366f1' }}>You</span>}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{entry.rollNumber} · {entry.branch}{entry.year ? ` · Y${entry.year}` : ''}</p>
                    </div>
                    {/* Breakdown */}
                    <div className="hidden sm:flex gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1"><BookOpen size={10} /> {entry.breakdown.resources}</span>
                      <span className="flex items-center gap-1"><Users size={10} /> {entry.breakdown.connections}</span>
                    </div>
                    {/* Score */}
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: rs?.color || (isMe ? '#6366f1' : 'var(--text-primary)') }}>
                        {entry.score}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>pts</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
