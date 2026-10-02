'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Users,
  Briefcase,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export default function JobApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;
  const { user } = useAuth();

  const [job, setJob] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (jobId) {
      fetchApplicants();
    }
  }, [jobId]);

  const fetchApplicants = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/applications`);
      const json = await res.json();
      if (json.success && json.data) {
        setJob(json.data.job);
        setApplications(json.data.applications || []);
      } else {
        toast.error(json.error?.message || 'Failed to load applicants');
      }
    } catch {
      toast.error('Network error loading applicants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Candidate status updated to ${newStatus}!`);
        await fetchApplicants();
      } else {
        toast.error(json.error?.message || 'Update failed');
      }
    } catch {
      toast.error('Network error updating candidate status');
    }
  };

  const handleStartMessage = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      const json = await res.json();
      if (json.success) {
        router.push('/messages');
      } else {
        toast.error('Failed to open message conversation');
      }
    } catch {
      toast.error('Error starting conversation');
    }
  };

  const filteredApplications =
    statusFilter === 'ALL'
      ? applications
      : applications.filter((a) => a.status === statusFilter);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/employer/dashboard" className="hover:text-emerald-600 flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-emerald-600" />
              <span>Applicants for &quot;{job?.title || 'Job'}&quot;</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review pre-ranked candidates, inspect match scores, and progress through hiring pipeline.
            </p>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800"
            >
              <option value="ALL">All Applicants ({applications.length})</option>
              <option value="APPLIED">Applied</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW">Interview</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500 py-8 text-center">Loading applicants...</p>
        ) : filteredApplications.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
            <p className="text-sm font-semibold text-slate-800">No applicants found</p>
            <p className="text-xs text-slate-500">Qualified engineers applying to this position will be scored and listed here.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => {
              const cand = app.applicant;
              const candSkills = (cand?.skills || []).map((s: any) => s.skill?.name || s.name);

              return (
                <Card
                  key={app.id}
                  className="p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-xs transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Avatar src={cand?.avatarUrl} fallback={cand?.name || 'C'} size="lg" className="rounded-2xl shrink-0" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{cand?.name}</h3>
                          <Badge variant="outline" className="text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200">
                            {app.matchScore}% Match
                          </Badge>
                        </div>
                        <p className="text-xs font-medium text-slate-600">{cand?.headline || cand?.email}</p>
                        <p className="text-xs text-slate-500">{cand?.location || 'Location not specified'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartMessage(cand?.id)}
                        className="text-xs font-semibold flex items-center gap-1.5"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                        <span>Message Candidate</span>
                      </Button>
                    </div>
                  </div>

                  {/* Match Explanation */}
                  {app.matchExplanation && (
                    <p className="text-xs text-emerald-900 bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 font-medium">
                      💡 {app.matchExplanation}
                    </p>
                  )}

                  {/* Cover Letter */}
                  {app.coverLetter && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate Pitch</span>
                      <p className="text-xs text-slate-700 leading-relaxed">&quot;{app.coverLetter}&quot;</p>
                    </div>
                  )}

                  {/* Skills */}
                  {candSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {candSkills.map((sk: string) => (
                        <span key={sk} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pipeline Stage Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Current Status:</span>
                      <Badge className="bg-slate-900 text-white text-xs font-bold">{app.status}</Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(app.id, 'SHORTLISTED')}
                        className="text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      >
                        Shortlist
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(app.id, 'INTERVIEW')}
                        className="text-xs font-semibold text-teal-700 border-teal-200 hover:bg-teal-50"
                      >
                        Schedule Interview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        Accept & Hire
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                        className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
