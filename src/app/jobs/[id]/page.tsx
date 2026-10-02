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
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Send,
  FileText,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuth();

  const [job, setJob] = useState<any | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [application, setApplication] = useState<any | null>(null);
  const [matchResult, setMatchResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Application form state
  const [coverLetter, setCoverLetter] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetail();
    }
  }, [id]);

  const fetchJobDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/jobs/${id}`);
      const json = await res.json();
      if (json.success && json.data?.job) {
        setJob(json.data.job);
        setHasApplied(json.data.hasApplied);
        setApplication(json.data.application);
        setMatchResult(json.data.matchResult);
      } else {
        toast.error('Job listing not found');
      }
    } catch {
      toast.error('Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to apply for this job');
      router.push(`/login?redirect=/jobs/${id}`);
      return;
    }

    setIsApplying(true);
    try {
      const res = await fetch(`/api/jobs/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetter: coverLetter.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setHasApplied(true);
        setApplication(json.data.application);
        setShowApplyModal(false);
        toast.success(`🎉 Application submitted for "${job.title}"!`);
      } else {
        toast.error(json.error?.message || 'Application failed');
      }
    } catch {
      toast.error('Error submitting application');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
        <DashboardSidebar />
        <main className="flex-1 p-8 max-w-5xl mx-auto flex items-center justify-center">
          <p className="text-slate-500 font-medium">Loading job details...</p>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
        <DashboardSidebar />
        <main className="flex-1 p-8 max-w-5xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Job Not Found</h2>
          <p className="text-slate-500 text-sm">This position is closed or no longer available.</p>
          <Link href="/jobs">
            <Button variant="default">Back to Jobs</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/jobs" className="hover:text-emerald-600 flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Jobs
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate">{job.title}</span>
        </div>

        {/* Job Header Card */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold">
                  {job.jobType}
                </Badge>
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-medium">
                  {job.locationType}
                </Badge>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {job.city || 'Remote'}, {job.country}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" /> {job.experienceLevel} Level
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {job.title}
              </h1>

              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span>{job.company?.name || 'Hiring Company'}</span>
              </div>

              {/* Required Skills */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {(job.skills || []).map((js: any) => (
                  <span
                    key={js.id || js.skill.name}
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                  >
                    {js.skill.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Box */}
            <Card className="w-full lg:w-72 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shrink-0">
              <div>
                <span className="text-xs font-semibold text-slate-500">Compensation</span>
                <p className="text-xl font-extrabold text-slate-900">
                  ${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()}
                  <span className="text-xs font-normal text-slate-500"> / year</span>
                </p>
              </div>

              {hasApplied ? (
                <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-xl text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Check className="h-4 w-4 text-emerald-700" />
                    <span>Application Submitted</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Status: <strong>{application?.status || 'APPLIED'}</strong>
                  </p>
                </div>
              ) : (
                <Button
                  onClick={() => setShowApplyModal(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm h-11 rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Apply for Position</span>
                </Button>
              )}

              <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-200/80">
                <p>• Verified Direct Employer Post</p>
                <p>• Standard 48h Response Guarantee</p>
              </div>
            </Card>
          </div>
        </section>

        {/* 5-Factor Hybrid Match Breakdown */}
        {matchResult && (
          <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>AI Profile & Job Match Breakdown</span>
              </h2>
              <Badge className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-0.5">
                {matchResult.overallScore}% Overall Match
              </Badge>
            </div>

            <p className="text-xs text-slate-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 leading-relaxed font-medium">
              {matchResult.explanation}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">Skill Alignment</span>
                <p className="text-base font-extrabold text-slate-900">{matchResult.factors.skillMatch.score}%</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">Experience Pacing</span>
                <p className="text-base font-extrabold text-slate-900">{matchResult.factors.experienceMatch.score}%</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">Location Match</span>
                <p className="text-base font-extrabold text-slate-900">{matchResult.factors.locationMatch.score}%</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">Domain Index</span>
                <p className="text-base font-extrabold text-slate-900">{matchResult.factors.aiSemanticScore.score}%</p>
              </div>
            </div>
          </section>
        )}

        {/* Description Section */}
        <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Job Description & Responsibilities</h2>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {job.description}
          </div>
        </section>

        {/* Apply Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Apply for Position</h3>
                  <p className="text-xs text-slate-500">{job.title} @ {job.company?.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleApply} className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cover Letter & Relevant Project Experience
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Highlight relevant projects, architecture experience, and why you are a great fit..."
                    rows={5}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Your verified platform profile and uploaded resume will be attached automatically.</span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApplyModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isApplying}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    {isApplying ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
