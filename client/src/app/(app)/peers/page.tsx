'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usersApi } from '@/lib/api';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Users, UserPlus, MessageSquare, Star, Search } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

const SKILL_COLORS = [
  '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

export default function PeersPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState<Set<string>>(new Set(user?.connections?.map((c) => typeof c === 'string' ? c : c._id) || []));

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await usersApi.getPeerMatches();
        setMatches(res.data.matches || []);
      } catch (err: any) {
        if (err.response?.data?.message) {
          toast(err.response.data.message, { icon: '💡' });
        }
      } finally { setLoading(false); }
    };
    fetchMatches();
  }, []);

  const handleConnect = async (userId: string) => {
    setConnecting((prev) => new Set(prev).add(userId));
    try {
      await usersApi.sendConnect(userId);
      setConnected((prev) => new Set(prev).add(userId));
      toast.success('Connection request sent! 🤝');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setConnecting((prev) => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };

  const getSkillColor = (skill: string) => SKILL_COLORS[skill.charCodeAt(0) % SKILL_COLORS.length];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users size={26} style={{ color: 'var(--color-success)' }} />
          Peer Network
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Students matched based on your skills and interests
        </p>
      </div>

      {/* Your skills */}
      {user?.skills && user.skills.length > 0 && (
        <div className="glass-card p-5">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Star size={16} style={{ color: 'var(--color-warning)' }} />
            Your Skills (used for matching)
          </p>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill) => (
              <span key={skill} className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: `${getSkillColor(skill)}20`, color: getSkillColor(skill), border: `1px solid ${getSkillColor(skill)}30` }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No skills warning */}
      {(!user?.skills || user.skills.length === 0) && (
        <div className="glass-card p-5 border" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
          <p className="text-sm font-medium" style={{ color: '#fbbf24' }}>
            ⚠️ Add skills to your profile to get peer matches!
          </p>
          <Link href="/profile" className="text-xs mt-1 inline-block" style={{ color: 'var(--color-primary-light)' }}>
            Go to Profile →
          </Link>
        </div>
      )}

      {/* Peer matches grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="skeleton w-14 h-14 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {Array(4).fill(0).map((_, j) => <div key={j} className="skeleton h-6 w-16 rounded-full" />)}
              </div>
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Users size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-semibold">No peer matches found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Add more skills to your profile to find students with similar interests.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Found {matches.length} students with overlapping skills
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((peer, i) => {
              const commonSkills = (user?.skills || []).filter((s) => peer.skills?.includes(s));
              const isConnected = connected.has(peer._id);
              const isConnecting = connecting.has(peer._id);

              return (
                <motion.div
                  key={peer._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="glass-card p-5 flex flex-col gap-4"
                >
                  {/* Profile header */}
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                      {peer.avatar
                        ? <img src={peer.avatar} alt={peer.name} className="w-full h-full object-cover rounded-full" />
                        : peer.name[0]
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{peer.name}</h3>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {peer.rollNumber} · {peer.branch}{peer.year ? ` · Y${peer.year}` : ''}
                      </p>
                      {peer.bio && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{peer.bio}</p>
                      )}
                    </div>
                  </div>

                  {/* Common skills */}
                  {commonSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        {commonSkills.length} common skill{commonSkills.length > 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {commonSkills.map((skill) => (
                          <span key={skill} className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: `${getSkillColor(skill)}20`, color: getSkillColor(skill) }}>
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All skills */}
                  <div className="flex flex-wrap gap-1.5">
                    {peer.skills?.filter((s) => !commonSkills.includes(s)).slice(0, 4).map((skill) => (
                      <span key={skill} className="tag">{skill}</span>
                    ))}
                  </div>

                  {/* Social links */}
                  {(peer.github || peer.linkedin) && (
                    <div className="flex gap-3">
                      {peer.github && (
                        <a href={peer.github} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
                          <FaGithub size={13} /> GitHub
                        </a>
                      )}
                      {peer.linkedin && (
                        <a href={peer.linkedin} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs hover:opacity-80" style={{ color: '#0077b5' }}>
                          <FaLinkedin size={13} /> LinkedIn
                        </a>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <button
                      id={`connect-${peer._id}`}
                      onClick={() => !isConnected && handleConnect(peer._id)}
                      disabled={isConnecting || isConnected}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        isConnected
                          ? 'opacity-60 cursor-default'
                          : 'btn-primary'
                      }`}
                      style={isConnected ? { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' } : {}}
                    >
                      {isConnecting
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : isConnected
                          ? '✓ Connected'
                          : <><UserPlus size={13} /> Connect</>
                      }
                    </button>
                    <Link href={`/chat?userId=${peer._id}`}
                      className="p-2 rounded-xl text-xs flex items-center justify-center transition-colors hover:bg-white/10"
                      style={{ border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                      <MessageSquare size={15} />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
