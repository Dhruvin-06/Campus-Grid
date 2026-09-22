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

    // Optimistic update
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
      const res = await usersApi.getAll({ search: q, role: 'student', limit: 5 });
      setSearchResults(res.data.users || []);
    } catch { }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Communication</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2">
          <MessageSquare size={26} className="text-indigo-400" /> Messages
        </h1>
        <p className="text-xs text-slate-400 mt-1">Real-time direct messaging with peers and campus community.</p>
      </div>

      <div className="saas-card overflow-hidden p-0" style={{ height: 'calc(100vh - 220px)' }}>
        <div className="flex h-full">
          {/* Sidebar — conversations */}
          <div className={`w-full md:w-80 border-r flex flex-col ${activeUser ? 'hidden md:flex' : 'flex'}`}
            style={{ borderColor: 'var(--border-glass)' }}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-glass)' }}>
              <h2 className="font-bold mb-3 text-sm text-slate-200 flex items-center gap-2">
                <MessageSquare size={16} style={{ color: 'var(--color-primary)' }} />
                Conversations
              </h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="chat-search" type="text" placeholder="Search students..."
                  className="input-field pl-9 py-2 text-sm"
                  value={searchQuery} onChange={(e) => searchUsers(e.target.value)} />
              </div>
              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1">
                  {searchResults.map((u) => (
                    <button key={u._id} onClick={() => { openConversation(u); setSearchResults([]); setSearchQuery(''); }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.rollNumber}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="skeleton w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3 w-3/4" />
                        <div className="skeleton h-2 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No conversations yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Search for a student to start chatting</p>
                </div>
              ) : conversations.map((conv) => {
                const other = conv.sender?._id === user?._id ? conv.receiver : conv.sender;
                const isOnline = onlineUsers.has(other?._id);
                return (
                  <button key={conv._id} id={`conv-${other?._id}`}
                    onClick={() => openConversation(other)}
                    className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-white/5 ${activeUser?._id === other?._id ? 'bg-white/5' : ''}`}>
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                        {other?.name?.[0]}
                      </div>
                      {isOnline && <div className="absolute -bottom-0.5 -right-0.5 online-dot" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{other?.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{conv.content}</p>
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
                  <MessageSquare size={56} className="mx-auto mb-4 opacity-20" />
                  <h3 className="font-semibold text-lg mb-1">Select a conversation</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Search for a student or click on a conversation to start chatting
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border-glass)' }}>
                  <button className="md:hidden p-1" onClick={() => setActiveUser(null)}>
                    <ArrowLeft size={20} />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                      {activeUser.name[0]}
                    </div>
                    {onlineUsers.has(activeUser._id) && <div className="absolute -bottom-0.5 -right-0.5 online-dot" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{activeUser.name}</p>
                    <p className="text-xs" style={{ color: onlineUsers.has(activeUser._id) ? 'var(--color-success)' : 'var(--text-muted)' }}>
                      {onlineUsers.has(activeUser._id) ? 'Online' : 'Offline'} · {activeUser.rollNumber}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {msgLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                  ) : messages.map((msg) => {
                    const isMine = (typeof msg.sender === 'string' ? msg.sender : msg.sender._id) === user?._id;
                    return (
                      <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? 'rounded-br-sm text-white'
                            : 'rounded-bl-sm'
                        }`}
                        style={{
                          background: isMine
                            ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                            : 'rgba(255,255,255,0.07)',
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
                      <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div className="flex gap-1 items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="flex items-center gap-3 p-4 border-t" style={{ borderColor: 'var(--border-glass)' }}>
                  <input
                    id="chat-message-input"
                    type="text"
                    placeholder={`Message ${activeUser.name}...`}
                    className="input-field flex-1"
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                  />
                  <button id="chat-send-btn" type="submit" disabled={!input.trim()}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: input.trim() ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'rgba(255,255,255,0.05)',
                      color: input.trim() ? 'white' : 'var(--text-muted)',
                    }}>
                    <Send size={18} />
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
