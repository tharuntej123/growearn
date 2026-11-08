import React from 'react';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin shadow-sm" />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">Loading GrowEarn Workspace</p>
          <p className="text-xs text-slate-500 mt-1">Authenticating session & preparing dashboard metrics...</p>
        </div>
      </div>
    </div>
  );
}

