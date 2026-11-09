'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Building2 } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function CompanyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('[CompanyError] Boundary caught error:', error);
  }, [error]);

  return (
    <div className="p-6 max-w-lg mx-auto mt-12 bg-white border border-slate-200 rounded-3xl shadow-xs text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-900">Employer Portal Error</h2>
      <p className="text-xs text-slate-600">
        Failed to load job listings or applicant pipelines.
      </p>
      {error.digest && (
        <p className="text-[10px] font-mono text-slate-400">Digest: {error.digest}</p>
      )}
      <div className="flex gap-2 justify-center pt-2">
        <Button onClick={() => reset()} variant="default" size="sm" className="gap-2 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
        <Link href="/company/dashboard">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Building2 className="h-3.5 w-3.5" /> Company Portal
          </Button>
        </Link>
      </div>
    </div>
  );
}
