'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Target,
  AlertCircle,
  Play,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'skill_analysis' | 'courses' | 'jobs'>('roadmap');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch {
      toast.error('Failed to load personalized dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const userContext = data?.userContext;
  const skillAnalysis = data?.skillAnalysis;
  const roadmap = data?.roadmap;
  const hasSkills = Boolean(userContext?.hasSkills && userContext.skills.length > 0);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Dynamic Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-3xl border border-emerald-200/80 bg-white shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">Dashboard</Badge>
                {hasSkills ? (
                  <Badge variant="success" className="text-[10px]">Profile Active</Badge>
                ) : (
                  <Badge variant="warning" className="text-[10px]">Onboarding Pending</Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Dashboard — Welcome, {userContext?.name || user?.name || 'Learner'}! 👋
              </h1>

              {hasSkills ? (
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                  Target Role: <span className="text-emerald-700 font-bold">{userContext?.profile?.targetRole || 'Full Stack Developer'}</span> • Career Goal: <span className="text-slate-800 font-medium">{userContext?.profile?.careerGoal || 'Advance Career'}</span>
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-amber-700 mt-1.5 max-w-2xl leading-relaxed">
                  Add your current skills to unlock personalized job recommendations, course matches, and your multi-phase AI career roadmap.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link href="/onboarding">
                <Button variant="default" size="sm" className="gap-1.5 shadow-sm font-semibold">
                  <Sparkles className="h-4 w-4" /> {hasSkills ? 'Re-calibrate AI Profile' : 'Personalize Workspace'}
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  Edit Skills & Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Profile Personalization Level:</span>
                <Badge variant={userContext?.completionPercentage >= 75 ? 'success' : 'warning'} className="text-[11px]">
                  {userContext?.completionPercentage || 25}%
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                {userContext?.missingProfileItems?.length > 0
                  ? `Improve match accuracy by completing: ${userContext.missingProfileItems.slice(0, 3).join(', ')}`
                  : 'Your profile is fully configured for optimal AI recommendations!'}
              </p>
            </div>

            <div className="w-full sm:w-64">
              <Progress value={userContext?.completionPercentage || 25} />
            </div>
          </div>
        </Card>

        {/* EMPTY STATE FOR NEW USERS WITH 0 SKILLS */}
        {!hasSkills && !isLoading && (
          <Card className="p-8 bg-white border border-emerald-200 rounded-3xl shadow-sm text-center space-y-6">
            <div className="max-w-md mx-auto space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto animate-pulse">
                <Target className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Your Personalized Career Workspace Starts Here</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete our quick 4-step personalization to generate your exact skill gap analysis, multi-phase roadmap, and matched opportunities.
              </p>
            </div>

            {/* 4 Steps Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-emerald-700 text-sm">Step 1</span>
                <p className="font-semibold text-slate-900">Enter Your Skills</p>
                <p className="text-[11px] text-slate-500">Tell us what you currently know (e.g. Java, Python, React, SQL).</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-emerald-700 text-sm">Step 2</span>
                <p className="font-semibold text-slate-900">Set Target Role</p>
                <p className="text-[11px] text-slate-500">Choose your goal (Backend Developer, AI Engineer, Full Stack).</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-emerald-700 text-sm">Step 3</span>
                <p className="font-semibold text-slate-900">Generate AI Roadmap</p>
                <p className="text-[11px] text-slate-500">Get a multi-phase learning path tailored to your skill gaps.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-emerald-700 text-sm">Step 4</span>
                <p className="font-semibold text-slate-900">Unlock Contracts & Mentors</p>
                <p className="text-[11px] text-slate-500">Discover matching jobs and 1-on-1 industry mentors.</p>
              </div>
            </div>

            <Link href="/onboarding">
              <Button variant="default" size="lg" className="gap-2 px-8">
                <Sparkles className="h-5 w-5" /> Start 2-Minute Personalization
              </Button>
            </Link>
          </Card>
        )}

        {/* FULL PERSONALIZED DASHBOARD FOR USERS WITH SKILLS */}
        {hasSkills && (
          <>
            {/* Top Metric Cards */}
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
                  {userContext?.skills?.slice(0, 3).join(', ')}
                </p>
              </Card>

              <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Identified Skill Gaps</span>
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
                  {skillAnalysis?.skillGaps?.length || 0}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">To achieve {userContext?.profile?.targetRole || 'Target Role'}</p>
              </Card>

              <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Roadmap Duration</span>
                  <Clock className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">
                  {roadmap?.estimatedDurationWeeks || 12} wks
                </p>
                <p className="text-[11px] text-slate-500 mt-1">{roadmap?.phases?.length || 4} structured phases</p>
              </Card>

              <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Course Enrollments</span>
                  <BookOpen className="h-4 w-4 text-teal-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  {userContext?.enrolledCourses?.length || 0}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {userContext?.completedCourses?.length || 0} completed
                </p>
              </Card>
            </div>

            {/* Tabbed Personalized Views */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {[
                    { id: 'roadmap', label: '🗺️ Career Roadmap' },
                    { id: 'skill_analysis', label: '🔍 AI Skill Gap Breakdown' },
                    { id: 'courses', label: '📚 Skill-Gap Courses' },
                    { id: 'jobs', label: '💼 Matching Jobs' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === t.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB 1: Structured Multi-Phase Roadmap */}
              {activeTab === 'roadmap' && roadmap && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-slate-700 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Target Role: {roadmap.targetRole}</p>
                      <p className="text-slate-600 mt-0.5">{roadmap.summary}</p>
                    </div>
                    <Badge variant="success" className="shrink-0">{roadmap.estimatedDurationWeeks} Weeks</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roadmap.phases?.map((phase: any) => (
                      <Card key={phase.phaseNumber} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <Badge variant="purple" className="text-[10px]">
                            Phase {phase.phaseNumber} • {phase.durationWeeks} Weeks
                          </Badge>
                          <span className="text-xs text-emerald-700 font-semibold">{phase.skills?.join(', ')}</span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900">{phase.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{phase.objective}</p>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                          <p><strong className="text-slate-700">Topics:</strong> {phase.topics?.join(' • ')}</p>
                          <p><strong className="text-slate-700">Project:</strong> {phase.projects?.join(', ')}</p>
                          <p><strong className="text-emerald-700">Milestone:</strong> {phase.milestone}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: AI Skill Gap Analysis */}
              {activeTab === 'skill_analysis' && (
                <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-6 shadow-xs">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Your Skills vs Target Role Requirements</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{skillAnalysis?.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Verified Current Skills ({userContext?.skills?.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {userContext?.skills?.map((sk: string) => (
                          <span key={sk} className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                            ✓ {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Gaps */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-amber-600" /> High-Priority Missing Skill Gaps ({skillAnalysis?.skillGaps?.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {skillAnalysis?.skillGaps?.map((gap: string) => (
                          <span key={gap} className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
                            • {gap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* TAB 3: Skill-Gap Driven Recommended Courses */}
              {activeTab === 'courses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data?.recommendedCourses?.map((course: any) => (
                    <Card key={course.id} className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between shadow-xs">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="default" className="text-[10px]">{course.category}</Badge>
                          <span className="text-xs font-bold text-amber-600">★ {course.rating}</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 line-clamp-1">{course.title}</h4>
                        <p className="text-xs text-slate-600 line-clamp-2">{course.description}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-emerald-700">
                          {course.price > 0 ? `$${course.price}` : 'Free'}
                        </span>
                        <Link href="/courses">
                          <Button size="sm" variant="default" className="gap-1 text-xs">
                            <Play className="h-3 w-3 fill-current" /> View Syllabus
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* TAB 4: Matching Jobs */}
              {activeTab === 'jobs' && (
                <div className="space-y-4">
                  {data?.recommendedJobs?.map((job: any) => (
                    <Card key={job.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-slate-900">{job.title}</h4>
                            <Badge variant="success" className="text-xs">{job.matchScore}% Match</Badge>
                          </div>
                          <p className="text-xs text-slate-600">{job.company?.name} • {job.locationType} • {job.experienceLevel}</p>
                          <p className="text-[11px] text-emerald-800 font-medium">{job.whyMatches}</p>
                        </div>

                        <Link href="/jobs">
                          <Button size="sm" variant="default">
                            Apply with AI Proposal
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
