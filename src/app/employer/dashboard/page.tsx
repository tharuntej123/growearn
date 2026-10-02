'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Briefcase,
  Users,
  PlusCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function EmployerDashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmployerJobs();
  }, []);

  const fetchEmployerJobs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/jobs?mine=true');
      const json = await res.json();
      if (json.success && json.data?.jobs) {
        setJobs(json.data.jobs);
      }
    } catch {
      toast.error('Failed to load employer jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const totalApplicants = jobs.reduce((sum, j) => sum + (j._count?.applications || 0), 0);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-emerald-600" />
              <span>Employer ATS & Hiring Hub</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your engineering job postings, review AI candidate rankings, and hire pre-vetted talent.
            </p>
          </div>
          <Link href="/employer/jobs/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 h-10 px-4 rounded-xl shadow-sm">
              <PlusCircle className="h-4 w-4" /> Post New Job
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Active Job Postings</span>
            <p className="text-2xl font-extrabold text-slate-900">{jobs.length}</p>
          </Card>
          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Total Applicants</span>
            <p className="text-2xl font-extrabold text-emerald-700">{totalApplicants}</p>
          </Card>
          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Candidate Match Engine</span>
            <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">
              5-Factor Hybrid Scoring Active
            </p>
          </Card>
        </div>

        {/* Job Listings List */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-600" />
            <span>Active Postings & Candidates</span>
          </h2>

          {isLoading ? (
            <p className="text-sm text-slate-500 py-8 text-center">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <Card className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
              <p className="text-sm font-semibold text-slate-800">No job opportunities posted yet</p>
              <p className="text-xs text-slate-500">Publish your open full-time, contract, or local project roles.</p>
              <Link href="/employer/jobs/new">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                  Post First Job
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold">
                        {job.jobType}
                      </Badge>
                      <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-medium">
                        {job.locationType}
                      </Badge>
                      <span className="text-xs text-slate-500">{job.city || 'Remote'}, {job.country}</span>
                    </div>

                    <Link href={`/jobs/${job.id}`}>
                      <h3 className="text-base font-bold text-slate-900 hover:text-emerald-600 transition-colors">
                        {job.title}
                      </h3>
                    </Link>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(job.skills || []).map((s: any) => (
                        <span key={s.id || s.skill.name} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                          {s.skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link href={`/employer/jobs/${job.id}/applicants`}>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>View {job._count?.applications || 0} Applicants</span>
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
