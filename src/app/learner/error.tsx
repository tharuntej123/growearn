'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function LearnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('[LearnerError] Boundary caught error:', error);
  }, [error]);

  return (
    <div className="p-6 max-w-lg mx-auto mt-12 bg-white border border-slate-200 rounded-3xl shadow-xs text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-900">Learner Dashboard Error</h2>
      <p className="text-xs text-slate-600">
        We encountered a problem loading your learning roadmap or enrollments. Please retry or refresh.
      </p>
      {error.digest && (
        <p className="text-[10px] font-mono text-slate-400">Digest: {error.digest}</p>
      )}
      <div className="flex gap-2 justify-center pt-2">
        <Button onClick={() => reset()} variant="default" size="sm" className="gap-2 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
        <Link href="/learner/dashboard">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
