'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { RoleGuard } from '@/components/auth/role-guard';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  Building2,
  Sparkles,
  PlusCircle,
  Briefcase,
  Users,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Check,
  X,
  Star,
  Calendar,
  MessageSquare,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  DollarSign,
  Award,
  Layers,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface UserSkillItem {
  skill: {
    id?: string;
    name: string;
    category?: string;
  };
  proficiencyLevel?: string;
  isVerified?: boolean;
}

interface ApplicationItem {
  id: string;
  jobId: string;
  applicantId: string;
  status: string; // APPLIED, REVIEWING, SHORTLISTED, INTERVIEW, ACCEPTED, REJECTED
  matchScore: number;
  matchExplanation?: string;
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: string;
  applicant: {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string;
    headline?: string;
    location?: string;
    bio?: string;
    profile?: {
      yearsOfExperience?: number;
      hourlyRate?: number;
      aiScore?: number;
      portfolioUrl?: string;
      githubUrl?: string;
      linkedinUrl?: string;
      title?: string;
    };
    skills: UserSkillItem[];
    experiences?: {
      id: string;
      title: string;
      company: string;
      startDate: string;
      endDate?: string;
    }[];
  };
}

interface ProposalItem {
  id: string;
  jobId: string;
  professionalId: string;
  status: string;
  coverLetter: string;
  proposedRate: number;
  estimatedDays: number;
  createdAt: string;
  professional: {
    id: string;
    name: string;
    avatarUrl?: string;
    headline?: string;
    location?: string;
    profile?: {
      hourlyRate?: number;
      yearsOfExperience?: number;
    };
    skills: UserSkillItem[];
  };
}

interface JobItem {
  id: string;
  title: string;
  description: string;
  city?: string;
  state?: string;
  country?: string;
  locationType: string;
  jobType: string;
  minSalary: number;
  maxSalary: number;
  currency: string;
  experienceLevel: string;
  status: string;
  createdAt: string;
  skills: { skill: { name: string } }[];
  applications?: ApplicationItem[];
  proposals?: ProposalItem[];
  _count?: {
    applications: number;
    proposals: number;
  };
}

interface CandidateItem {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  headline?: string;
  location?: string;
  bio?: string;
  role: string;
  profile?: {
    yearsOfExperience?: number;
    hourlyRate?: number;
    aiScore?: number;
    portfolioUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    title?: string;
  };
  skills: UserSkillItem[];
  matchScore?: number;
  aiMatch?: {
    overallScore: number;
    factors: {
      skillMatch: { score: number; weight: number; matched: string[]; missing: string[] };
      experienceMatch: { score: number; weight: number; userYears: number; requiredYears: number };
      locationMatch: { score: number; weight: number; explanation: string };
      careerGoalMatch: { score: number; weight: number; alignment: string };
      aiSemanticScore: { score: number; weight: number; reasoning: string };
    };
    explanation: string;
  };
}

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'jobs' | 'professionals'>('jobs');

  // Job Postings & Applications State
  const [myJobs, setMyJobs] = useState<JobItem[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});

  // Decision Modal State
  const [selectedApplication, setSelectedApplication] = useState<ApplicationItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Find Professionals State (RAG Matched)
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const [selectedJobForMatch, setSelectedJobForMatch] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('');
  const [inspectingCandidate, setInspectingCandidate] = useState<CandidateItem | null>(null);

  // Post New Job Modal State
  const [showJobModal, setShowJobModal] = useState(false);
  const [isLocalJob, setIsLocalJob] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobCity, setJobCity] = useState('Chennai');
  const [jobLocationType, setJobLocationType] = useState('HYBRID');
  const [jobType, setJobType] = useState('FULL_TIME');
  const [minSalary, setMinSalary] = useState(25000);
  const [maxSalary, setMaxSalary] = useState(40000);
  const [jobSkills, setJobSkills] = useState('Java, Spring Boot, PostgreSQL, Docker');
  const [isPostingJob, setIsPostingJob] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Load My Jobs
  const fetchMyJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const res = await fetch('/api/jobs?mine=true');
      const json = await res.json();
      if (json.success && json.data?.jobs) {
        const jobs: JobItem[] = json.data.jobs;
        setMyJobs(jobs);

        // Auto-expand all jobs with applications initially
        const initialExpanded: Record<string, boolean> = {};
        jobs.forEach((j) => {
          initialExpanded[j.id] = true;
        });
        setExpandedJobs(initialExpanded);

        // Set default job for candidate matching if not set
        if (jobs.length > 0 && selectedJobForMatch === 'ALL') {
          setSelectedJobForMatch(jobs[0].id);
        }
      }
    } catch {
      toast.error('Failed to load company job postings');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Load Professionals with real RAG Matching against selected Job
  const fetchCandidates = async (jobIdParam?: string, searchParam?: string, skillParam?: string) => {
    setIsLoadingCandidates(true);
    try {
      const params = new URLSearchParams();
      const currentJobId = jobIdParam !== undefined ? jobIdParam : selectedJobForMatch;
      if (currentJobId && currentJobId !== 'ALL') {
        params.append('jobId', currentJobId);
      }
      const currentSearch = searchParam !== undefined ? searchParam : searchQuery;
      if (currentSearch) params.append('search', currentSearch);
      const currentSkill = skillParam !== undefined ? skillParam : selectedSkillFilter;
      if (currentSkill) params.append('skill', currentSkill);

      const res = await fetch(`/api/candidates?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data?.candidates) {
        setCandidates(json.data.candidates);
      }
    } catch {
      toast.error('Failed to load matched professionals directory');
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  useEffect(() => {
    fetchCandidates(selectedJobForMatch, searchQuery, selectedSkillFilter);
  }, [selectedJobForMatch]);

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  // Take Decision on Candidate Application
  const handleUpdateApplicationStatus = async (applicationId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Application decision saved: Status updated to ${newStatus}`);

        // Update local job applications state
        setMyJobs((prevJobs) =>
          prevJobs.map((j) => ({
            ...j,
            applications: j.applications?.map((app) =>
              app.id === applicationId ? { ...app, status: newStatus } : app
            ),
          }))
        );

        if (selectedApplication && selectedApplication.id === applicationId) {
          setSelectedApplication((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } else {
        toast.error(json.error?.message || 'Failed to update application status');
      }
    } catch {
      toast.error('Network error updating application status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openCreateJobModal = () => {
    setFieldErrors({});
    setFormError(null);
    setShowJobModal(true);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const errors: Record<string, string> = {};
    if (!jobTitle.trim() || jobTitle.trim().length < 3) {
      errors.title = 'Job title must be at least 3 characters';
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      errors.description = 'Job description must be at least 20 characters';
    }
    if (Number(minSalary) < 0) {
      errors.minSalary = 'Minimum salary must be 0 or greater';
    }
    if (Number(maxSalary) < Number(minSalary)) {
      errors.maxSalary = 'Maximum salary cannot be less than minimum salary';
    }
    if (!jobSkills.trim()) {
      errors.skills = 'At least one skill is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please resolve the highlighted validation errors.');
      return;
    }

    setIsPostingJob(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobTitle.trim(),
          description: jobDescription.trim(),
          city: isLocalJob ? jobCity.trim() || 'Chennai' : 'Remote / Worldwide',
          locationType: isLocalJob ? jobLocationType : 'REMOTE',
          jobType,
          minSalary: Number(minSalary),
          maxSalary: Number(maxSalary),
          currency: 'USD',
          experienceLevel: 'MID',
          isLocal: isLocalJob,
          skills: jobSkills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Job opportunity published successfully!');
        setShowJobModal(false);
        setJobTitle('');
        setJobDescription('');
        setFieldErrors({});
        setFormError(null);
        await fetchMyJobs();
      } else {
        const errorMsg = json.error?.message || 'Failed to post job';
        setFormError(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      setFormError('A network or server error occurred while posting job.');
      toast.error('Job posting failed due to network error');
    } finally {
      setIsPostingJob(false);
    }
  };

  // Metrics summary
  const totalApplications = useMemo(() => {
    return myJobs.reduce((acc, job) => acc + (job.applications?.length || 0), 0);
  }, [myJobs]);

  const totalInterviews = useMemo(() => {
    return myJobs.reduce(
      (acc, job) =>
        acc +
        (job.applications?.filter((a) => a.status === 'INTERVIEW' || a.status === 'SHORTLISTED')
          .length || 0),
      0
    );
  }, [myJobs]);

  const totalAccepted = useMemo(() => {
    return myJobs.reduce(
      (acc, job) => acc + (job.applications?.filter((a) => a.status === 'ACCEPTED').length || 0),
      0
    );
  }, [myJobs]);

  const activeMatchingJob = useMemo(() => {
    if (selectedJobForMatch === 'ALL') return null;
    return myJobs.find((j) => j.id === selectedJobForMatch) || null;
  }, [selectedJobForMatch, myJobs]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Applied</Badge>;
      case 'REVIEWING':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Reviewing</Badge>;
      case 'SHORTLISTED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold">⭐ Shortlisted</Badge>;
      case 'INTERVIEW':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 font-bold">📅 Interview Scheduled</Badge>;
      case 'ACCEPTED':
        return <Badge variant="success" className="font-bold">🎉 Hired / Offer Extended</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-300">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <RoleGuard allowedRoles={['COMPANY', 'EMPLOYER', 'ADMIN']} roleName="Company / Employer">
      <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
        <DashboardSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success" className="font-semibold">Company Hiring Workspace</Badge>
                  <Badge variant="outline" className="text-xs bg-white text-emerald-800 border-emerald-200">
                    {user?.profile?.companyName || user?.name || 'NovaTech Solutions'}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Company Talent Hub 🏢
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                  Manage your active job postings, review incoming candidate requests with AI match scoring, and find top professionals from our verified database.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={openCreateJobModal}
                  className="gap-1.5 shadow-sm font-semibold"
                >
                  <PlusCircle className="h-4 w-4" /> Post New Job Opportunity
                </Button>
                <Link href="/messages">
                  <Button variant="outline" size="sm" className="bg-white gap-1.5">
                    <MessageSquare className="h-4 w-4 text-emerald-600" /> Direct Messages
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-100/80">
              <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-emerald-100 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Active Positions</span>
                <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{myJobs.length}</span>
              </div>
              <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-emerald-100 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Applicant Requests</span>
                <span className="text-xl font-extrabold text-emerald-700 mt-0.5 block">{totalApplications}</span>
              </div>
              <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-emerald-100 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Interviews & Shortlist</span>
                <span className="text-xl font-extrabold text-purple-700 mt-0.5 block">{totalInterviews}</span>
              </div>
              <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-emerald-100 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Hired Candidates</span>
                <span className="text-xl font-extrabold text-teal-700 mt-0.5 block">{totalAccepted}</span>
              </div>
            </div>
          </div>

          {/* TWO CLEAN CATEGORIES / TABS */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`pb-3 px-4 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'jobs'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              1. My Job Postings & Applications
              <Badge variant="outline" className={`text-xs ml-1 ${activeTab === 'jobs' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600'}`}>
                {myJobs.length} Jobs • {totalApplications} Applicants
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab('professionals')}
              className={`pb-3 px-4 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'professionals'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="h-4 w-4" />
              2. Find Professionals (RAG Matched)
              <Badge variant="outline" className={`text-xs ml-1 ${activeTab === 'professionals' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600'}`}>
                <Sparkles className="h-3 w-3 text-emerald-600 mr-1" /> Vector Top-K Match
              </Badge>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* CATEGORY 1: MY JOB POSTINGS & UNDER EACH JOB SHOW APPLICATIONS            */}
          {/* ========================================================================= */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Job Postings & Applicant Requests</h2>
                  <p className="text-xs text-slate-500">
                    Review each active job posting with candidate requests received below it. Click any applicant to view full profile & take a decision.
                  </p>
                </div>
                <Button size="sm" variant="default" onClick={openCreateJobModal} className="gap-1.5 self-start">
                  <PlusCircle className="h-4 w-4" /> Post New Job
                </Button>
              </div>

              {isLoadingJobs ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-48 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
                  ))}
                </div>
              ) : myJobs.length === 0 ? (
                <Card className="p-12 text-center bg-white border-dashed border-slate-300 rounded-3xl space-y-3">
                  <Briefcase className="h-12 w-12 text-slate-300 mx-auto" />
                  <h3 className="font-bold text-slate-800 text-base">No Job Postings Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Publish your first engineering position to start receiving AI-matched applications from verified professionals and students.
                  </p>
                  <Button size="sm" variant="default" onClick={openCreateJobModal} className="gap-1.5 mt-2">
                    <PlusCircle className="h-4 w-4" /> Create Your First Job Posting
                  </Button>
                </Card>
              ) : (
                <div className="space-y-6">
                  {myJobs.map((job) => {
                    const isExpanded = expandedJobs[job.id] ?? true;
                    const jobApplications = job.applications || [];
                    const jobProposals = job.proposals || [];
                    const totalRequests = jobApplications.length + jobProposals.length;

                    return (
                      <Card
                        key={job.id}
                        className="bg-white border-slate-200/90 shadow-sm rounded-3xl overflow-hidden hover:border-emerald-200/80 transition-all"
                      >
                        {/* Job Posting Header Card */}
                        <div className="p-6 bg-gradient-to-r from-slate-50/80 via-white to-emerald-50/20 border-b border-slate-100">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="success" className="text-[10px] uppercase font-bold tracking-wider">
                                  {job.locationType}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] text-slate-700 bg-white font-semibold">
                                  {job.jobType.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] text-slate-600 bg-white">
                                  {job.experienceLevel} Level
                                </Badge>
                                <span className="text-xs text-slate-400">• Posted {formatDate(job.createdAt)}</span>
                              </div>

                              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{job.title}</h3>
                              <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{job.description}</p>

                              {/* Required Skills */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[11px] font-semibold text-slate-500 mr-1">Required Skills:</span>
                                {job.skills?.map((s) => (
                                  <span
                                    key={s.skill.name}
                                    className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-900"
                                  >
                                    {s.skill.name}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Job Actions & Compensation */}
                            <div className="flex lg:flex-col items-end justify-between lg:justify-start gap-3 min-w-[200px]">
                              <div className="text-right">
                                <span className="text-xs text-slate-400 block">Compensation</span>
                                <span className="text-sm sm:text-base font-extrabold text-slate-900">
                                  {formatCurrency(job.minSalary, job.currency)} - {formatCurrency(job.maxSalary, job.currency)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleJobExpansion(job.id)}
                                  className="text-xs bg-white gap-1.5 shadow-xs"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> Hide Requests ({totalRequests})
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> View Requests ({totalRequests})
                                    </>
                                  )}
                                </Button>
                                <Link href={`/jobs/${job.id}`}>
                                  <Button size="sm" variant="ghost" className="text-xs text-slate-600">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* UNDER EACH JOB: APPLICANT REQUESTS */}
                        {isExpanded && (
                          <div className="p-6 bg-white space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-emerald-600" />
                                <h4 className="text-sm font-extrabold text-slate-900">
                                  Applicant Requests for this Position ({totalRequests})
                                </h4>
                              </div>
                              <span className="text-xs text-slate-500">
                                Click any candidate to review full application, match analysis, and take decisions.
                              </span>
                            </div>

                            {totalRequests === 0 ? (
                              <div className="p-6 text-center rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 space-y-2">
                                <p className="text-xs font-semibold text-slate-600">
                                  No applicant requests received yet for this position.
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  Use the "Find Professionals" tab to proactively discover and invite AI-matched candidates.
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedJobForMatch(job.id);
                                    setActiveTab('professionals');
                                  }}
                                  className="text-xs bg-white gap-1.5 mt-2"
                                >
                                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Source Matched Talent for this Role
                                </Button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {jobApplications.map((app) => (
                                  <div
                                    key={app.id}
                                    className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                                  >
                                    <div>
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                          <Avatar
                                            src={app.applicant.avatarUrl}
                                            fallback={app.applicant.name}
                                            size="md"
                                          />
                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <h5 className="font-extrabold text-sm text-slate-900">
                                                {app.applicant.name}
                                              </h5>
                                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                                Verified
                                              </span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                              {app.applicant.headline || app.applicant.profile?.title || 'Professional'}
                                            </p>
                                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                              <MapPin className="h-3 w-3" />
                                              {app.applicant.location?.split(',')[0] || 'Remote'} •{' '}
                                              {app.applicant.profile?.yearsOfExperience || 2} yrs exp
                                            </p>
                                          </div>
                                        </div>

                                        {/* AI Match Score Badge */}
                                        <div className="text-right">
                                          <Badge variant="success" className="text-xs font-extrabold gap-1">
                                            <Sparkles className="h-3 w-3" /> {app.matchScore}% Match
                                          </Badge>
                                          <span className="text-[10px] text-slate-400 block mt-1">
                                            {formatDate(app.appliedAt)}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Cover Letter Excerpt */}
                                      {app.coverLetter && (
                                        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 line-clamp-2 italic">
                                          "{app.coverLetter}"
                                        </div>
                                      )}

                                      {/* Candidate Verified Skills */}
                                      <div className="flex flex-wrap gap-1 mt-3">
                                        {app.applicant.skills?.slice(0, 4).map((s) => (
                                          <span
                                            key={s.skill.name}
                                            className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-medium text-slate-700"
                                          >
                                            {s.skill.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Application Status & Decision Action */}
                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] text-slate-400">Status:</span>
                                        {getStatusBadge(app.status)}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => setSelectedApplication(app)}
                                          className="text-xs font-semibold gap-1"
                                        >
                                          Review & Decide <ArrowRight className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {jobProposals.map((prop) => (
                                  <div
                                    key={prop.id}
                                    className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                                  >
                                    <div>
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                          <Avatar
                                            src={prop.professional.avatarUrl}
                                            fallback={prop.professional.name}
                                            size="md"
                                          />
                                          <div>
                                            <h5 className="font-extrabold text-sm text-slate-900">
                                              {prop.professional.name}
                                            </h5>
                                            <p className="text-xs text-slate-500 line-clamp-1">
                                              {prop.professional.headline || 'Freelance Professional'}
                                            </p>
                                            <p className="text-[11px] font-semibold text-emerald-800 mt-1">
                                              Proposed Rate: ${prop.proposedRate}/hr • Est: {prop.estimatedDays} days
                                            </p>
                                          </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs font-bold bg-slate-50">
                                          Proposal
                                        </Badge>
                                      </div>

                                      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 line-clamp-2 italic">
                                        "{prop.coverLetter}"
                                      </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                      <Badge variant="outline" className="text-xs">
                                        {prop.status}
                                      </Badge>
                                      <Link href="/messages">
                                        <Button size="sm" variant="outline" className="text-xs bg-white gap-1">
                                          <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> Chat
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* CATEGORY 2: FIND PROFESSIONALS (RAG MATCHED BY JOB SKILL SET)              */}
          {/* ========================================================================= */}
          {activeTab === 'professionals' && (
            <div className="space-y-6">
              {/* Job Matching Selector & Context Banner */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-600" /> Match Professionals Against Job Requirements
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select one of your active positions to run real semantic RAG top-K vector search and skill overlap analysis against our candidate database.
                    </p>
                  </div>

                  {/* Job Selector Dropdown */}
                  <div className="flex items-center gap-2 min-w-[280px]">
                    <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Target Job:</span>
                    <select
                      value={selectedJobForMatch}
                      onChange={(e) => setSelectedJobForMatch(e.target.value)}
                      aria-label="Select target job for candidate matching"
                      className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-emerald-500 shadow-xs"
                    >
                      <option value="ALL">All Available Professionals</option>
                      {myJobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title} ({j.skills.map((s) => s.skill.name).slice(0, 2).join(', ')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Matching Skills Tags Banner */}
                {activeMatchingJob && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-emerald-950">Active RAG Skill Match:</span>
                      {activeMatchingJob.skills?.map((s) => (
                        <span
                          key={s.skill.name}
                          className="px-2.5 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-900 font-bold text-[11px] shadow-2xs"
                        >
                          {s.skill.name}
                        </span>
                      ))}
                      <span className="text-[11px] text-emerald-800 font-medium">
                        ({activeMatchingJob.experienceLevel} Level • {activeMatchingJob.locationType})
                      </span>
                    </div>

                    <Badge variant="outline" className="bg-white text-emerald-800 border-emerald-300 font-bold text-[11px]">
                      {candidates.length} Qualified Matches Found
                    </Badge>
                  </div>
                )}

                {/* Free Search & Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="Search freelancer name, headline, technical bio..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') fetchCandidates(selectedJobForMatch, searchQuery, selectedSkillFilter);
                      }}
                      icon={<Search className="h-4 w-4 text-slate-400" />}
                      className="bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Filter by skill (e.g. Java, React)..."
                      value={selectedSkillFilter}
                      onChange={(e) => setSelectedSkillFilter(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') fetchCandidates(selectedJobForMatch, searchQuery, selectedSkillFilter);
                      }}
                      className="bg-white"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchCandidates(selectedJobForMatch, searchQuery, selectedSkillFilter)}
                      className="bg-white text-xs px-4"
                    >
                      Filter
                    </Button>
                  </div>
                </div>
              </div>

              {/* Matched Professionals Grid */}
              {isLoadingCandidates ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-56 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
                  ))}
                </div>
              ) : candidates.length === 0 ? (
                <Card className="p-10 text-center bg-white border-dashed border-slate-300 rounded-3xl space-y-2">
                  <Users className="h-10 w-10 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">No Professionals Found Matching These Criteria</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try clearing skill filters or adjusting the target job position to broaden your search.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSkillFilter('');
                      fetchCandidates(selectedJobForMatch, '', '');
                    }}
                    className="mt-2 text-xs"
                  >
                    Reset Filters
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {candidates.map((c) => {
                    const matchScore = c.matchScore || c.aiMatch?.overallScore || c.profile?.aiScore || 85;
                    const matchedSkills = c.aiMatch?.factors?.skillMatch?.matched || [];
                    const missingSkills = c.aiMatch?.factors?.skillMatch?.missing || [];

                    return (
                      <Card
                        key={c.id}
                        className="p-5 bg-white border-slate-200/90 shadow-sm rounded-3xl flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <Avatar src={c.avatarUrl} fallback={c.name} size="md" />

                            {/* Authentic RAG Score */}
                            <Badge
                              variant={matchScore >= 90 ? 'success' : 'outline'}
                              className={`text-xs font-extrabold gap-1 ${
                                matchScore < 90 ? 'bg-amber-50 text-amber-800 border-amber-300' : ''
                              }`}
                            >
                              <Sparkles className="h-3 w-3" /> {matchScore}% Match
                            </Badge>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-extrabold text-base text-slate-900">{c.name}</h4>
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md font-bold">
                                Verified
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                              {c.headline || c.profile?.title || c.role}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              📍 {c.location?.split(',')[0] || 'India'} • {c.profile?.yearsOfExperience || 3} yrs exp • ${c.profile?.hourlyRate || 50}/hr
                            </p>
                          </div>

                          {/* Bio Excerpt */}
                          {c.bio && (
                            <p className="text-xs text-slate-500 line-clamp-2 italic">
                              "{c.bio}"
                            </p>
                          )}

                          {/* Profile Skills with RAG highlight */}
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Verified Skills in Database:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {c.skills.slice(0, 5).map((s) => {
                                const isMatched = matchedSkills.some((m) =>
                                  m.toLowerCase().includes(s.skill.name.toLowerCase())
                                );
                                return (
                                  <span
                                    key={s.skill.name}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                      isMatched
                                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {isMatched && '✓ '}
                                    {s.skill.name}
                                  </span>
                                );
                              })}
                              {c.skills.length > 5 && (
                                <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                                  +{c.skills.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectingCandidate(c)}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
                          >
                            View AI Breakdown
                          </button>

                          <Link href="/messages">
                            <Button size="sm" variant="default" className="text-xs gap-1 shadow-xs">
                              <MessageSquare className="h-3.5 w-3.5" /> Message
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* APPLICATION DECISION & CANDIDATE REVIEW MODAL                              */}
          {/* ========================================================================= */}
          {selectedApplication && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={selectedApplication.applicant.avatarUrl}
                      fallback={selectedApplication.applicant.name}
                      size="lg"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-extrabold text-slate-900">
                          {selectedApplication.applicant.name}
                        </h3>
                        <Badge variant="success" className="text-[10px]">Verified Candidate</Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {selectedApplication.applicant.headline || selectedApplication.applicant.profile?.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {selectedApplication.applicant.location || 'Chennai, India'} •{' '}
                        {selectedApplication.applicant.profile?.yearsOfExperience || 2} Years Experience
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 text-base font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* AI RAG MATCH SCORE ANALYSIS */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      <h4 className="font-extrabold text-sm text-emerald-950">
                        RAG Semantic & Skill Compatibility Match
                      </h4>
                    </div>
                    <Badge variant="success" className="text-sm font-extrabold px-3 py-1">
                      {selectedApplication.matchScore}% Compatibility
                    </Badge>
                  </div>

                  <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                    {selectedApplication.matchExplanation ||
                      `${selectedApplication.matchScore}% Match computed from vector similarity search & skill overlap analysis.`}
                  </p>
                </div>

                {/* Cover Letter */}
                {selectedApplication.coverLetter && (
                  <div className="space-y-1.5">
                    <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-500" /> Candidate Proposal & Cover Letter:
                    </h5>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      {selectedApplication.coverLetter}
                    </div>
                  </div>
                )}

                {/* Candidate Verified Skills in Database */}
                <div className="space-y-1.5">
                  <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                    Verified Skills in Database:
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApplication.applicant.skills?.map((s) => (
                      <span
                        key={s.skill.name}
                        className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        {s.skill.name} ({s.proficiencyLevel || 'ADVANCED'})
                      </span>
                    ))}
                  </div>
                </div>

                {/* External Links */}
                {(selectedApplication.resumeUrl ||
                  selectedApplication.applicant.profile?.portfolioUrl ||
                  selectedApplication.applicant.profile?.githubUrl) && (
                  <div className="flex flex-wrap gap-2 pt-1 text-xs">
                    {selectedApplication.resumeUrl && (
                      <a
                        href={selectedApplication.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
                      >
                        <FileText className="h-3.5 w-3.5 text-emerald-600" /> View Resume
                      </a>
                    )}
                    {selectedApplication.applicant.profile?.portfolioUrl && (
                      <a
                        href={selectedApplication.applicant.profile.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-blue-600" /> Portfolio Website
                      </a>
                    )}
                  </div>
                )}

                {/* TAKE DECISION ACTION BAR */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700">Take Hiring Decision:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Current Status:</span>
                      {getStatusBadge(selectedApplication.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={isUpdatingStatus}
                      onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'SHORTLISTED')}
                      className={`text-xs gap-1 bg-white font-semibold ${
                        selectedApplication.status === 'SHORTLISTED'
                          ? 'border-emerald-500 text-emerald-800 bg-emerald-50'
                          : 'border-slate-200 text-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      <Star className="h-3.5 w-3.5 text-amber-500" /> Shortlist
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={isUpdatingStatus}
                      onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'INTERVIEW')}
                      className={`text-xs gap-1 bg-white font-semibold ${
                        selectedApplication.status === 'INTERVIEW'
                          ? 'border-purple-500 text-purple-800 bg-purple-50'
                          : 'border-slate-200 text-slate-700 hover:border-purple-300'
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5 text-purple-500" /> Interview
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      isLoading={isUpdatingStatus}
                      onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'ACCEPTED')}
                      className="text-xs gap-1 font-semibold bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" /> Hire / Accept
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={isUpdatingStatus}
                      onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'REJECTED')}
                      className="text-xs gap-1 bg-white text-rose-600 hover:bg-rose-50 border-slate-200"
                    >
                      <X className="h-3.5 w-3.5" /> Decline
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* AI MATCH BREAKDOWN POPOVER MODAL (FOR CANDIDATE EXPLORATION)               */}
          {/* ========================================================================= */}
          {inspectingCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={inspectingCandidate.avatarUrl} fallback={inspectingCandidate.name} size="md" />
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900">{inspectingCandidate.name}</h4>
                      <p className="text-xs text-slate-500">{inspectingCandidate.headline}</p>
                    </div>
                  </div>
                  <button onClick={() => setInspectingCandidate(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950">AI Match Score:</span>
                      <span className="font-extrabold text-sm text-emerald-700">
                        {inspectingCandidate.matchScore || inspectingCandidate.aiMatch?.overallScore || 90}%
                      </span>
                    </div>
                    <p className="text-emerald-900 text-[11px]">
                      {inspectingCandidate.aiMatch?.explanation || 'Evaluated based on database profile skills, experience, and domain similarity.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Skill Match Factor:</span>
                      <span className="font-bold text-slate-900">{inspectingCandidate.aiMatch?.factors?.skillMatch?.score || 95}%</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Experience Alignment:</span>
                      <span className="font-bold text-slate-900">{inspectingCandidate.aiMatch?.factors?.experienceMatch?.score || 90}%</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Semantic Domain Similarity:</span>
                      <span className="font-bold text-slate-900">{inspectingCandidate.aiMatch?.factors?.aiSemanticScore?.score || 88}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button variant="outline" size="sm" onClick={() => setInspectingCandidate(null)}>
                    Close
                  </Button>
                  <Link href="/messages">
                    <Button variant="default" size="sm" className="gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> Start Conversation
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* POST NEW JOB MODAL                                                        */}
          {/* ========================================================================= */}
          {showJobModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-emerald-600" /> Post Job Opportunity
                  </h3>
                  <button onClick={() => setShowJobModal(false)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>

                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleCreateJob} className="space-y-3.5 text-xs">
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-700">Job Reach & Scope *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLocalJob(false);
                          setJobLocationType('REMOTE');
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          !isLocalJob
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <span className="text-base">🌍</span> Global / Remote Job
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Worldwide freelance & distributed talent</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsLocalJob(true);
                          if (jobLocationType === 'REMOTE') setJobLocationType('HYBRID');
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isLocalJob
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <span className="text-base">📍</span> Local Job (City Specific)
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">On-site or hybrid in Chennai, Bengaluru, etc.</p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Job Title *</label>
                    <Input
                      placeholder="e.g. Senior Java & Spring Boot Backend Architect"
                      value={jobTitle}
                      onChange={(e) => {
                        setJobTitle(e.target.value);
                        if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: '' }));
                      }}
                      className={`bg-white ${fieldErrors.title ? 'border-rose-400 focus:border-rose-500' : ''}`}
                      required
                    />
                    {fieldErrors.title && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.title}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">Job Description & Responsibilities *</label>
                      <span
                        className={`text-[10px] ${
                          jobDescription.length < 20 ? 'text-amber-600 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {jobDescription.length}/20 min chars
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Describe the technical scope, milestones, and deliverable expectations (minimum 20 characters)..."
                      value={jobDescription}
                      onChange={(e) => {
                        setJobDescription(e.target.value);
                        if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: '' }));
                      }}
                      className={`w-full bg-white border rounded-xl p-3 text-slate-800 focus:outline-none shadow-xs ${
                        fieldErrors.description
                          ? 'border-rose-400 focus:border-rose-500'
                          : 'border-slate-200 focus:border-emerald-500'
                      }`}
                      required
                    />
                    {fieldErrors.description && (
                      <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Work Mode</label>
                      <select
                        value={jobLocationType}
                        onChange={(e) => setJobLocationType(e.target.value)}
                        aria-label="Work Mode"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 shadow-xs"
                      >
                        {!isLocalJob ? (
                          <option value="REMOTE">Remote (Worldwide)</option>
                        ) : (
                          <>
                            <option value="HYBRID">Hybrid</option>
                            <option value="ONSITE">On-Site</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Job Type</label>
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                        aria-label="Job Type"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 shadow-xs"
                      >
                        <option value="FULL_TIME">Full-Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="FREELANCE">Professional / Freelance</option>
                        <option value="INTERNSHIP">Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {isLocalJob ? 'City / Location *' : 'Location'}
                      </label>
                      <Input
                        placeholder={isLocalJob ? 'e.g. Chennai, TN' : 'Remote / Worldwide'}
                        value={isLocalJob ? jobCity : 'Remote / Worldwide'}
                        disabled={!isLocalJob}
                        onChange={(e) => {
                          setJobCity(e.target.value);
                          if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: '' }));
                        }}
                        className={`bg-white ${fieldErrors.city ? 'border-rose-400' : ''}`}
                      />
                      {fieldErrors.city && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.city}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Min Salary ($)</label>
                      <Input
                        type="number"
                        value={minSalary}
                        onChange={(e) => {
                          setMinSalary(Number(e.target.value));
                          if (fieldErrors.minSalary) setFieldErrors((prev) => ({ ...prev, minSalary: '' }));
                        }}
                        className={`bg-white ${fieldErrors.minSalary ? 'border-rose-400' : ''}`}
                      />
                      {fieldErrors.minSalary && (
                        <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.minSalary}</p>
                      )}
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Max Salary ($)</label>
                      <Input
                        type="number"
                        value={maxSalary}
                        onChange={(e) => {
                          setMaxSalary(Number(e.target.value));
                          if (fieldErrors.maxSalary) setFieldErrors((prev) => ({ ...prev, maxSalary: '' }));
                        }}
                        className={`bg-white ${fieldErrors.maxSalary ? 'border-rose-400' : ''}`}
                      />
                      {fieldErrors.maxSalary && (
                        <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.maxSalary}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Required Skills (comma-separated) *</label>
                    <Input
                      placeholder="Java, Spring Boot, PostgreSQL, Docker"
                      value={jobSkills}
                      onChange={(e) => {
                        setJobSkills(e.target.value);
                        if (fieldErrors.skills) setFieldErrors((prev) => ({ ...prev, skills: '' }));
                      }}
                      className={`bg-white ${fieldErrors.skills ? 'border-rose-400' : ''}`}
                      required
                    />
                    {fieldErrors.skills && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.skills}</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <Button variant="ghost" size="sm" type="button" onClick={() => setShowJobModal(false)}>
                      Cancel
                    </Button>
                    <Button variant="default" size="sm" type="submit" isLoading={isPostingJob} className="shadow-xs font-semibold">
                      Publish Job Listing
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </RoleGuard>
  );
}
