'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoogleIcon } from '@/components/ui/google-icon';
import {
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Users,
  Briefcase,
  Building2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

type SelectedRoleKey = 'LEARNER' | 'FREELANCER' | 'MENTOR' | 'COMPANY';

interface RoleOption {
  key: SelectedRoleKey;
  title: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    key: 'LEARNER',
    title: 'Learner / Student',
    tagline: 'Learn & Master Skills',
    description: 'Follow AI career roadmaps, complete verified courses, and get 1-on-1 mentorship coaching.',
    icon: GraduationCap,
  },
  {
    key: 'FREELANCER',
    title: 'Freelancer',
    tagline: 'Work & Earn',
    description: 'Discover client projects, submit 1-click AI proposals, and build verified reputation.',
    icon: Briefcase,
  },
  {
    key: 'MENTOR',
    title: 'Expert Mentor',
    tagline: 'Coach & Teach',
    description: 'Host 1-on-1 coaching sessions, publish courses, and earn platform revenue.',
    icon: Users,
  },
  {
    key: 'COMPANY',
    title: 'Company',
    tagline: 'Hire & Scale',
    description: 'Post full-time and contract jobs, match top talent with AI, and hire verified professionals.',
    icon: Building2,
  },
];

function SignupContent() {
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<SelectedRoleKey>('LEARNER');
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const currentOption = ROLE_OPTIONS.find((r) => r.key === selectedRole) || ROLE_OPTIONS[0];

  const handleGoogleSignup = () => {
    setIsRedirecting(true);
    const params = new URLSearchParams();
    params.set('role', selectedRole);
    params.set('action', 'signup');
    window.location.assign(new URL(`/api/auth/google/init?${params.toString()}`, window.location.origin).href);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8FAF9] relative overflow-hidden">
      <div className="w-full max-w-2xl space-y-6 relative z-10">
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-sm mb-2">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Your GrowEarn Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Choose your role, then continue with Google to unlock your customized workspace.
          </p>
        </div>

        <Card className="bg-white border border-slate-200 shadow-md">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Step 1: Choose Your Dedicated Role
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Your selected role customizes your workspace, features, and permissions.
                </CardDescription>
              </div>
              <Badge variant="default" className="text-xs font-semibold">
                {currentOption.title}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-5">
            {/* 4 Primary Role Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedRole === opt.key;

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelectedRole(opt.key)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl text-white shrink-0 ${
                          isSelected ? 'bg-emerald-600' : 'bg-slate-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{opt.title}</p>
                        <p className="text-[11px] font-semibold text-emerald-700">{opt.tagline}</p>
                        <p className="text-[11px] text-slate-500 leading-snug pt-0.5 line-clamp-2">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Registration Notice</p>
                  <p className="leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Step 2: Google Authentication */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                <span>Step 2: Sign Up as {currentOption.title}</span>
                <span className="text-[11px] font-normal text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Google Verified Identity
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-emerald-100 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your selected role ({currentOption.title}) will be cryptographically preserved during Google OAuth authentication. You will be redirected directly to your customized workspace upon verification.
                </p>

                <Button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={isRedirecting}
                  isLoading={isRedirecting}
                  variant="outline"
                  className="w-full h-12 text-sm font-semibold flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-xs hover:border-slate-400 transition-all cursor-pointer"
                >
                  {!isRedirecting && <GoogleIcon className="w-5 h-5 shrink-0" />}
                  <span>{isRedirecting ? 'Redirecting to Google...' : `Continue with Google as ${currentOption.title}`}</span>
                </Button>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1">
                Sign in with Google <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F8FAF9]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
