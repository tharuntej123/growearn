'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
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
  Compass,
} from 'lucide-react';
import { QuickPostCard } from '@/components/feed/quick-post-card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface CandidateItem {
  id: string;
  name: string;
  avatarUrl?: string;
  headline?: string;
  location?: string;
  role: string;
  profile?: {
    yearsOfExperience?: number;
    hourlyRate?: number;
    aiScore?: number;
  };
  skills: { skill: { name: string } }[];
}

interface JobItem {
  id: string;
  title: string;
  description: string;
  city?: string;
  locationType: string;
  jobType: string;
  minSalary: number;
  maxSalary: number;
  currency: string;
  status: string;
  createdAt: string;
  skills: { skill: { name: string } }[];
  _count?: {
    applications: number;
    proposals: number;
  };
}

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [myJobs, setMyJobs] = useState<JobItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  const [showJobModal, setShowJobModal] = useState(false);
  const [isLocalJob, setIsLocalJob] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobCity, setJobCity] = useState('Chennai');
  const [jobLocationType, setJobLocationType] = useState('HYBRID');
  const [jobType, setJobType] = useState('FULL_TIME');
  const [minSalary, setMinSalary] = useState(25000);
  const [maxSalary, setMaxSalary] = useState(40000);
  const [jobSkills, setJobSkills] = useState('Java, Spring Boot, PostgreSQL');
  const [isPostingJob, setIsPostingJob] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [applicants, setApplicants] = useState([
    {
      id: 'app-1',
      candidateName: 'Elena Rostova',
      candidateTitle: 'Full Stack Engineer & React Specialist',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      jobTitle: 'Senior Java & Spring Boot Backend Architect',
      matchScore: 96,
      status: 'REVIEWING',
      appliedDate: '2 hours ago',
    },
    {
      id: 'app-2',
      candidateName: 'Alex Chen',
      candidateTitle: 'Computer Science Student & Aspiring Full Stack Developer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      jobTitle: 'Junior Full Stack Developer (Internship to Hire)',
      matchScore: 91,
      status: 'INTERVIEW',
      appliedDate: 'Yesterday',
    },
  ]);

  const fetchCandidates = async (query = '', skill = '') => {
    setIsLoadingCandidates(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (skill) params.append('skill', skill);

      const res = await fetch(`/api/candidates?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data?.candidates) {
        setCandidates(json.data.candidates);
      }
    } catch {
      toast.error('Failed to load candidate directory');
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const fetchMyJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const res = await fetch('/api/jobs?mine=true');
      const json = await res.json();
      if (json.success && json.data?.jobs) {
        setMyJobs(json.data.jobs);
      }
    } catch {
      console.warn('Could not load company jobs listing');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchMyJobs();
  }, []);

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
    if (isLocalJob && !jobCity.trim()) {
      errors.city = 'City/location is required for local job postings';
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
          city: isLocalJob ? (jobCity.trim() || 'Chennai') : 'Remote / Worldwide',
          locationType: isLocalJob ? jobLocationType : 'REMOTE',
          jobType,
          minSalary: Number(minSalary),
          maxSalary: Number(maxSalary),
          currency: 'USD',
          experienceLevel: 'MID',
          isLocal: isLocalJob,
          skills: jobSkills.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          isLocalJob
            ? `Local job in ${jobCity} posted successfully!`
            : 'Global / Remote freelance job posted successfully!'
        );
        setShowJobModal(false);
        setJobTitle('');
        setJobDescription('');
        setFieldErrors({});
        setFormError(null);
        fetchMyJobs();
      } else {
        const errorDetails = json.error?.details;
        if (errorDetails && typeof errorDetails === 'object') {
          const mappedErrors: Record<string, string> = {};
          Object.entries(errorDetails).forEach(([field, msgs]) => {
            if (Array.isArray(msgs) && msgs.length > 0) {
              mappedErrors[field] = msgs[0];
            } else if (typeof msgs === 'string') {
              mappedErrors[field] = msgs;
            }
          });
          setFieldErrors(mappedErrors);
        }
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

  const handleUpdateStatus = (appId: string, newStatus: string) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    toast.success(`Applicant status updated to ${newStatus}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="p-6 sm:p-8 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="success">Dashboard</Badge>
                <Badge variant="outline" className="text-[10px] bg-white text-emerald-800 border-emerald-200">
                  {user?.profile?.companyName || 'Talent & Hiring Hub'}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Dashboard 🏢
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Post full-time, contract, and local professional roles. Review applicants with AI match rankings and source verified talent.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={openCreateJobModal}
                className="gap-1.5 shadow-sm"
              >
                <PlusCircle className="h-4 w-4" /> Post New Job Opportunity
              </Button>
              <Link href="/jobs">
                <Button variant="outline" size="sm" className="bg-white">
                  View Live Listings
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Your Active Job Postings</h2>
              <p className="text-xs text-slate-500">Live positions open for candidate applications & proposals</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200">
                {myJobs.length} Positions Active
              </Badge>
              <Button size="sm" variant="outline" onClick={openCreateJobModal} className="text-xs bg-white">
                <PlusCircle className="h-3.5 w-3.5 mr-1" /> New Job
              </Button>
            </div>
          </div>

          {isLoadingJobs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : myJobs.length === 0 ? (
            <Card className="p-8 text-center bg-white border-dashed border-slate-300 rounded-2xl">
              <Briefcase className="h-10 w-10 text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">No Active Job Postings Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Create your first job listing to start receiving AI-matched applications and freelancer proposals.
              </p>
              <Button size="sm" variant="default" onClick={openCreateJobModal} className="mt-4 gap-1.5">
                <PlusCircle className="h-4 w-4" /> Create Job Listing
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myJobs.map((job) => (
                <Card key={job.id} className="p-5 bg-white border-slate-200/90 shadow-sm rounded-2xl flex flex-col justify-between hover:border-emerald-200 transition-colors">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="success" className="text-[10px] uppercase">
                          {job.locationType}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-slate-600 bg-slate-50">
                          {job.jobType.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs text-emerald-800 bg-emerald-50 border-emerald-200">
                        {job._count?.applications ?? 0} Applicants
                      </Badge>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 line-clamp-1">{job.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">{job.description}</p>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {job.skills?.slice(0, 3).map((s) => (
                        <span
                          key={s.skill.name}
                          className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-medium"
                        >
                          {s.skill.name}
                        </span>
                      ))}
                      {(job.skills?.length ?? 0) > 3 && (
                        <span className="px-2 py-0.5 text-[10px] text-slate-500">
                          +{(job.skills?.length ?? 0) - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      {formatCurrency(job.minSalary, job.currency)} - {formatCurrency(job.maxSalary, job.currency)}
                    </span>
                    <Link href={`/jobs/${job.id}`}>
                      <Button size="sm" variant="outline" className="text-xs bg-white gap-1">
                        View Listing <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Active Hiring Pipeline</h2>
              <p className="text-xs text-slate-500">Manage candidates from application to contract offer</p>
            </div>
            <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200">{applicants.length} In Progress</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applicants.map((app) => (
              <Card key={app.id} className="p-5 bg-white border-slate-200/90 shadow-sm rounded-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar src={app.avatarUrl} fallback={app.candidateName} size="md" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{app.candidateName}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{app.candidateTitle}</p>
                      <p className="text-xs font-semibold text-emerald-800 mt-1">Role: {app.jobTitle}</p>
                    </div>
                  </div>

                  <Badge variant="success" className="text-xs font-bold">
                    {app.matchScore}% Match
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> Applied {app.appliedDate}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={app.status}
                      onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                      aria-label="Candidate application status"
                      className="bg-white border border-slate-300 text-xs text-slate-800 rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:border-emerald-500 shadow-sm"
                    >
                      <option value="APPLIED">Applied</option>
                      <option value="REVIEWING">Reviewing</option>
                      <option value="SHORTLISTED">Shortlisted</option>
                      <option value="INTERVIEW">Interview</option>
                      <option value="ACCEPTED">Hire / Offer</option>
                      <option value="REJECTED">Reject</option>
                    </select>

                    <Link href="/messages">
                      <Button size="sm" variant="default" className="text-xs">
                        Message
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Find Talent & Professionals</h2>
              <p className="text-xs text-slate-500">Discover pre-vetted engineers with verified skill scores</p>
            </div>

            <div className="flex items-center gap-2 max-w-md w-full">
              <Input
                placeholder="Search candidate name, headline, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchCandidates(searchQuery, selectedSkill);
                }}
                icon={<Search className="h-4 w-4" />}
                className="bg-white"
              />
              <Button size="sm" variant="outline" onClick={() => fetchCandidates(searchQuery, selectedSkill)} className="bg-white">
                Filter
              </Button>
            </div>
          </div>

          {isLoadingCandidates ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {candidates.map((c) => (
                <Card key={c.id} className="p-5 bg-white border-slate-200/90 shadow-sm rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <Avatar src={c.avatarUrl} fallback={c.name} size="md" />
                      <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50">
                        {c.profile?.aiScore || 85} AI Score
                      </Badge>
                    </div>
                    <h4 className="font-bold text-base text-slate-900">{c.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{c.headline || c.role}</p>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {c.skills.slice(0, 4).map((s) => (
                        <span
                          key={s.skill.name}
                          className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-medium"
                        >
                          {s.skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {c.profile?.yearsOfExperience || 2} yrs exp • {c.location?.split(',')[0] || 'Remote'}
                    </span>
                    <Link href="/messages">
                      <Button size="sm" variant="outline" className="text-xs bg-white">
                        Contact
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Compass className="h-5 w-5 text-emerald-600" /> Share with Talent Community
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Announce open roles, team hiring culture, and project opportunities.</p>
          </div>

          <QuickPostCard
            placeholder="Announce newly opened positions, engineering challenges, or company updates..."
          />
        </div>

        {showJobModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-emerald-600" /> Post Job Opportunity
                </h3>
                <button onClick={() => setShowJobModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
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
                  {fieldErrors.title && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.title}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Job Description & Responsibilities *</label>
                    <span className={`text-[10px] ${jobDescription.length < 20 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                      {jobDescription.length}/20 min chars
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Describe the scope, technical expectations, and deliverable milestones (minimum 20 characters)..."
                    value={jobDescription}
                    onChange={(e) => {
                      setJobDescription(e.target.value);
                      if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: '' }));
                    }}
                    className={`w-full bg-white border rounded-xl p-3 text-slate-800 focus:outline-none shadow-sm ${
                      fieldErrors.description ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'
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
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 shadow-sm"
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
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 shadow-sm"
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
                    {fieldErrors.city && (
                      <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.city}</p>
                    )}
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
                  {fieldErrors.skills && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.skills}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowJobModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" type="submit" isLoading={isPostingJob} className="shadow-sm">
                    Publish Job Listing
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
