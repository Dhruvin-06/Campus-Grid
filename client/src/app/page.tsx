'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, UserPlus } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      </div>

      <div className="w-full max-w-lg relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
            <GraduationCap size={40} color="white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">CampusGrid</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-lg mb-8 max-w-md mx-auto">
            The smart operating system for your entire campus life. Connect, learn, and grow.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/login" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 text-base">
            Sign In <ArrowRight size={18} />
          </Link>
          <Link href="/register" className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 text-base">
            <UserPlus size={18} /> Create Account
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
