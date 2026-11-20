'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/ui/google-icon';
import { Sparkles, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

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
    window.location.assign(new URL(`/api/auth/google/init?${params.toString()}`, window.location.origin).href);
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
              Sign in to your GrowEarn account with Google
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
                GrowEarn utilizes Google OAuth 2.0 with OpenID Connect for zero-password security, identity verification, and fraud protection.
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
              New to GrowEarn?{' '}
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
