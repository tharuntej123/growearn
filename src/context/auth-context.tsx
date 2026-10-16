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
  signInWithGoogle: (role?: string, redirectUrl?: string) => void;
  selectRole: (role: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user) {
          setUser(json.data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch of authoritative server session
    refreshUser();
  }, []);

  const signInWithGoogle = (role?: string, redirectUrl?: string) => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (redirectUrl) params.set('redirect', redirectUrl);
    const queryString = params.toString();
    window.location.href = `/api/auth/google/init${queryString ? `?${queryString}` : ''}`;
  };

  const selectRole = async (role: string) => {
    try {
      const res = await fetch('/api/auth/role-select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        if (!res.ok) {
          return { success: false, error: `Server error (${res.status}). Please try again.` };
        }
      }

      if (!res.ok || !data?.success) {
        const errorMsg =
          typeof data?.error === 'string'
            ? data.error
            : data?.error?.message || data?.message || 'Role selection failed';
        return { success: false, error: errorMsg };
      }

      if (data.data?.user) {
        setUser(data.data.user);
      } else {
        await refreshUser();
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to update role. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
    } catch {
      setUser(null);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
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
