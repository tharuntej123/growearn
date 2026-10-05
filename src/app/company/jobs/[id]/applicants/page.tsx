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

export default function CompanyJobApplicantsPage() {
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
        <div>
          <Link
            href="/company/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Company Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-emerald-600" />
                <span>Candidate Pipeline & ATS</span>
              </h1>
              {job && (
                <p className="text-xs text-slate-600 mt-1">
                  Role: <strong className="text-slate-900">{job.title}</strong> • {applications.length} Total Applicants
                </p>
              )}
            </div>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 self-start sm:self-center">
              AI Candidate Ranking Active
            </Badge>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          {['ALL', 'APPLIED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st} ({st === 'ALL' ? applications.length : applications.filter((a) => a.status === st).length})
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500 py-12 text-center">Loading candidate applications...</p>
        ) : filteredApplications.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
            <p className="text-sm font-semibold text-slate-800">No applicants in &quot;{statusFilter}&quot; status</p>
            <p className="text-xs text-slate-500">Candidates who apply will appear ranked by explainable AI match score.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => {
              const applicant = app.applicant;
              const matchScore = app.matchScore || 85;

              return (
                <Card
                  key={app.id}
                  className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Avatar src={applicant?.avatarUrl} fallback={applicant?.name} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{applicant?.name}</h3>
                          <Badge
                            className={`text-xs font-bold ${
                              matchScore >= 90
                                ? 'bg-emerald-600 text-white'
                                : matchScore >= 75
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-600 text-white'
                            }`}
                          >
                            <Sparkles className="h-3 w-3 mr-1" /> {matchScore}% Match
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{applicant?.headline || 'Verified Professional'}</p>
                        <p className="text-xs text-slate-400">
                          {applicant?.location || 'India'} • {applicant?.profile?.yearsOfExperience || 3}+ Yrs Experience
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-start">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartMessage(applicant.id)}
                        className="text-xs font-semibold gap-1.5 border-slate-300 text-slate-700"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Message Candidate
                      </Button>
                    </div>
                  </div>

                  {app.coverLetter && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
                      <span className="font-semibold text-slate-900 block mb-1">Cover Note:</span>
                      <p className="italic leading-relaxed">&ldquo;{app.coverLetter}&rdquo;</p>
                    </div>
                  )}

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {applicant?.skills?.map((s: any) => (
                      <span
                        key={s.skill?.name || s.id}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700"
                      >
                        {s.skill?.name || s.name}
                      </span>
                    ))}
                  </div>

                  {/* Stage actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-500">Current Status:</span>
                      <Badge variant="outline" className="text-xs font-bold uppercase bg-slate-50">
                        {app.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {app.status !== 'SHORTLISTED' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'SHORTLISTED')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold transition-colors"
                        >
                          Shortlist
                        </button>
                      )}
                      {app.status !== 'INTERVIEW' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'INTERVIEW')}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 font-semibold transition-colors"
                        >
                          Schedule Interview
                        </button>
                      )}
                      {app.status !== 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 font-semibold transition-colors"
                        >
                          Make Offer
                        </button>
                      )}
                      {app.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold transition-colors"
                        >
                          Reject
                        </button>
                      )}
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
