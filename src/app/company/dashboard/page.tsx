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

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    setIsLoading(true);
    try {
      const [jobsRes, candRes] = await Promise.all([
        fetch('/api/jobs?mine=true'),
        fetch('/api/candidates?limit=6'),
      ]);
      const jobsJson = await jobsRes.json();
      const candJson = await candRes.json();
      if (jobsJson.success && jobsJson.data?.jobs) {
        setJobs(jobsJson.data.jobs);
      }
      if (candJson.success && candJson.data?.candidates) {
        setCandidates(candJson.data.candidates);
      }
    } catch {
      toast.error('Failed to load company workspace');
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
              <span>Company ATS & Hiring Workspace</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your engineering job postings, review AI candidate rankings, and hire pre-vetted talent.
            </p>
          </div>
          <Link href="/company/jobs/new">
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-600" />
              <span>Active Postings & Candidates</span>
            </h2>
            <Link href="/company/jobs/new">
              <Button size="sm" variant="outline" className="text-xs font-semibold">
                + New Posting
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-500 py-8 text-center">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <Card className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
              <p className="text-sm font-semibold text-slate-800">No job opportunities posted yet</p>
              <p className="text-xs text-slate-500">Create your first role to start receiving matched applications.</p>
              <Link href="/company/jobs/new">
                <Button size="sm" className="bg-emerald-600 text-white text-xs font-semibold">
                  Create First Posting
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-xs transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">
                          {job.locationType}
                        </Badge>
                        {job.isLocal && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            Local Priority
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {job.city ? `${job.city}, ${job.state}` : 'Remote Worldwide'} • {job.experienceLevel} Level • ${job.minSalary} - ${job.maxSalary}/mo
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-500">Applicants</span>
                        <p className="text-lg font-extrabold text-emerald-700">{job._count?.applications || 0}</p>
                      </div>
                      <Link href={`/company/jobs/${job.id}/applicants`}>
                        <Button size="sm" variant="default" className="text-xs font-semibold gap-1.5">
                          View Candidates <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                    {job.skills?.map((s: any) => (
                      <span
                        key={s.skill?.name || s.id}
                        className="px-2 py-0.5 rounded-md bg-slate-50 text-[11px] font-medium text-slate-600 border border-slate-200/80"
                      >
                        {s.skill?.name || s.name}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Candidate Discovery Section */}
        {candidates.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <span>Recommended Top Candidates</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {candidates.map((cand) => (
                <Card key={cand.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                      {cand.name?.charAt(0) || 'C'}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-900 text-sm truncate">{cand.name}</p>
                      <p className="text-xs text-slate-500 truncate">{cand.headline || 'Verified Professional'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {cand.skills?.slice(0, 4).map((s: any) => (
                      <span key={s.skill?.name || s} className="text-[10px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                        {s.skill?.name || s}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
