'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Sparkles,
  UploadCloud,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Send,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProfessionalDashboardPage() {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Resume upload modal & AI parsing
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[] | null>(null);

  // AI Proposal Generator modal
  const [selectedJobForProposal, setSelectedJobForProposal] = useState<any | null>(null);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [proposalData, setProposalData] = useState<any>(null);
  const [customCoverLetter, setCustomCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState<number>(500);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch {
      toast.error('Failed to load professional dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const userContext = data?.userContext;
  const hasSkills = Boolean(userContext?.hasSkills && userContext.skills.length > 0);
  const jobs = data?.recommendedJobs || [];

  const handleParseResume = async () => {
    if (!resumeText.trim()) {
      toast.error('Please paste resume content');
      return;
    }

    setIsParsingResume(true);
    try {
      const res = await fetch('/api/ai/resume-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });
      const json = await res.json();
      if (json.success && json.data?.extracted) {
        const detected = json.data.extracted.detectedSkills;
        setExtractedSkills(detected);
        toast.success(`AI detected ${detected.length} skills from resume!`);

        // Automatically add detected skills to user profile
        for (const sk of detected) {
          await fetch('/api/skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: sk, proficiencyLevel: 'INTERMEDIATE' }),
          });
        }
        await fetchDashboard();
        await refreshUser();
      }
    } catch {
      toast.error('Resume parsing failed');
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleOpenProposalGenerator = async (job: any) => {
    setSelectedJobForProposal(job);
    setIsGeneratingProposal(true);
    setProposedRate(Math.round((job.minSalary + job.maxSalary) / 2));
    setProposalData(null);

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
        setProposalData(p);
        setCustomCoverLetter(
          `${p.introduction}\n\n${p.requirementUnderstanding}\n\n${p.relevantSkillsHighlight}\n\n${p.proposedArchitecture}\n\n${p.closing}`
        );
      }
    } catch {
      toast.error('Failed to generate proposal');
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const handleSubmitProposal = async () => {
    if (!selectedJobForProposal) return;
    setIsSubmittingProposal(true);

    try {
      const res = await fetch(`/api/jobs/${selectedJobForProposal.id}/proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetter: customCoverLetter,
          proposedRate: Number(proposedRate),
          estimatedDays: 7,
          milestones: proposalData?.milestones,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Proposal submitted successfully to hiring team!');
        setSelectedJobForProposal(null);
        fetchDashboard();
      } else {
        toast.error(json.error?.message || 'Proposal submission failed');
      }
    } catch {
      toast.error('Failed to submit proposal');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Top Professional Banner */}
        <div className="p-6 sm:p-8 rounded-3xl border border-emerald-200/80 bg-white shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">Dashboard</Badge>
                {hasSkills ? (
                  <Badge variant="success" className="text-[10px]">Active Status</Badge>
                ) : (
                  <Badge variant="warning" className="text-[10px]">Setup Required</Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Dashboard — Welcome, {userContext?.name || user?.name || 'Professional'}! 💼
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Rate: <span className="text-emerald-700 font-bold">${userContext?.profile?.hourlyRate || 65}/hr</span> • Location: <span className="text-slate-800 font-medium">{userContext?.location || 'Remote'}</span>. Discover high-match contract gigs and generate 1-click AI proposals.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowResumeModal(true)}
                className="gap-2"
              >
                <UploadCloud className="h-4 w-4" /> Extract Skills from Resume
              </Button>
              <Link href="/jobs">
                <Button variant="outline" size="sm">
                  Search All Jobs
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Dynamic Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Verified Skills</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {userContext?.skills?.length || 0}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1 truncate">
              {userContext?.skills?.slice(0, 3).join(', ') || 'No skills entered'}
            </p>
          </Card>

          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Active Applications</span>
              <Briefcase className="h-4 w-4 text-teal-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-700 mt-2">
              {userContext?.applications?.length || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Submitted proposals</p>
          </Card>

          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Profile Score</span>
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
              {userContext?.completionPercentage || 25}%
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Completeness rating</p>
          </Card>

          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Hourly Benchmark</span>
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              ${userContext?.profile?.hourlyRate || 65}/hr
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Market contract rate</p>
          </Card>
        </div>

        {/* Unpersonalized Callout if user has 0 skills */}
        {!hasSkills && (
          <Card className="p-6 bg-white border border-amber-200 rounded-3xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" /> Add Your Skills to Unlock Ranked Job Matches
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your programming languages or paste your resume text to automatically calculate deterministic job match percentages.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="default" size="sm" onClick={() => setShowResumeModal(true)}>
                  Upload Resume
                </Button>
                <Link href="/onboarding">
                  <Button variant="outline" size="sm">
                    Open Onboarding
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Recommended Jobs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {hasSkills ? 'AI-Recommended Opportunities' : 'Browse Open Marketplace Jobs'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {hasSkills
                  ? 'Ranked using our 5-Factor Hybrid algorithm based on your verified skills'
                  : 'General listings. Add skills to calculate personalized match rankings'}
              </p>
            </div>
            <Link href="/jobs" className="text-xs text-emerald-700 font-semibold hover:underline">
              View All Jobs →
            </Link>
          </div>

          <div className="space-y-4">
            {jobs.map((job: any) => (
              <Card
                key={job.id}
                className="p-5 sm:p-6 bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all rounded-2xl"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">{job.title}</h3>
                      {job.isPersonalized && job.matchScore > 0 && (
                        <Badge variant="success" className="text-[10px]">
                          {job.matchScore}% Match
                        </Badge>
                      )}
                      {job.isLocal && (
                        <Badge variant="purple" className="text-[10px]">
                          📍 Local: {job.city || 'Chennai'}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {job.locationType}
                      </Badge>
                      <Badge variant="success" className="text-[10px]">
                        {job.experienceLevel}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Required Skills Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills?.map((s: any) => (
                        <span
                          key={s.skill.name}
                          className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-medium"
                        >
                          {s.skill.name}
                        </span>
                      ))}
                    </div>

                    {job.whyMatches && job.isPersonalized && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                        {job.whyMatches}
                      </div>
                    )}
                  </div>

                  {/* Price & Action */}
                  <div className="flex flex-col sm:items-end justify-between shrink-0 gap-3">
                    <div className="text-left sm:text-right">
                      <p className="text-base font-bold text-emerald-700">
                        {formatCurrency(job.minSalary, job.currency)} - {formatCurrency(job.maxSalary, job.currency)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">{job.company?.name}</p>
                    </div>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenProposalGenerator(job)}
                      className="gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Generate AI Proposal
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Proposal Generator Modal */}
        {selectedJobForProposal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <Badge variant="default" className="mb-1">AI Proposal Generator</Badge>
                  <h3 className="text-lg font-bold text-slate-900">{selectedJobForProposal.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedJobForProposal(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg"
                >
                  ✕
                </button>
              </div>

              {isGeneratingProposal ? (
                <div className="py-12 text-center space-y-2">
                  <Sparkles className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-sm text-slate-700 font-semibold">AI is drafting your custom proposal...</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Proposed Price ($):
                    </label>
                    <input
                      type="number"
                      value={proposedRate}
                      onChange={(e) => setProposedRate(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Editable Proposal Content:
                    </label>
                    <textarea
                      rows={10}
                      value={customCoverLetter}
                      onChange={(e) => setCustomCoverLetter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedJobForProposal(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSubmitProposal}
                      isLoading={isSubmittingProposal}
                      className="gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" /> Submit Proposal
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resume Parser Modal */}
        {showResumeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-emerald-600" /> Resume Skill Extractor
                </h3>
                <button onClick={() => setShowResumeModal(false)} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Paste your resume text below. Our AI will automatically identify technical competencies and save them directly to your profile:
                </p>
                <textarea
                  rows={6}
                  placeholder="Paste your resume work history, technical skills (e.g. React, Next.js, Java, Spring Boot, PostgreSQL, Docker)..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500"
                />

                {extractedSkills && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                    <p className="font-bold text-emerald-800">AI Detected Skills Saved to Profile:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {extractedSkills.map((sk) => (
                        <Badge key={sk} variant="success">{sk}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowResumeModal(false)}>Close</Button>
                  <Button variant="default" size="sm" onClick={handleParseResume} isLoading={isParsingResume}>
                    Analyze & Save Skills with AI
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
