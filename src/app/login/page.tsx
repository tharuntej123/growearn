'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    setIsRedirecting(true);
    const redirectTarget = searchParams.get('redirect');
    const params = new URLSearchParams();
    params.set('action', 'login');
    if (redirectTarget && redirectTarget.startsWith('/')) {
      params.set('redirect', redirectTarget);
    }
    window.location.href = `/api/auth/google/init?${params.toString()}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-[#F8FAF9] relative overflow-hidden">
      <div className="w-full max-w-md space-y-4 relative z-10">
        <Card className="bg-white border border-slate-200 shadow-md">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-sm mb-2">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Sign in to your GroEarn account with Google
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Authentication Notice</p>
                  <p className="leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Fast, Single-Click Secure Authentication</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                GroEarn utilizes Google OAuth 2.0 with OpenID Connect for zero-password security, identity verification, and fraud protection.
              </p>

              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isRedirecting}
                isLoading={isRedirecting}
                variant="outline"
                className="w-full h-12 text-sm font-semibold flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-xs hover:border-slate-400 transition-all cursor-pointer"
              >
                {!isRedirecting && <GoogleIcon className="w-5 h-5 shrink-0" />}
                <span>{isRedirecting ? 'Redirecting to Google...' : 'Continue with Google'}</span>
              </Button>
            </div>

            <p className="text-center text-xs text-slate-500 pt-2">
              New to GroEarn?{' '}
              <Link href="/signup" className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1">
                Choose your role and register <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F8FAF9]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
