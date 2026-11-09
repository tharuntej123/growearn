import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-lg space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <FileQuestion className="h-8 w-8" />
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            404 Not Found
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">Page Not Found</h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            The page or resource you are looking for does not exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/">
            <Button variant="default" className="w-full sm:w-auto gap-2 text-xs">
              <Home className="h-4 w-4" /> Go to Homepage
            </Button>
          </Link>
          <Link href="/feed">
            <Button variant="outline" className="w-full sm:w-auto gap-2 text-xs">
              <ArrowLeft className="h-4 w-4" /> Community Feed
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

