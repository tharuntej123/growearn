'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log root crash for observability
    logger.error('[GlobalError] Root layout failure:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-lg space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">Critical System Error</h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              A critical error prevented the application from rendering. The engineering team has been notified.
            </p>
            {error.digest && (
              <p className="text-[11px] font-mono text-slate-400 mt-1">Digest: {error.digest}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-200 transition inline-block"
            >
              Reload Platform
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
