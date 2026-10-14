"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, UserPlus, BookOpen, Users, Briefcase, Newspaper } from "lucide-react";

const features = [
  { icon: BookOpen, label: "Learning Hub",  desc: "Notes, PDFs & PYQs",       color: "#4F46E5" },
  { icon: Users,    label: "Peer Network",  desc: "Connect with classmates",   color: "#16A34A" },
  { icon: Briefcase,label: "Opportunities", desc: "Jobs & internships",         color: "#D97706" },
  { icon: Newspaper,label: "Campus Feed",   desc: "Announcements & posts",      color: "#0284C7" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-lg"
            style={{ background: "var(--primary)" }}>
            <GraduationCap size={32} color="white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            CampusGrid
          </h1>
          <p className="text-lg mb-2" style={{ color: "var(--text-secondary)" }}>
            Smart Campus Operating System
          </p>
          <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
            The unified platform for resources, opportunities, networking, and campus life.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 mb-14"
        >
          <Link href="/login" className="btn-primary py-2.5 px-7 text-sm">
            Sign In <ArrowRight size={15} />
          </Link>
          <Link href="/register" className="btn-secondary py-2.5 px-7 text-sm">
            <UserPlus size={15} /> Create Account
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl"
        >
          {features.map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2"
                style={{ background: `${color}14` }}>
                <Icon size={17} style={{ color }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <footer className="py-4 text-center text-xs" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
        © {new Date().getFullYear()} CampusGrid · Built for students, by students
      </footer>
    </div>
  );
}
