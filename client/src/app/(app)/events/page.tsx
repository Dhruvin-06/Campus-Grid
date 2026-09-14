'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { eventsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Users, ExternalLink, Clock, Tag } from 'lucide-react';
import { format, isPast } from 'date-fns';

const EVENT_TYPES = ['all', 'fest', 'hackathon', 'seminar', 'workshop', 'sports', 'cultural', 'other'];
const TYPE_COLORS: Record<string, string> = {
  fest: '#ec4899', hackathon: '#6366f1', seminar: '#06b6d4', workshop: '#10b981',
  sports: '#f59e0b', cultural: '#8b5cf6', other: '#6b7280',
};
const TYPE_EMOJIS: Record<string, string> = {
  fest: '🎉', hackathon: '💻', seminar: '🎓', workshop: '🔧', sports: '🏆', cultural: '🎭', other: '📅',
};

interface Event {
  _id: string; title: string; description: string; type: string;
  date: string; endDate: string; venue: string; organizer: any;
  rsvps: any[]; maxAttendees: number; registrationLink: string;
  tags: string[]; isFeatured: boolean;
}

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [rsvping, setRsvping] = useState<string | null>(null);

  useEffect(() => { fetchEvents(); }, [typeFilter, upcomingOnly]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (upcomingOnly) params.upcoming = 'true';
      const res = await eventsApi.getAll(params);
      setEvents(res.data.events || []);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  const handleRSVP = async (eventId: string) => {
    setRsvping(eventId);
    try {
      const res = await eventsApi.rsvp(eventId);
      setEvents((prev) => prev.map((e) => {
        if (e._id !== eventId) return e;
        const myId = user?._id;
        const rsvps = res.data.rsvped
          ? [...e.rsvps, { _id: myId }]
          : e.rsvps.filter((r: any) => String(r._id || r) !== String(myId));
        return { ...e, rsvps };
      }));
      toast.success(res.data.rsvped ? 'RSVP confirmed! 🎉' : 'RSVP cancelled');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setRsvping(null); }
  };

  const isRsvped = (event: Event) => event.rsvps?.some((r: any) => String(r._id || r) === String(user?._id));
  const isFull = (event: Event) => event.maxAttendees > 0 && event.rsvps?.length >= event.maxAttendees;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar size={26} style={{ color: '#ec4899' }} /> Campus Events
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Discover fests, hackathons, workshops & more</p>
        </div>
        <button onClick={() => setUpcomingOnly(!upcomingOnly)}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: upcomingOnly ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'rgba(255,255,255,0.05)',
            color: upcomingOnly ? 'white' : 'var(--text-secondary)',
          }}>
          {upcomingOnly ? '📅 Upcoming' : '📋 All Events'}
        </button>
      </div>

      {/* Type Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        {EVENT_TYPES.map((type) => (
          <button key={type} onClick={() => setTypeFilter(type)}
            className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all"
            style={{
              background: typeFilter === type
                ? (type === 'all' ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : TYPE_COLORS[type])
                : 'rgba(255,255,255,0.06)',
              color: typeFilter === type ? 'white' : 'var(--text-secondary)',
            }}>
            {type === 'all' ? '🌟 All' : `${TYPE_EMOJIS[type]} ${type}`}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-72 rounded-xl" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Calendar size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold mb-2">No events found</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Check back later or explore all events</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event, i) => {
            const rsvped = isRsvped(event);
            const full = isFull(event);
            const past = isPast(new Date(event.date));
            const color = TYPE_COLORS[event.type] || '#6b7280';

            return (
              <motion.div key={event._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card overflow-hidden flex flex-col">
                {/* Banner */}
                <div className="h-3 relative" style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}>
                  {event.isFeatured && (
                    <span className="absolute right-2 top-1 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.9)', color: color }}>⭐ Featured</span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{ background: `${color}20`, color }}>
                      {TYPE_EMOJIS[event.type]} {event.type}
                    </span>
                    {past && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(107,114,128,0.2)', color: '#6b7280' }}>Past</span>}
                  </div>
                  <h3 className="font-bold text-sm mb-2 leading-snug">{event.title}</h3>
                  {event.description && (
                    <p className="text-xs mb-3 line-clamp-2 flex-1" style={{ color: 'var(--text-secondary)' }}>{event.description}</p>
                  )}
                  <div className="space-y-1.5 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                    <p className="flex items-center gap-1.5">
                      <Clock size={11} />
                      {format(new Date(event.date), 'dd MMM yyyy, hh:mm a')}
                    </p>
                    {event.venue && (
                      <p className="flex items-center gap-1.5">
                        <MapPin size={11} /> {event.venue}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5">
                      <Users size={11} />
                      {event.rsvps?.length || 0} going
                      {event.maxAttendees > 0 ? ` / ${event.maxAttendees}` : ''}
                    </p>
                  </div>
                  {event.tags?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {event.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>#{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-auto">
                    {event.registrationLink && (
                      <a href={event.registrationLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl"
                        style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
                        <ExternalLink size={11} /> Register
                      </a>
                    )}
                    {!past && (
                      <button onClick={() => handleRSVP(event._id)} disabled={rsvping === event._id || (full && !rsvped)}
                        className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: rsvped ? 'rgba(16,185,129,0.2)' : full ? 'rgba(107,114,128,0.15)' : `${color}20`,
                          color: rsvped ? '#10b981' : full ? '#6b7280' : color,
                        }}>
                        {rsvping === event._id ? '...' : rsvped ? '✓ Going' : full ? 'Full' : "I'm Going"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
