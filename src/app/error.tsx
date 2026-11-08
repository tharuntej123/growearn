'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for observability
    logger.error('Root application boundary caught error', { error: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-lg space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="h-7 w-7" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">Application Error</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            An unexpected error occurred while processing this request. Our services have recorded the issue.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-slate-400 mt-1">Error Digest: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button onClick={() => reset()} variant="default" className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto gap-2 text-xs">
              <Home className="h-3.5 w-3.5" /> Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

