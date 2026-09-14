'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types';
import { authApi } from '@/lib/api';
import { initSocket, disconnectSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

interface RegisterData {
  name: string;
  email: string;
  rollNumber: string;
  password: string;
  role?: string;
  branch: string;
  year?: number;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load stored auth state on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('campusgrid_token');
    const storedUser = localStorage.getItem('campusgrid_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      initSocket(storedToken);
    }
    setLoading(false);
  }, []);

  const persistAuth = (token: string, user: User) => {
    localStorage.setItem('campusgrid_token', token);
    localStorage.setItem('campusgrid_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    initSocket(token);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    persistAuth(res.data.token, res.data.user);
    router.push('/dashboard');
  }, [router]);

  const loginWithGoogle = useCallback(async () => {
    const idToken = await signInWithGoogle();
    const res = await authApi.googleLogin(idToken);

    if (res.data.needsProfile) {
      // New user — throw special error so the login page can show the modal
      const err: any = new Error('needsProfile');
      err.needsProfile = true;
      err.setupToken = res.data.setupToken;
      err.prefill = res.data.prefill;
      throw err;
    }

    persistAuth(res.data.token, res.data.user);
    router.push('/dashboard');
  }, [router]);

  const register = useCallback(async (data: RegisterData) => {
    const res = await authApi.register(data);
    persistAuth(res.data.token, res.data.user);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem('campusgrid_token');
    localStorage.removeItem('campusgrid_user');
    setUser(null);
    setToken(null);
    disconnectSocket();
    router.push('/login');
  }, [router]);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem('campusgrid_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
