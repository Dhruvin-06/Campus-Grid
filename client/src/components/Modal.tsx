'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const MAX_WIDTH_MAP: Record<string, string> = {
  'max-w-xs': '20rem',    // 320px
  'max-w-sm': '24rem',    // 384px
  'max-w-md': '28rem',    // 448px
  'max-w-lg': '32rem',    // 512px
  'max-w-xl': '36rem',    // 576px
  'max-w-2xl': '42rem',   // 672px
  'max-w-3xl': '48rem',   // 768px
  'max-w-4xl': '56rem',   // 896px
  'max-w-5xl': '64rem',   // 1024px
};

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  const resolvedMaxWidth = MAX_WIDTH_MAP[maxWidth] || maxWidth || '28rem';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card p-6 w-full max-h-[90vh] overflow-y-auto relative my-auto mx-auto"
            style={{
              maxWidth: resolvedMaxWidth,
              width: '100%',
              margin: 'auto',
              background: 'var(--bg-secondary, #111827)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.25)',
              borderRadius: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="flex items-center justify-between mb-5 pb-3 border-b" style={{ borderColor: 'var(--border-subtle, rgba(255,255,255,0.1))' }}>
                <h2 className="text-lg font-bold gradient-text">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                  title="Close"
                >
                  <X size={20} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

