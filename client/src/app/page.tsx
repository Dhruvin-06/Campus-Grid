'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, UserPlus } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: 'var(--primary)' }}>
            <GraduationCap size={32} color="white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            CampusGrid
          </h1>
          <p className="text-base mb-8 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
            The smart platform for your entire campus life. Connect, learn, and grow.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href="/login" className="btn-primary w-full sm:w-auto py-2.5 px-6 text-sm">
            Sign In <ArrowRight size={16} />
          </Link>
          <Link href="/register" className="btn-secondary w-full sm:w-auto py-2.5 px-6 text-sm">
            <UserPlus size={16} /> Create Account
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
