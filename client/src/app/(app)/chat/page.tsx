'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatApi } from '@/lib/api';
import { usersApi } from '@/lib/api';
import { Message, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';
import { MessageSquare, Send, Search, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typing, setTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const socket = getSocket();

  useEffect(() => {
    fetchConversations();
    if (socket) {
      socket.on('message:receive', handleReceiveMessage);
      socket.on('users:online', (ids: string[]) => setOnlineUsers(new Set(ids)));
      socket.on('typing:indicator', ({ userId: uid, isTyping }: { userId: string; isTyping: boolean }) => {
        if (uid === activeUser?._id) setTyping(isTyping);
      });
      socket.emit('users:getOnline');
      socket.on('user:online', ({ userId: uid, online }: { userId: string; online: boolean }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          if (online) next.add(uid); else next.delete(uid);
          return next;
        });
      });
    }
    return () => {
      socket?.off('message:receive');
      socket?.off('typing:indicator');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await chatApi.getConversations();
      setConversations(res.data.conversations || []);
    } catch { } finally { setLoading(false); }
  };

  const openConversation = async (targetUser: User) => {
    setActiveUser(targetUser);
    setMsgLoading(true);
    try {
      const res = await chatApi.getConversation(targetUser._id);
      setMessages(res.data.messages || []);
      socket?.emit('message:read', { senderId: targetUser._id });
    } catch { toast.error('Failed to load messages'); }
    finally { setMsgLoading(false); }
  };

  const handleReceiveMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
    fetchConversations();
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeUser || !socket) return;

    socket.emit('message:send', { receiverId: activeUser._id, content: input.trim() });

    const optimistic: Message = {
      _id: Date.now().toString(),
      sender: user as User,
      receiver: activeUser,
      content: input.trim(),
      type: 'text',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    socket.emit('typing:stop', { receiverId: activeUser._id });
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    if (!activeUser || !socket) return;
    socket.emit('typing:start', { receiverId: activeUser._id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing:stop', { receiverId: activeUser._id });
    }, 1500);
  };

  const searchUsers = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const res = await usersApi.getAll({ search: q, limit: 10 });
      setSearchResults(res.data.users || []);
    } catch { }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <MessageSquare size={20} style={{ color: 'var(--primary)' }} /> Messages
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Direct messaging with peers.</p>
      </div>

      <div className="card overflow-hidden p-0" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className={`w-full md:w-72 flex flex-col ${activeUser ? 'hidden md:flex' : 'flex'}`}
            style={{ borderRight: '1px solid var(--border)' }}>
            <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="chat-search" type="text" placeholder="Search students..."
                  className="input-field pl-9 py-2 text-sm"
                  value={searchQuery} onChange={(e) => searchUsers(e.target.value)} />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {searchResults.map((u) => (
                    <button key={u._id} onClick={() => { openConversation(u); setSearchResults([]); setSearchQuery(''); }}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-white/[0.04] transition-colors text-left">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs text-white flex-shrink-0"
                        style={{ background: 'var(--primary)' }}>
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.rollNumber}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-3 space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 rounded animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
                        <div className="h-2 w-full rounded animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare size={28} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No conversations yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Search to start chatting</p>
                </div>
              ) : conversations.map((conv) => {
                const other = conv.sender?._id === user?._id ? conv.receiver : conv.sender;
                const isOnline = onlineUsers.has(other?._id);
                return (
                  <button key={conv._id} id={`conv-${other?._id}`}
                    onClick={() => openConversation(other)}
                    className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-white/[0.03]"
                    style={{ background: activeUser?._id === other?._id ? 'var(--primary-muted)' : 'transparent' }}>
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm text-white"
                        style={{ background: 'var(--primary)' }}>
                        {other?.name?.[0]}
                      </div>
                      {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: 'var(--success)', borderColor: 'var(--bg-secondary)' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{other?.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{conv.content}</p>
                    </div>
                    <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: false })}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat area */}
          <div className={`flex-1 flex flex-col ${activeUser ? 'flex' : 'hidden md:flex'}`}>
            {!activeUser ? (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageSquare size={40} className="mx-auto mb-3 opacity-15" />
                  <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Select a conversation</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Search for a student or click on a conversation to start chatting
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <button className="md:hidden p-1 rounded-md hover:bg-white/5" onClick={() => setActiveUser(null)} aria-label="Back">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm text-white"
                      style={{ background: 'var(--primary)' }}>
                      {activeUser.name[0]}
                    </div>
                    {onlineUsers.has(activeUser._id) && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: 'var(--success)', borderColor: 'var(--surface)' }} />}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{activeUser.name}</p>
                    <p className="text-xs" style={{ color: onlineUsers.has(activeUser._id) ? 'var(--success)' : 'var(--text-muted)' }}>
                      {onlineUsers.has(activeUser._id) ? 'Online' : 'Offline'} · {activeUser.rollNumber}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {msgLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                    </div>
                  ) : messages.map((msg) => {
                    const isMine = (typeof msg.sender === 'string' ? msg.sender : msg.sender._id) === user?._id;
                    return (
                      <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[75%] px-3 py-2 rounded-lg text-sm"
                          style={{
                            background: isMine ? 'var(--primary)' : 'var(--surface)',
                            color: isMine ? 'white' : 'var(--text-primary)',
                          }}>
                          <p>{msg.content}</p>
                          <p className="text-xs mt-1 opacity-60 text-right">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {typing && (
                    <div className="flex justify-start">
                      <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface)' }}>
                        <div className="flex gap-1 items-center">
                          <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="flex items-center gap-2 p-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <input
                    id="chat-message-input"
                    type="text"
                    placeholder={`Message ${activeUser.name}...`}
                    className="input-field flex-1"
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                  />
                  <button id="chat-send-btn" type="submit" disabled={!input.trim()}
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      background: input.trim() ? 'var(--primary)' : 'var(--surface)',
                      color: input.trim() ? 'white' : 'var(--text-muted)',
                    }}>
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
