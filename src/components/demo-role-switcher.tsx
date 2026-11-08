'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

const CANONICAL_ROLES = [
  { role: 'LEARNER', label: 'Learner', path: '/learner/dashboard' },
  { role: 'FREELANCER', label: 'Freelancer', path: '/freelancer/dashboard' },
  { role: 'MENTOR', label: 'Mentor', path: '/mentor/dashboard' },
  { role: 'COMPANY', label: 'Company', path: '/company/dashboard' },
  { role: 'ADMIN', label: 'Admin', path: '/admin' },
] as const;

export function DemoRoleSwitcher() {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const isDemo = process.env.NEXT_PUBLIC_APP_ENV === 'demo';

  if (!isDemo) return null;

  async function handleSwitch(role: string, targetPath: string) {
    setSwitching(true);
    try {
      const res = await fetch('/api/demo/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        router.push(targetPath);
        router.refresh();
      }
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('Role switch failed', { error: error.message });
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div
      role="region"
      aria-label="Demo Role Switcher"
      className="fixed bottom-4 right-4 z-50 bg-slate-900/90 backdrop-blur border border-slate-700 p-2 rounded-lg shadow-xl text-xs flex items-center gap-2"
    >
      <span className="text-slate-400 font-semibold px-1">Role:</span>
      {CANONICAL_ROLES.map(({ role, label, path }) => (
        <button
          key={role}
          onClick={() => handleSwitch(role, path)}
          disabled={switching}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 transition-colors disabled:opacity-50"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default DemoRoleSwitcher;
