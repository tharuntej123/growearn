'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'LEARNER' | 'PROFESSIONAL' | 'MENTOR' | 'EMPLOYER' | 'ADMIN' | 'STUDENT' | 'FREELANCER' | 'COMPANY';
  avatarUrl?: string | null;
  headline?: string | null;
  location?: string | null;
  bio?: string | null;
  profile?: {
    title?: string | null;
    careerGoal?: string | null;
    hourlyRate?: number | null;
    yearsOfExperience?: number;
    aiScore?: number;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    portfolioUrl?: string | null;
    companyName?: string | null;
  } | null;
  skills?: { id: string; proficiencyLevel: string; skill: { id: string; name: string } }[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (name: string, email: string, password: string, confirmPassword: string, role?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  selectRole: (role: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_STORAGE_KEY = 'ufp_user_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const updateUserState = (newUser: User | null) => {
    setUser(newUser);
    if (typeof window !== 'undefined') {
      try {
        if (newUser) {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
        } else {
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      } catch {}
    }
  };

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user) {
          updateUserState(json.data.user);
        } else {
          updateUserState(null);
        }
      } else {
        updateUserState(null);
      }
    } catch {
      // If network fails, keep current state or null
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. First hydrate quickly from localStorage cache if present
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(USER_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setUser(parsed);
          setIsLoading(false);
        }
      } catch {}
    }

    // 2. Validate session with server in background
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error?.message || 'Login failed' };
      }
      const loggedUser = data.data?.user;
      if (loggedUser) {
        updateUserState(loggedUser);
        setIsLoading(false);
      } else {
        await refreshUser();
      }
      return { success: true, user: loggedUser };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string, role?: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error?.message || 'Registration failed' };
      }
      const newUser = data.data?.user;
      if (newUser) {
        updateUserState(newUser);
        setIsLoading(false);
      } else {
        await refreshUser();
      }
      return { success: true, user: newUser };
    } catch {
      return { success: false, error: 'Network error during registration' };
    }
  };

  const selectRole = async (role: string) => {
    try {
      const res = await fetch('/api/auth/role-select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error?.message || 'Role selection failed' };
      }
      if (data.data?.user) {
        updateUserState(data.data.user);
      } else {
        await refreshUser();
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to update role' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      updateUserState(null);
      router.push('/');
    } catch {
      updateUserState(null);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        selectRole,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
