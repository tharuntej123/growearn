'use client';

import React, { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  RefreshCw,
  Globe,
  Clock,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${page}&limit=20`);
      const json = await res.json();
      if (json.success && json.data) {
        setLogs(json.data.logs || []);
        setTotalPages(json.data.pagination?.totalPages || 1);
      } else {
        toast.error(json.error?.message || 'Failed to load audit logs');
      }
    } catch {
      toast.error('Network error loading audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-7 w-7 text-emerald-600" /> Platform Security & Audit Logs
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Immutable telemetry tracking authentication events, administrative actions, and authorization changes.
            </p>
          </div>
          <Button onClick={fetchLogs} variant="outline" size="sm" className="gap-2 self-start">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Audit Log Table */}
        <Card className="bg-white border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Resource</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            log.action.includes('REGISTER') || log.action.includes('LOGIN')
                              ? 'secondary'
                              : log.action.includes('VERIFY') || log.action.includes('MODERATE')
                              ? 'success'
                              : 'warning'
                          }
                          className="font-mono text-[11px]"
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 font-mono">
                        {log.resource} {log.resourceId ? `(${log.resourceId.slice(0, 8)}...)` : ''}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {log.user ? (
                          <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {log.user.name} ({log.user.email})
                          </div>
                        ) : (
                          <span className="text-slate-400">Anonymous / System</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap font-mono">
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-slate-400" />
                          {log.ipAddress || '127.0.0.1'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
