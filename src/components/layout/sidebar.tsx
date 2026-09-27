'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  Compass,
  Briefcase,
  BookOpen,
  Users,
  Sparkles,
  MessageSquare,
  User,
  GraduationCap,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { ROLE_INFO } from '@/lib/constants';

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const rawRole = (user?.role || 'LEARNER').toUpperCase();
  const isStudent = rawRole === 'STUDENT' || rawRole === 'LEARNER';
  const isMentor = rawRole === 'MENTOR';
  const isFreelancer = rawRole === 'FREELANCER' || rawRole === 'PROFESSIONAL';
  const isCompany = rawRole === 'COMPANY' || rawRole === 'EMPLOYER';

  const roleConfig = ROLE_INFO[rawRole] || ROLE_INFO.LEARNER;

  const getNavItems = () => {
    if (isStudent) {
      return [
        { label: 'Student Dashboard', href: '/student/dashboard', icon: GraduationCap, highlight: true },
        { label: 'AI Career Assistant', href: '/ai-assistant', icon: Sparkles, badge: 'AI' },
        { label: 'Courses & Learning', href: '/courses', icon: BookOpen },
        { label: 'Find Mentors', href: '/mentors', icon: Users },
        { label: 'Feed & Social', href: '/feed', icon: Compass },
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'My Profile & Skills', href: '/profile', icon: User },
      ];
    }

    if (isMentor) {
      return [
        { label: 'Mentor Studio', href: '/mentor/dashboard', icon: Sparkles, highlight: true },
        { label: 'AI Assistant', href: '/ai-assistant', icon: Sparkles, badge: 'AI' },
        { label: 'Feed & Community', href: '/feed', icon: Compass },
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Mentor Profile', href: '/profile', icon: User },
      ];
    }

    if (isFreelancer) {
      return [
        { label: 'Freelancer Workspace', href: '/professional/dashboard', icon: Briefcase, highlight: true },
        { label: 'Explore Jobs & Contracts', href: '/jobs', icon: Briefcase },
        { label: 'AI Proposal Assistant', href: '/ai-assistant', icon: Sparkles, badge: 'AI' },
        { label: 'Feed & Network', href: '/feed', icon: Compass },
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Portfolio & Skills', href: '/profile', icon: User },
      ];
    }

    if (isCompany) {
      return [
        { label: 'Company ATS Dashboard', href: '/company/dashboard', icon: Building2, highlight: true },
        { label: 'AI Hiring Assistant', href: '/ai-assistant', icon: Sparkles, badge: 'AI' },
        { label: 'Feed & Network', href: '/feed', icon: Compass },
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Company Profile', href: '/profile', icon: User },
      ];
    }

    // Default / fallback
    return [
      { label: 'Dashboard', href: roleConfig.defaultDashboard, icon: Compass, highlight: true },
      { label: 'Feed', href: '/feed', icon: Compass },
      { label: 'AI Assistant', href: '/ai-assistant', icon: Sparkles, badge: 'AI' },
      { label: 'Messages', href: '/messages', icon: MessageSquare },
      { label: 'Profile', href: '/profile', icon: User },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 shrink-0 hidden md:block border-r border-slate-200 bg-white p-4 min-h-[calc(100vh-4rem)]">
      <div className="mb-6 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow-xs">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Guest User'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                {rawRole === 'EMPLOYER' ? 'COMPANY' : rawRole}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          {rawRole} Workspace
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-8 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          <span>Active Role: {rawRole}</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Features and tools are personalized strictly for your {rawRole.toLowerCase()} workflow.
        </p>
      </div>
    </aside>
  );
}
