'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Link2, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LinkAccountPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/google/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.error || 'Failed to link account');
      }

      toast.success('Google account linked successfully!');
      const target = data.data?.targetDashboard || '/learner/dashboard';
      router.push(target);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Linking failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-[#F8FAF9] relative overflow-hidden">
      <div className="w-full max-w-lg space-y-4 relative z-10">
        <Card className="bg-white border border-slate-200 shadow-md">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm mb-2">
              <Link2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Link Your GroEarn Account
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Existing account detected with your Google email
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2 text-xs text-amber-900 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Account Protection Notice</span>
              </div>
              <p>
                To prevent account takeover risks, GroEarn does not automatically merge accounts based solely on email.
              </p>
              <p>
                By clicking confirm below, you verify that you own this Google account and authorize linking it to your existing GroEarn profile. All your existing data, courses, jobs, payments, and role permissions will remain 100% intact.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Zero Data Loss Migration</span>
              </div>
              <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
                <li>Your profile ID and user roles are preserved</li>
                <li>Your enrolled courses and progress remain active</li>
                <li>Your job applications and proposals are untouched</li>
                <li>Future logins will use single-click Google authentication</li>
              </ul>

              <Button
                type="button"
                onClick={handleConfirmLink}
                disabled={isLoading}
                isLoading={isLoading}
                className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <span>Confirm & Link Google Account</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
