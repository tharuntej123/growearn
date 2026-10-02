'use client';

import React, { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Briefcase,
  Search,
  RefreshCw,
  ExternalLink,
  Building2,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setJobs(json.data.jobs || []);
        setTotalPages(json.data.pagination?.totalPages || 1);
      } else {
        toast.error(json.error?.message || 'Failed to load jobs');
      }
    } catch {
      toast.error('Network error loading jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter]);

  const handleModerate = async (jobId: string, status: string, isFeatured?: boolean) => {
    setUpdatingId(jobId);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/moderate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, isFeatured }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Job status updated to ${status}`);
        fetchJobs();
      } else {
        toast.error(json.error?.message || 'Moderation failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-7 w-7 text-emerald-600" /> Job Post Moderation
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Verify employer job postings, manage listing status, and review compensation details.
            </p>
          </div>
          <Button onClick={fetchJobs} variant="outline" size="sm" className="gap-2 self-start">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search jobs by title or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Job Status"
              className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </Card>

        {/* Jobs Table */}
        <Card className="bg-white border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4">Job Title</th>
                  <th className="py-3.5 px-4">Employer / Company</th>
                  <th className="py-3.5 px-4">Type & Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading jobs...
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No jobs found.
                    </td>
                  </tr>
                ) : (
                  jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{j.title}</div>
                        <div className="text-xs text-slate-500">{j.department || 'Engineering'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {j.company?.name || j.employer?.name || 'Company'}
                        </div>
                        <div className="text-slate-400">{j.employer?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-slate-700 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" /> {j.location} ({j.workplaceType})
                        </div>
                        <div className="text-emerald-700 font-semibold">
                          ${j.salaryMin?.toLocaleString()} - ${j.salaryMax?.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            j.status === 'ACTIVE'
                              ? 'success'
                              : j.status === 'DRAFT'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {j.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/jobs/${j.id}`} target="_blank">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          {j.status === 'ACTIVE' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingId === j.id}
                              onClick={() => handleModerate(j.id, 'CLOSED')}
                              className="h-7 px-2.5 text-xs text-amber-700 hover:bg-amber-50"
                            >
                              Close
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              disabled={updatingId === j.id}
                              onClick={() => handleModerate(j.id, 'ACTIVE')}
                              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
