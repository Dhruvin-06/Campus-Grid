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
  info:    { color: '#818cf8', bg: 'var(--primary-muted)', Icon: Info },
  success: { color: '#4ade80', bg: 'var(--success-muted)', Icon: CheckCircle2 },
  warning: { color: '#fbbf24', bg: 'var(--warning-muted)', Icon: AlertTriangle },
  error:   { color: '#f87171', bg: 'var(--danger-muted)',  Icon: X },
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className="flex items-start gap-3 p-3 rounded-lg group transition-colors"
      style={{
        background: notif.read ? 'transparent' : 'var(--primary-muted)',
        border: `1px solid ${notif.read ? 'var(--border)' : 'rgba(99,102,241,0.15)'}`,
      }}
    >
      {/* Unread dot */}
      {!notif.read && (
        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--primary)' }} />
      )}

      {/* Icon */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: cfg.bg }}>
        <Icon size={14} style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed" style={{ color: notif.read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
          {notif.message}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {timeAgo(notif.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {!notif.read && (
          <button onClick={() => onMarkRead(notif._id)}
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
            title="Mark as read" aria-label="Mark as read">
            <CheckCheck size={14} style={{ color: 'var(--success)' }} />
          </button>
        )}
        <button onClick={() => onDelete(notif._id)}
          className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
          title="Delete" aria-label="Delete notification">
          <Trash2 size={14} style={{ color: 'var(--danger)' }} />
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
      toast.success('All marked as read');
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
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Bell size={20} style={{ color: 'var(--primary)' }} /> Notifications
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-secondary text-xs py-1.5 px-3">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={handleClearAll} className="btn-danger text-xs py-1.5 px-3">
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
        {(['all', 'unread'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors"
            style={{
              background: filter === f ? 'var(--surface)' : 'transparent',
              color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>
            {f === 'unread' ? `Unread (${unreadCount})` : 'All'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={32} className="mx-auto mb-3 opacity-20" />
          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here.'}
          </p>
        </div>
      ) : (
        <motion.div layout className="space-y-2">
          <AnimatePresence mode="popLayout">
            {displayed.map((notif) => (
              <NotificationItem key={notif._id} notif={notif} onMarkRead={handleMarkRead} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
