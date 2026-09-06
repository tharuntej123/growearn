'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Search,
  Bell,
  Briefcase,
  BookOpen,
  Users,
  Compass,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Layers,
  GraduationCap,
  Building2,
} from 'lucide-react';
import { ROLES, ROLE_INFO } from '@/lib/constants';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export function Navbar() {
  const { user, logout, selectRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  useEffect(() => {
    if (user) {
      fetch('/api/notifications')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.notifications) {
            setNotifications(json.data.notifications);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    setIsSwitchingRole(true);
    await selectRole(newRole);
    setIsSwitchingRole(false);
    setShowUserMenu(false);
    const targetDashboard = ROLE_INFO[newRole]?.defaultDashboard || '/feed';
    router.push(targetDashboard);
  };

  const isLandingPage = pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                Groearn
              </span>
              <span className="text-[10px] -mt-1 font-medium text-slate-500 tracking-wider uppercase">
                Learn • Work • Grow
              </span>
            </div>
          </Link>

          {/* Unified Search */}
          {!isLandingPage && (
            <form onSubmit={handleSearch} className="hidden md:block relative w-64 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search skills, jobs, mentors, courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-full bg-slate-50 border border-slate-200 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </form>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/feed"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname === '/feed'
                ? 'text-emerald-700 bg-emerald-50 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Compass className="h-4 w-4" /> Feed
            </span>
          </Link>
          <Link
            href="/jobs"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname.startsWith('/jobs')
                ? 'text-emerald-700 bg-emerald-50 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" /> Jobs
            </span>
          </Link>
          <Link
            href="/courses"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname.startsWith('/courses')
                ? 'text-emerald-700 bg-emerald-50 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> Courses
            </span>
          </Link>
          <Link
            href="/mentors"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname.startsWith('/mentors')
                ? 'text-emerald-700 bg-emerald-50 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" /> Mentors
            </span>
          </Link>
          <Link
            href="/ai-assistant"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname === '/ai-assistant'
                ? 'text-emerald-700 bg-emerald-50 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" /> AI Assistant
            </span>
          </Link>
        </nav>

        {/* Right Section: Auth / Profile */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Active Role Badge & Dashboard Link */}
              <Link href={ROLE_INFO[user.role]?.defaultDashboard || '/feed'}>
                <Badge
                  variant="outline"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs py-1 px-3 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer font-semibold shadow-sm"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Dashboard
                </Badge>
              </Link>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-emerald-600 text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-900">Notifications</h4>
                      <span className="text-xs text-emerald-600 font-medium">{unreadCount} unread</span>
                    </div>
                    <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">No notifications yet</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-lg text-xs transition-colors ${
                              n.isRead ? 'bg-slate-50 text-slate-500' : 'bg-emerald-50/60 text-slate-800 border border-emerald-100'
                            }`}
                          >
                            <p className="font-semibold text-slate-900">{n.title}</p>
                            <p className="mt-0.5 text-slate-600 leading-snug">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-full p-1 border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <Avatar src={user.avatarUrl} fallback={user.name} size="sm" />
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                </button>

                {/* Dropdown with Role Switcher */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Current Role:</span>
                        <span className="text-xs font-bold text-emerald-600">
                          {user.role === 'EMPLOYER' ? 'COMPANY' : user.role}
                        </span>
                      </div>
                    </div>

                    {/* Role Switcher Section */}
                    <div className="p-2 border-b border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Switch Identity / Role
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { key: 'LEARNER', label: '👨‍🎓 Learner' },
                          { key: 'PROFESSIONAL', label: '💼 Professional' },
                          { key: 'MENTOR', label: '👨‍🏫 Mentor' },
                          { key: 'EMPLOYER', label: '🏢 Company' },
                        ].map((r) => (
                          <button
                            key={r.key}
                            disabled={isSwitchingRole || user.role === r.key}
                            onClick={() => handleRoleChange(r.key)}
                            className={`px-2 py-1.5 rounded-lg text-xs text-left font-medium transition-colors ${
                              user.role === r.key
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-1 space-y-0.5">
                      <Link
                        href="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      >
                        <UserIcon className="h-4 w-4 text-slate-400" />
                        My Profile & Portfolio
                      </Link>
                      <Link
                        href={ROLE_INFO[user.role]?.defaultDashboard || '/feed'}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      >
                        <Layers className="h-4 w-4 text-slate-400" />
                        Dashboard
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="default" size="sm">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
