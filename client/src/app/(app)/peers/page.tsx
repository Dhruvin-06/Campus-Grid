'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usersApi } from '@/lib/api';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Users, UserPlus, MessageSquare, Star, Search, Check, X, Clock } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

const SKILL_COLORS = [
  '#818cf8', '#38bdf8', '#4ade80', '#fbbf24', '#a78bfa',
  '#f87171', '#f472b6', '#2dd4bf', '#fb923c', '#a3e635',
];

export default function PeersPage() {
  const { user, refreshUser } = useAuth();
  const [matches, setMatches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState<Set<string>>(new Set(user?.connections?.map((c) => typeof c === 'string' ? c : c._id) || []));
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await usersApi.getPeerMatches();
        const fetchedMatches = res.data.matches || [];
        setMatches(fetchedMatches);
        // Seed pending set from server-side hasPendingRequest flag
        const pendingIds = new Set<string>(
          fetchedMatches.filter((m: any) => m.hasPendingRequest).map((m: any) => m._id)
        );
        setPending(pendingIds);
        // Also seed connected set from isConnected flag
        const connectedIds = new Set<string>(
          fetchedMatches.filter((m: any) => m.isConnected).map((m: any) => m._id)
        );
        setConnected((prev) => new Set([...prev, ...connectedIds]));
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
      setPending((prev) => new Set(prev).add(userId));
      toast.success('Connection request sent!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send request';
      if (msg === 'Connection request already sent') {
        setPending((prev) => new Set(prev).add(userId));
      }
      toast.error(msg);
    } finally {
      setConnecting((prev) => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };

  const handleAccept = async (requesterId: string) => {
    setActionInProgress(requesterId);
    try {
      await usersApi.acceptConnect(requesterId);
      toast.success('Connection accepted!');
      setConnected((prev) => new Set(prev).add(requesterId));
      if (refreshUser) await refreshUser();
    } catch {
      toast.error('Failed to accept connection request');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDecline = async (requesterId: string) => {
    setActionInProgress(requesterId);
    try {
      await usersApi.removeConnect(requesterId);
      toast.success('Connection request declined');
      if (refreshUser) await refreshUser();
    } catch {
      toast.error('Failed to decline request');
    } finally {
      setActionInProgress(null);
    }
  };

  const getSkillColor = (skill: string) => SKILL_COLORS[skill.charCodeAt(0) % SKILL_COLORS.length];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Users size={20} style={{ color: '#4ade80' }} />
          Peer Network
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Find students with complementary skills and interests.
        </p>
      </div>

      {/* Incoming Connection Requests */}
      {user?.connectionRequests && user.connectionRequests.length > 0 && (
        <div className="card p-5 border-l-4" style={{ borderLeftColor: 'var(--primary)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Clock size={16} style={{ color: 'var(--primary)' }} />
              Pending Connection Requests
              <span className="badge badge-primary">{user.connectionRequests.length}</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {user.connectionRequests.map((reqItem: any) => {
              const reqUser = typeof reqItem === 'object' ? reqItem : { _id: reqItem, name: 'Student' };
              const isProcessing = actionInProgress === reqUser._id;
              return (
                <div key={reqUser._id} className="p-3 rounded-lg border flex flex-col justify-between gap-3"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm text-white flex-shrink-0 overflow-hidden"
                      style={{ background: 'var(--primary)' }}>
                      {reqUser.avatar ? (
                        <img src={reqUser.avatar} alt={reqUser.name} className="w-full h-full object-cover" />
                      ) : (
                        reqUser.name?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{reqUser.name}</h4>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {reqUser.branch ? `${reqUser.branch}${reqUser.year ? ` · Year ${reqUser.year}` : ''}` : 'Campus peer'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleAccept(reqUser._id)}
                      disabled={isProcessing}
                      className="flex-1 btn-primary text-xs py-1.5"
                    >
                      <Check size={13} /> Accept
                    </button>
                    <button
                      onClick={() => handleDecline(reqUser._id)}
                      disabled={isProcessing}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      <X size={13} /> Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Your skills */}
      {user?.skills && user.skills.length > 0 && (
        <div className="card p-4">
          <p className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <Star size={14} style={{ color: '#fbbf24' }} />
            Your Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {user.skills.map((skill) => (
              <span key={skill} className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: `${getSkillColor(skill)}18`, color: getSkillColor(skill) }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No skills warning */}
      {(!user?.skills || user.skills.length === 0) && (
        <div className="card p-4" style={{ borderColor: 'rgba(234,179,8,0.3)' }}>
          <p className="text-sm font-medium" style={{ color: '#eab308' }}>
            Add skills to your profile to get peer matches.
          </p>
          <Link href="/profile" className="text-xs mt-1 inline-block" style={{ color: 'var(--primary)' }}>
            Go to Profile →
          </Link>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
                  <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={32} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No peer matches found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Add more skills to your profile to find students with similar interests.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Found {matches.length} students with overlapping skills
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((peer, i) => {
              const commonSkills = (user?.skills || []).filter((s) => peer.skills?.includes(s));
              const isConnected = connected.has(peer._id);
              const isConnecting = connecting.has(peer._id);
              const isPending = !isConnected && pending.has(peer._id);

              return (
                <motion.div
                  key={peer._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="card p-4 flex flex-col gap-3"
                >
                  {/* Profile */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm text-white flex-shrink-0 overflow-hidden"
                      style={{ background: 'var(--primary)' }}>
                      {peer.avatar
                        ? <img src={peer.avatar} alt={peer.name} className="w-full h-full object-cover rounded-full" />
                        : peer.name[0]
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{peer.name}</h3>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
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
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                        {commonSkills.length} common skill{commonSkills.length > 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {commonSkills.map((skill) => (
                          <span key={skill} className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ background: `${getSkillColor(skill)}18`, color: getSkillColor(skill) }}>
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other skills */}
                  <div className="flex flex-wrap gap-1">
                    {peer.skills?.filter((s) => !commonSkills.includes(s)).slice(0, 4).map((skill) => (
                      <span key={skill} className="tag">{skill}</span>
                    ))}
                  </div>

                  {/* Social */}
                  {(peer.github || peer.linkedin) && (
                    <div className="flex gap-3">
                      {peer.github && (
                        <a href={peer.github} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
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
                      onClick={() => !isConnected && !isPending && handleConnect(peer._id)}
                      disabled={isConnecting || isConnected || isPending}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                        isConnected || isPending ? '' : 'btn-primary'
                      }`}
                      style={
                        isConnected
                          ? { background: 'var(--success-muted)', color: 'var(--success)' }
                          : isPending
                          ? { background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }
                          : {}
                      }
                    >
                      {isConnecting
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : isConnected
                          ? '✓ Connected'
                          : isPending
                          ? '⏳ Request Sent'
                          : <><UserPlus size={13} /> Connect</>
                      }
                    </button>
                    <Link href={`/chat?userId=${peer._id}`}
                      className="p-2 rounded-lg text-xs flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)]"
                      style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
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
