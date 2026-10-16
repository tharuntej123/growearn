'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ROLE_INFO } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

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
      router.push('/login');
      return;
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              You need to be signed in to access the {roleName}. Please log in with your credentials to continue.
            </p>
          </div>
          <Link href="/login" className="block pt-2">
            <Button variant="default" className="w-full gap-2 font-semibold shadow-md">
              Proceed to Sign In <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentRole = user.role?.toUpperCase();
  const isAllowed = allowedRoles.some((r) => r.toUpperCase() === currentRole || currentRole === 'ADMIN');

  if (!isAllowed) {
    const userDashboard = ROLE_INFO[user.role]?.defaultDashboard || fallbackUrl || '/feed';
    const displayRole = user.role === 'EMPLOYER' || user.role === 'COMPANY'
      ? 'Company'
      : user.role === 'STUDENT' || user.role === 'LEARNER'
      ? 'Learner'
      : user.role === 'PROFESSIONAL' || user.role === 'FREELANCER'
      ? 'Freelancer'
      : user.role === 'MENTOR'
      ? 'Mentor'
      : user.role;

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-amber-200 rounded-3xl p-8 text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              This section is strictly for {roleName} accounts. Your account is registered as <strong className="text-slate-800 uppercase">{user.role}</strong>. You have access only to your {displayRole} workspace.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Link href={userDashboard} className="block">
              <Button variant="default" className="w-full gap-2 font-semibold shadow-md">
                Go to Your {displayRole} Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

