'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Users,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  const appFlow = [
    {
      step: '1',
      title: 'Learn',
      icon: BookOpen,
      desc: 'Follow structured roadmaps and complete verified technical courses.',
    },
    {
      step: '2',
      title: 'Work',
      icon: Briefcase,
      desc: 'Apply your knowledge to real client contracts and freelance milestones.',
    },
    {
      step: '3',
      title: 'Mentor',
      icon: Users,
      desc: 'Connect 1-on-1 with industry mentors for code reviews and guidance.',
    },
    {
      step: '4',
      title: 'Grow',
      icon: TrendingUp,
      desc: 'Get discovered by companies for direct full-time hiring and advancement.',
    },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-[#F8FAF9] text-slate-900 justify-between">
      {/* Single Hero & Application Flow Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full py-10 text-center">
        {/* Subtle Ecosystem Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 mb-6 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs font-semibold">
            GrowEarn Ecosystem
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] max-w-4xl mx-auto">
          Learn. Work. Mentor. Grow —{' '}
          <span className="text-emerald-600">All in One.</span>
        </h1>

        {/* Primary Call to Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button size="lg" variant="default" className="w-full sm:w-auto gap-2 text-sm px-6 h-11 shadow-sm font-semibold">
              Create Account (Choose Role) <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm px-6 h-11 font-semibold">
              Sign In to Workspace
            </Button>
          </Link>
        </div>

        {/* Application Workflow (The Flow That Our App Follows) */}
        <div className="mt-12 w-full pt-8 border-t border-slate-200/80">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 text-center">
            Platform Workflow
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            {appFlow.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.step}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        {item.step}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                    </div>
                    <IconComponent className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Clean, Single-Line Bottom Bar */}
      <footer className="py-4 border-t border-slate-200 text-xs text-slate-500 bg-white/60">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} GrowEarn. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/courses" className="hover:text-emerald-600 transition-colors">Courses</Link>
            <Link href="/jobs" className="hover:text-emerald-600 transition-colors">Jobs</Link>
            <Link href="/mentors" className="hover:text-emerald-600 transition-colors">Mentors</Link>
            <Link href="/login" className="hover:text-emerald-600 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
