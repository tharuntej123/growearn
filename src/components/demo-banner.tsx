'use client';

import React from 'react';

export function DemoBanner() {
  const isDemo = process.env.NEXT_PUBLIC_APP_ENV === 'demo';

  if (!isDemo) return null;

  return (
    <div
      role="status"
      aria-label="Sample Data Notice"
      className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-4 py-2 text-xs font-mono text-center flex items-center justify-center gap-2"
    >
      <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <span>
        <strong>DEMO ENVIRONMENT & SAMPLE DATA</strong>: You are viewing simulated marketplace data. Actions and payments run against sandbox services.
      </span>
    </div>
  );
}

export default DemoBanner;
