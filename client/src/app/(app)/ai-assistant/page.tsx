'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { aiApi, resourcesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bot, Send, Sparkles, BookOpen, ChevronDown, X,
  FileText, RotateCcw, Copy, Check, Plus, MessageSquare,
  Search, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; subject: string; _id: string }>;
  hasContext?: boolean;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  'Give me code in Java for print 1 to N',
  'Give me code in Python for Fibonacci series',
  'Explain binary search algorithm in simple terms',
  'Generate 10 practice MCQs for my syllabus',
  'Compare Array vs Linked List with Java code examples',
  'Summarize key formulas and theorems',
];

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.role === 'user') {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-xl text-xs sm:text-sm leading-relaxed text-white font-medium"
          style={{ background: 'var(--color-primary)' }}>
          {msg.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="flex gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
        <Bot size={15} style={{ color: '#C084FC' }} />
      </div>
      <div className="flex-1 max-w-[92%] sm:max-w-[88%] space-y-2">
        <div className="px-4 py-3 rounded-xl text-xs sm:text-sm leading-relaxed relative group bg-slate-900/60 border border-white/[0.07]">
          <div className="prose-dark whitespace-pre-wrap">
            {msg.content}
          </div>
          <button onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
            title="Copy response">
            {copied ? <Check size={13} style={{ color: '#34D399' }} /> : <Copy size={13} style={{ color: 'var(--text-muted)' }} />}
          </button>
        </div>

        {/* Source Citations */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400">Cited Sources:</span>
            {msg.sources.map((src) => (
              <span key={src._id} className="saas-badge saas-badge-indigo text-[10px]">
                <FileText size={10} />
                {src.title}
              </span>
            ))}
          </div>
        )}

        {msg.hasContext === false && (
          <p className="text-[11px] text-amber-400/80">
            * Response based on general AI model knowledge (no matching campus document found).
          </p>
        )}

        <p className="text-[10px] text-slate-500">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const res = await resourcesApi.getAll({ branch: user?.branch, limit: 20 });
        setResources(res.data.resources || []);
      } catch { /* silent */ }
    };
    loadResources();
  }, [user?.branch]);

  useEffect(() => {
    if (!selectedResource) { setSuggestedQuestions([]); return; }
    const getSuggestions = async () => {
      try {
        const res = await aiApi.suggest(selectedResource._id);
        setSuggestedQuestions(res.data.questions || []);
      } catch { /* silent */ }
    };
    getSuggestions();
  }, [selectedResource]);

  const sendMessage = useCallback(async (text?: string) => {
    const question = (text || input).trim();
    if (!question || loading) return;

    setInput('');
    const userMsg: Message = {
      id: Date.now() + '-u',
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await aiApi.ask({
        question,
        resourceId: selectedResource?._id,
        subject: selectedResource?.subject,
        branch: user?.branch,
      });

      const assistantMsg: Message = {
        id: Date.now() + '-a',
        role: 'assistant',
        content: res.data.answer,
        sources: res.data.sources,
        hasContext: res.data.hasContext,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'AI service temporarily unavailable');
      setMessages((prev) => [...prev, {
        id: Date.now() + '-err',
        role: 'assistant',
        content: 'I encountered an error processing your query. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, selectedResource, user?.branch]);

  // Handle URL query parameter if passed from search bar
  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      sendMessage(initialQuery);
    }
  }, [initialQuery, sendMessage, messages.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedResource(null);
    setSuggestedQuestions([]);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4">
      {/* ─── Left Sidebar: Chats & Context Panel ─────────────────────────────── */}
      <div className="w-full md:w-64 flex-shrink-0 saas-card p-4 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles size={13} className="text-violet-400" /> Conversations
            </h2>
            <button onClick={clearChat}
              className="p-1 rounded hover:bg-white/10 text-slate-400 transition-colors"
              title="New Chat">
              <Plus size={16} />
            </button>
          </div>

          <button onClick={clearChat}
            className="w-full btn-secondary text-xs flex items-center justify-center gap-1.5 py-2">
            <RotateCcw size={13} /> New Conversation
          </button>

          {/* Context Document Picker */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <p className="text-[11px] font-semibold text-slate-400">Grounded Context</p>
            <div className="relative">
              <button
                onClick={() => setShowResourcePicker(!showResourcePicker)}
                className="w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between transition-all bg-slate-900 border border-white/[0.08]"
              >
                <div className="flex items-center gap-2 truncate pr-1">
                  <BookOpen size={13} className={selectedResource ? 'text-indigo-400' : 'text-slate-500'} />
                  <span className="truncate text-slate-300">
                    {selectedResource ? selectedResource.title : 'All syllabus notes'}
                  </span>
                </div>
                <ChevronDown size={13} className="text-slate-500 flex-shrink-0" />
              </button>

              {/* Resource Picker Dropdown */}
              <AnimatePresence>
                {showResourcePicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 mt-1 z-30 rounded-lg bg-slate-900 border border-white/[0.1] shadow-2xl max-h-48 overflow-y-auto">
                    <button onClick={() => { setSelectedResource(null); setShowResourcePicker(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-indigo-400 hover:bg-white/[0.05] font-medium border-b border-white/[0.05]">
                      All campus documents
                    </button>
                    {resources.map((r) => (
                      <button key={r._id} onClick={() => { setSelectedResource(r); setShowResourcePicker(false); }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-white/[0.05] truncate text-slate-300">
                        {r.title}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.05] text-[10px] text-slate-500">
          Powered by CampusGrid RAG & Code Engines
        </div>
      </div>

      {/* ─── Right Main AI Conversation Interface ─────────────────────────────── */}
      <div className="flex-1 saas-card p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
        {/* Messages Stream Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-500/10 border border-violet-500/30">
                <Sparkles size={24} className="text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">CampusGrid AI Copilot</h2>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Your intelligent campus assistant. Ask questions about your learning resources, code algorithms, or syllabus documents.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full pt-2">
                {(suggestedQuestions.length > 0 ? suggestedQuestions.slice(0, 4) : QUICK_PROMPTS.slice(0, 4)).map((prompt) => (
                  <button key={prompt} onClick={() => sendMessage(prompt)}
                    className="text-left text-xs p-2.5 rounded-lg bg-slate-900/80 border border-white/[0.06] hover:border-violet-500/40 transition-all text-slate-300">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
          )}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-slate-400">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-500/15 border border-violet-500/30">
                <Bot size={15} className="text-violet-400" />
              </div>
              <div className="flex items-center gap-1">
                <span>Analyzing documents & generating response...</span>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Controls */}
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask questions about your study materials..."
            rows={1}
            className="flex-1 bg-slate-900/90 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none resize-none"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary py-2.5 px-4 rounded-xl text-xs flex-shrink-0"
            style={{ opacity: !input.trim() || loading ? 0.5 : 1 }}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

