'use client';

import React from 'react';

export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_APP_ENV !== 'demo') {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-medium text-amber-800">
      <span>Demo Environment: Viewing with Sample Data. Actions do not alter real platform data.</span>
    </div>
  );
}

export default DemoBanner;

