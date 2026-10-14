"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { Eye, EyeOff, GraduationCap, ArrowRight, Lock, Mail } from "lucide-react";
import GoogleProfileModal from "@/components/GoogleProfileModal";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [profileModal, setProfileModal] = useState<{
    setupToken: string;
    prefill: { name: string; email: string };
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.needsProfile) {
        setProfileModal({ setupToken: err.setupToken, prefill: err.prefill });
      } else {
        toast.error(err.response?.data?.message || err.message || "Google sign-in failed");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-96 flex-col justify-between p-10"
        style={{ background: "var(--primary)", color: "white" }}>
        <div className="flex items-center gap-2.5">
          <GraduationCap size={24} color="white" />
          <span className="font-bold text-lg">CampusGrid</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-3 leading-tight">
            Your campus life,<br />unified.
          </h2>
          <p className="text-sm opacity-80 leading-relaxed">
            Access resources, connect with peers, explore opportunities and stay updated — all in one place.
          </p>
        </div>
        <p className="text-xs opacity-50">© {new Date().getFullYear()} CampusGrid</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        {profileModal && (
          <GoogleProfileModal
            setupToken={profileModal.setupToken}
            prefill={profileModal.prefill}
            onSuccess={(token, user) => {
              setProfileModal(null);
              localStorage.setItem("campusgrid_token", token);
              localStorage.setItem("campusgrid_user", JSON.stringify(user));
              window.location.href = "/dashboard";
            }}
            onClose={() => setProfileModal(null)}
          />
        )}

        <div className="w-full max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 lg:hidden mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--primary)" }}>
                <GraduationCap size={17} color="white" />
              </div>
              <span className="font-bold" style={{ color: "var(--text-primary)" }}>CampusGrid</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Sign in</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Enter your credentials to continue
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}>
                  Email address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }} />
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="your@college.edu"
                    className="input-field pl-10"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }} />
                  <input
                    id="login-password"
                    type={showPass ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="input-field pl-10 pr-10"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button id="login-submit" type="submit" disabled={loading} className="btn-primary w-full mt-1">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>Sign in</span><ArrowRight size={15} /></>
                }
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>

            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" width="17" height="17">
                  <g transform="matrix(1,0,0,1,27.009001,-39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                  </g>
                </svg>
              )}
              Continue with Google
            </button>

            <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
              No account?{" "}
              <Link href="/register" className="font-semibold" style={{ color: "var(--primary)" }}>
                Register here
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
