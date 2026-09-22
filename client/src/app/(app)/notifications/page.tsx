'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationsApi } from '@/lib/api';
import {
  Bell, CheckCheck, Trash2, MessageSquare, Briefcase, BookOpen,
  Newspaper, MapPin, Users, Info, AlertTriangle, CheckCircle2, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  _id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

const typeConfig = {
  info:    { color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  Icon: Info },
  success: { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  Icon: CheckCircle2 },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  Icon: AlertTriangle },
  error:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   Icon: X },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NotificationItem({ notif, onMarkRead, onDelete }: {
  notif: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = typeConfig[notif.type] || typeConfig.info;
  const { Icon } = cfg;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      className="flex items-start gap-4 p-4 rounded-xl group relative transition-all"
      style={{
        background: notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.06)',
        border: `1px solid ${notif.read ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.2)'}`,
      }}
    >
      {/* Unread dot */}
      {!notif.read && (
        <div className="absolute top-4 left-4 w-2 h-2 rounded-full"
          style={{ background: '#6366f1' }} />
      )}

      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${!notif.read ? 'ml-3' : ''}`}
        style={{ background: cfg.bg }}>
        <Icon size={16} style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed" style={{ color: notif.read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
          {notif.message}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {timeAgo(notif.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
        {!notif.read && (
          <button
            onClick={() => onMarkRead(notif._id)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
            title="Mark as read"
          >
            <CheckCheck size={14} style={{ color: '#10b981' }} />
          </button>
        )}
        <button
          onClick={() => onDelete(notif._id)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
          title="Delete"
        >
          <Trash2 size={14} style={{ color: '#f87171' }} />
        </button>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getAll({
        unreadOnly: filter === 'unread' ? 'true' : undefined,
        limit: 50,
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    const notif = notifications.find((n) => n._id === id);
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (notif && !notif.read) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all notifications?')) return;
    try {
      await notificationsApi.clearAll();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const displayed = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Activity & Alerts</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2">
            <Bell size={26} className="text-indigo-400" /> Notifications
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread updates requiring attention` : 'All caught up! No unread notifications.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-all hover:bg-white/5"
              style={{ color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={handleClearAll}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-all hover:bg-white/5"
              style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'unread'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${filter === f ? 'text-white' : ''}`}
            style={{
              background: filter === f ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filter === f ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
              color: filter === f ? '#a5b4fc' : 'var(--text-muted)',
            }}>
            {f === 'unread' ? `Unread (${unreadCount})` : 'All'}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(99,102,241,0.1)' }}>
            <Bell size={28} style={{ color: '#6366f1' }} />
          </div>
          <h3 className="font-semibold text-lg mb-2">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            {filter === 'unread' ? "You're all caught up! 🎉" : "Notifications about opportunities, connections, and updates will appear here."}
          </p>
        </motion.div>
      ) : (
        <motion.div layout className="space-y-2">
          <AnimatePresence mode="popLayout">
            {displayed.map((notif) => (
              <NotificationItem
                key={notif._id}
                notif={notif}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
