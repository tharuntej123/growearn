'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ROLE_INFO } from '@/lib/constants';
import { toast } from 'sonner';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('STUDENT' | 'LEARNER' | 'COMPANY' | 'EMPLOYER' | 'MENTOR' | 'PROFESSIONAL' | 'FREELANCER' | 'ADMIN')[];
  fallbackUrl?: string;
  roleName?: string;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallbackUrl,
  roleName = 'this section',
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      toast.error('Authentication required. Please log in.');
      router.push('/login');
      return;
    }

    const currentRole = user.role?.toUpperCase();
    const isAllowed = allowedRoles.some((r) => r.toUpperCase() === currentRole || currentRole === 'ADMIN');

    if (!isAllowed) {
      const userDashboard = ROLE_INFO[user.role]?.defaultDashboard || fallbackUrl || '/feed';
      toast.error(
        `Access restricted: Only ${roleName} accounts can access this page. Redirecting to your dashboard.`
      );
      router.push(userDashboard);
    }
  }, [user, isLoading, allowedRoles, router, fallbackUrl, roleName]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Verifying role permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currentRole = user.role?.toUpperCase();
  const isAllowed = allowedRoles.some((r) => r.toUpperCase() === currentRole || currentRole === 'ADMIN');
  if (!isAllowed) return null;

  return <>{children}</>;
}
