'use client';

import React from 'react';
import Link from 'next/link';

export function RoleSwitcher() {
  if (process.env.NEXT_PUBLIC_APP_ENV !== 'demo') {
    return null;
  }

  const roles = [
    { label: 'Learner', href: '/learner' },
    { label: 'Freelancer', href: '/freelancer' },
    { label: 'Mentor', href: '/mentor' },
    { label: 'Company', href: '/company' },
    { label: 'Admin', href: '/admin' },
  ];

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg text-xs">
      <span className="font-semibold text-slate-700">RoleSwitcher:</span>
      {roles.map((r) => (
        <Link
          key={r.label}
          href={r.href}
          className="px-2 py-1 bg-white rounded border border-slate-200 hover:bg-slate-50 text-slate-800"
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}

export default RoleSwitcher;
