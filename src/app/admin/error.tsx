'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert, RefreshCw, Shield } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('[AdminError] Boundary caught error:', error);
  }, [error]);

  return (
    <div className="p-6 max-w-lg mx-auto mt-12 bg-white border border-slate-200 rounded-3xl shadow-xs text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-900">Admin Console Error</h2>
      <p className="text-xs text-slate-600">
        Failed to load platform administration telemetry or audit logs.
      </p>
      {error.digest && (
        <p className="text-[10px] font-mono text-slate-400">Digest: {error.digest}</p>
      )}
      <div className="flex gap-2 justify-center pt-2">
        <Button onClick={() => reset()} variant="default" size="sm" className="gap-2 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Shield className="h-3.5 w-3.5" /> Admin Console
          </Button>
        </Link>
      </div>
    </div>
  );
}
