'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Search,
  MapPin,
  Sparkles,
  Filter,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  Send,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [emptyReason, setEmptyReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [locationType, setLocationType] = useState('ALL');
  const [jobType, setJobType] = useState('ALL');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'FREELANCE' | 'LOCAL'>('ALL');

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [customProposal, setCustomProposal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (cityFilter) params.append('city', cityFilter);
      if (locationType !== 'ALL') params.append('locationType', locationType);
      if (jobType !== 'ALL') params.append('jobType', jobType);
      if (scopeFilter === 'LOCAL') params.append('isLocal', 'true');
      if (scopeFilter === 'FREELANCE') params.append('isLocal', 'false');

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setJobs(json.data.jobs || []);
        setIsPersonalized(json.data.isPersonalized);
        setEmptyReason(json.data.emptyReason || null);
      }
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [locationType, jobType, scopeFilter]);

  const handleOpenProposal = async (job: any) => {
    setSelectedJob(job);
    setIsGeneratingProposal(true);

    try {
      const res = await fetch('/api/ai/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: job.title,
          jobDescription: job.description,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.proposal) {
        const p = json.data.proposal;
        setCustomProposal(
          `${p.introduction}\n\n${p.requirementUnderstanding}\n\n${p.relevantSkillsHighlight}\n\n${p.proposedArchitecture}\n\n${p.closing}`
        );
      }
    } catch {
      toast.error('Proposal generation failed');
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const handleSubmitProposal = async () => {
    if (!selectedJob) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetter: customProposal,
          proposedRate: 500,
          estimatedDays: 7,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Proposal submitted successfully to hiring team!');
        setSelectedJob(null);
        setCustomProposal('');
      } else {
        toast.error(json.error?.message || 'Failed to submit proposal');
      }
    } catch {
      toast.error('Submission failed due to network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Explore Global & Local Jobs
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Discover remote professional projects, on-site Chennai/local gigs, and full-time enterprise roles.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl w-fit shadow-xs">
          <button
            onClick={() => setScopeFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              scopeFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            ✨ All Opportunities
          </button>
          <button
            onClick={() => setScopeFilter('FREELANCE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              scopeFilter === 'FREELANCE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            🌍 Global & Freelance
          </button>
          <button
            onClick={() => setScopeFilter('LOCAL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              scopeFilter === 'LOCAL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            📍 Local Jobs (Chennai & Hubs)
          </button>
        </div>

        {!isPersonalized && emptyReason && (
          <Card className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 text-xs text-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{emptyReason}</span>
            </div>
            <Link href="/onboarding">
              <Button size="sm" variant="default" className="text-xs shrink-0 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" /> Add Skills for Matching
              </Button>
            </Link>
          </Card>
        )}

        <Card className="p-4 bg-white border-slate-200/90 shadow-sm rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Search Keywords</label>
              <Input
                placeholder="Title, skill (e.g. Java, Next.js)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                icon={<Search className="h-4 w-4" />}
                className="bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">City / Region (Local)</label>
              <Input
                placeholder="e.g. Chennai, Bangalore..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                icon={<MapPin className="h-4 w-4" />}
                className="bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Work Mode</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                aria-label="Filter by work mode"
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-slate-800 shadow-sm"
              >
                <option value="ALL">All Modes (Remote + Local)</option>
                <option value="REMOTE">Remote Only</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-Site Only</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Job Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                aria-label="Filter by job type"
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-slate-800 shadow-sm"
              >
                <option value="ALL">All Types</option>
                <option value="FULL_TIME">Full-Time</option>
                <option value="FREELANCE">Professional / Freelance</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {isPersonalized ? 'Recommended Jobs for You (Ranked by Skills)' : 'Browse All Marketplace Jobs'}
          </h2>
          <Badge variant={isPersonalized ? 'success' : 'outline'} className="bg-white">
            {jobs.length} Positions
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="p-5 sm:p-6 bg-white border-slate-200/90 hover:border-emerald-500/50 hover:shadow-md transition-all rounded-2xl shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                      {job.isPersonalized && job.matchScore > 0 && (
                        <Badge variant="success" className="text-xs font-bold">
                          {job.matchScore}% Match
                        </Badge>
                      )}
                      {job.isLocal && (
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200">
                          📍 Local: {job.city || 'Chennai'}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs bg-slate-50">{job.locationType}</Badge>
                      <Badge variant="outline" className="text-xs bg-slate-50">{job.jobType}</Badge>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills?.map((s: any) => {
                        const isMatched = job.matchedSkills?.includes(s.skill.name);
                        return (
                          <span
                            key={s.skill.name}
                            className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${
                              isMatched
                                ? 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                                : 'bg-slate-100 border border-slate-200 text-slate-700'
                            }`}
                          >
                            {isMatched ? `✓ ${s.skill.name}` : s.skill.name}
                          </span>
                        );
                      })}
                    </div>

                    {job.whyMatches && job.isPersonalized && (
                      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{job.whyMatches}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end justify-between shrink-0 gap-3">
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-extrabold text-emerald-700">
                        {formatCurrency(job.minSalary, job.currency)} - {formatCurrency(job.maxSalary, job.currency)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{job.company?.name}</p>
                    </div>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenProposal(job)}
                      className="gap-1.5 shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Apply with AI Proposal
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <Badge variant="outline" className="mb-1 bg-emerald-50 text-emerald-800 border-emerald-200">AI Proposal Generator</Badge>
                  <h3 className="text-lg font-bold text-slate-900">{selectedJob.title}</h3>
                </div>
                <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              {isGeneratingProposal ? (
                <div className="py-12 text-center space-y-2">
                  <Sparkles className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">AI is writing tailored application...</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Review & Edit AI Proposal Cover Letter:
                    </label>
                    <textarea
                      rows={10}
                      value={customProposal}
                      onChange={(e) => setCustomProposal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 font-mono text-[11px] leading-relaxed shadow-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedJob(null)}>Cancel</Button>
                    <Button variant="default" size="sm" onClick={handleSubmitProposal} isLoading={isSubmitting} className="gap-1.5 shadow-sm">
                      <Send className="h-3.5 w-3.5" /> Submit Application
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
