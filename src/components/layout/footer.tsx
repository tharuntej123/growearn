'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Globe, Code2 } from 'lucide-react';

import { isDemoMode } from '@/lib/constants';

export function Footer() {
  const showDemo = isDemoMode();

  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900 text-base">Growearn</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The AI-powered talent ecosystem bridging learning, 1-on-1 mentorship, professional work contracts, and intelligent hiring.
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            <Link href="https://github.com/tharuntej123/growearn" className="hover:text-emerald-600 transition-colors"><Globe className="h-4 w-4" /></Link>
            <Link href="https://linkedin.com" className="hover:text-emerald-600 transition-colors"><Code2 className="h-4 w-4" /></Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Ecosystem Roles</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/learner/dashboard" className="hover:text-emerald-600 transition-colors">For Learners</Link></li>
            <li><Link href="/freelancer/dashboard" className="hover:text-emerald-600 transition-colors">For Freelancers</Link></li>
            <li><Link href="/mentor/dashboard" className="hover:text-emerald-600 transition-colors">For Mentors</Link></li>
            <li><Link href="/company/dashboard" className="hover:text-emerald-600 transition-colors">For Companies</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Features & AI</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/ai-assistant" className="hover:text-emerald-600 transition-colors">AI Skill Gap Analysis</Link></li>
            <li><Link href="/ai-assistant" className="hover:text-emerald-600 transition-colors">Dynamic Career Roadmaps</Link></li>
            <li><Link href="/jobs" className="hover:text-emerald-600 transition-colors">Explainable Hybrid Matcher</Link></li>
            <li><Link href="/jobs" className="hover:text-emerald-600 transition-colors">Local Job Discovery (Chennai/Global)</Link></li>
            <li><Link href="/courses" className="hover:text-emerald-600 transition-colors">Interactive Course System</Link></li>
          </ul>
        </div>

        <div>
          {showDemo ? (
            <>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Demo Accounts</h4>
              <div className="p-3 rounded-xl border border-slate-200 bg-white text-xs space-y-1.5 font-mono shadow-xs">
                <p className="text-slate-700"><span className="text-emerald-700 font-semibold">Learner:</span> student@example.com</p>
                <p className="text-slate-700"><span className="text-teal-700 font-semibold">Mentor:</span> priya.sharma@example.com</p>
                <p className="text-slate-700"><span className="text-emerald-700 font-semibold">Freelancer:</span> professional@example.com</p>
                <p className="text-slate-700"><span className="text-slate-800 font-semibold">Company:</span> careers@novatech-solutions.io</p>
                <p className="text-slate-500 pt-1 border-t border-slate-100">Password: <span className="text-emerald-700 font-bold">Demo1234!</span></p>
              </div>
            </>
          ) : (
            <>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Trust & Security</h4>
              <div className="p-3 rounded-xl border border-slate-200 bg-white text-xs space-y-1.5 text-slate-600 shadow-xs">
                <p className="font-semibold text-slate-800">Verified Platform</p>
                <p className="text-[11px] leading-relaxed">
                  Role-based access control, secure payment verification, and pgvector semantic search.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <p>© 2026 Growearn. All rights reserved.</p>
        <p>Built with Next.js 16, TypeScript, Prisma, and Tailwind CSS.</p>
      </div>
    </footer>
  );
}
