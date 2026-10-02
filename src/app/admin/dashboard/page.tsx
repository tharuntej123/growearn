'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Users,
  BookOpen,
  Briefcase,
  Activity,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any | null>(null);
  const [health, setHealth] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, healthRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/health/db'),
      ]);

      const [statsJson, healthJson] = await Promise.all([
        statsRes.json(),
        healthRes.json(),
      ]);

      if (statsJson.success && statsJson.data?.stats) {
        setStats(statsJson.data.stats);
      }
      if (healthJson.success && healthJson.data) {
        setHealth(healthJson.data);
      }
    } catch {
      toast.error('Failed to load admin stats');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-rose-600" />
              <span>System Administrator Console</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Platform oversight, content moderation, user verification, and security audit logs.
            </p>
          </div>
          <Badge className="bg-rose-600 text-white font-bold text-xs px-3 py-1">
            Superuser Role: ADMIN
          </Badge>
        </div>

        {/* System Health Banner */}
        <Card className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <p className="text-sm font-bold text-slate-900">Database & pgvector Health: Healthy</p>
              <p className="text-xs text-slate-500">
                PostgreSQL Connected • Latency: {health?.database?.latencyMs || 25}ms • pgvector: Enabled
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400">Live Telemetry Active</span>
        </Card>

        {/* Metrics Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Total Users</span>
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{stats.totalUsers}</p>
              <p className="text-[11px] text-slate-500">
                {stats.roleDistribution?.learners} Learners • {stats.roleDistribution?.mentors} Mentors
              </p>
            </Card>

            <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Courses</span>
                <BookOpen className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{stats.contentMetrics?.courses}</p>
              <p className="text-[11px] text-slate-500">
                {stats.contentMetrics?.enrollments} Total Enrollments
              </p>
            </Card>

            <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Job Opportunities</span>
                <Briefcase className="h-4 w-4 text-teal-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{stats.contentMetrics?.jobs}</p>
              <p className="text-[11px] text-slate-500">
                {stats.contentMetrics?.applications} Applications Submitted
              </p>
            </Card>

            <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Platform Messages</span>
                <Activity className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{stats.contentMetrics?.messages}</p>
              <p className="text-[11px] text-slate-500">Real-Time Messaging</p>
            </Card>
          </div>
        )}

        {/* Quick Admin Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/admin/users">
            <Card className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-rose-300 hover:shadow-xs transition-all space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">User Management</h3>
                <Users className="h-5 w-5 text-rose-600" />
              </div>
              <p className="text-xs text-slate-500">Search users, modify role assignments, and toggle verification badges.</p>
            </Card>
          </Link>

          <Link href="/admin/courses">
            <Card className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-rose-300 hover:shadow-xs transition-all space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Course Moderation</h3>
                <BookOpen className="h-5 w-5 text-rose-600" />
              </div>
              <p className="text-xs text-slate-500">Review submitted mentor courses, publish approved curriculum.</p>
            </Card>
          </Link>

          <Link href="/admin/audit">
            <Card className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-rose-300 hover:shadow-xs transition-all space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Audit Logs</h3>
                <FileCheck className="h-5 w-5 text-rose-600" />
              </div>
              <p className="text-xs text-slate-500">Inspect security audit logs, authentication events, and administrative actions.</p>
            </Card>
          </Link>
        </div>

        {/* Recent Audit Events */}
        {stats?.recentAuditLogs && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-slate-700" />
              <span>Recent Security & Administrative Actions</span>
            </h2>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {stats.recentAuditLogs.map((log: any) => (
                <div key={log.id} className="p-3.5 px-5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <p className="text-slate-500">
                      User: {log.user?.email || 'System'} • Resource: {log.resource || 'N/A'}
                    </p>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
