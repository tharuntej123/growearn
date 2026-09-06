'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { QuickPostCard } from '@/components/feed/quick-post-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Target,
  AlertCircle,
  Play,
  Clock,
  Users,
  Compass,
  ArrowRight,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, mentorRes, feedRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/mentors'),
        fetch('/api/posts?tab=latest'),
      ]);

      const [dashJson, mentorJson, feedJson] = await Promise.all([
        dashRes.json(),
        mentorRes.json(),
        feedRes.json(),
      ]);

      if (dashJson.success && dashJson.data) {
        setData(dashJson.data);
      }
      if (mentorJson.success && mentorJson.data?.mentors) {
        setMentors(mentorJson.data.mentors.slice(0, 3));
      }
      if (feedJson.success && feedJson.data?.posts) {
        setFeedPosts(feedJson.data.posts.slice(0, 3));
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
  const roadmap = data?.roadmap;
  const skillAnalysis = data?.skillAnalysis;
  const recommendedCourses = data?.recommendedCourses || [];
  const hasSkills = Boolean(userContext?.hasSkills && userContext.skills.length > 0);

  const handlePostCreated = (newPost: any) => {
    setFeedPosts([newPost, ...feedPosts]);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Dynamic Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-3xl border border-emerald-200/80 bg-white shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">Learner Dashboard</Badge>
                {hasSkills ? (
                  <Badge variant="success" className="text-[10px]">AI Roadmap Active</Badge>
                ) : (
                  <Badge variant="warning" className="text-[10px]">Onboarding Pending</Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {userContext?.name || user?.name || 'Learner'}! 👋
              </h1>

              {hasSkills ? (
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                  Target Market Role: <span className="text-emerald-700 font-bold">{userContext?.profile?.targetRole || 'Full Stack Developer'}</span> • Career Goal: <span className="text-slate-800 font-medium">{userContext?.profile?.careerGoal || 'Master Production Tech'}</span>
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-amber-700 mt-1.5 max-w-2xl leading-relaxed">
                  Select your target job role to generate your AI market career roadmap, matching courses, and mentor pairings.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link href="/onboarding">
                <Button variant="default" size="sm" className="gap-1.5 shadow-sm font-semibold">
                  <Sparkles className="h-4 w-4" /> {hasSkills ? 'Re-calibrate AI Roadmap' : 'Pick Target Market Role'}
                </Button>
              </Link>
              <Link href="/ai-assistant">
                <Button variant="outline" size="sm" className="bg-white gap-1.5 font-semibold text-emerald-700 border-emerald-200">
                  <Sparkles className="h-4 w-4 text-emerald-600" /> Ask AI Assistant
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* SECTION 1: AI SUGGESTED CAREER ROADMAP */}
        {roadmap && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" /> AI-Generated Career Roadmap: {roadmap.targetRole}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{roadmap.summary}</p>
              </div>
              <Badge variant="success" className="shrink-0 font-bold">
                {roadmap.estimatedDurationWeeks || 12} Weeks Estimated
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roadmap.phases?.map((phase: any, index: number) => (
                <Card key={phase.phaseNumber || index} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="purple" className="text-[10px]">
                        Phase {phase.phaseNumber || index + 1}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-500">{phase.durationWeeks || 3} wks</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{phase.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{phase.objective}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-[11px] space-y-1">
                    <p className="text-emerald-700 font-semibold truncate">
                      Key Skills: {phase.skills?.slice(0, 3).join(', ')}
                    </p>
                    <p className="text-slate-500 font-medium truncate">
                      Milestone: {phase.milestone}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: RECOMMENDED SKILL-GAP COURSES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-teal-600" /> Top Recommended Courses for Your Target Role
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeted curricula to bridge high-priority skill gaps and prepare you for technical interviews.
              </p>
            </div>
            <Link href="/courses">
              <Button variant="outline" size="sm" className="gap-1 text-xs font-semibold">
                Explore All Courses <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedCourses.slice(0, 3).map((course: any) => (
              <Card key={course.id} className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-sm transition-all">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="text-[10px]">{course.category}</Badge>
                    <span className="text-xs font-bold text-amber-600">★ {course.rating || '4.9'}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{course.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{course.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-700">
                    {course.price > 0 ? `$${course.price}` : 'Free'}
                  </span>
                  <Link href="/courses">
                    <Button size="sm" variant="default" className="gap-1 text-xs font-semibold">
                      <Play className="h-3 w-3 fill-current" /> Start Learning
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 3: RECOMMENDED EXPERT MENTORS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" /> Recommended Expert Mentors
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Book 1-on-1 code reviews, system design mock interviews, and career coaching sessions.
              </p>
            </div>
            <Link href="/mentors">
              <Button variant="outline" size="sm" className="gap-1 text-xs font-semibold">
                Find More Mentors <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mentors.map((m: any) => (
              <Card key={m.id} className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-sm transition-all">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={m.avatarUrl} fallback={m.name} size="md" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{m.name}</h4>
                      <p className="text-xs text-emerald-700 font-semibold">${m.mentorProfile?.hourlyRate || 85}/hr</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{m.headline || m.bio || 'Experienced Tech Mentor'}</p>
                  <div className="flex flex-wrap gap-1">
                    {m.skills?.slice(0, 3).map((sk: any) => (
                      <span key={sk.id || sk.skill?.name} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {sk.skill?.name || sk.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3">
                  <Link href="/mentors">
                    <Button size="sm" variant="default" className="w-full text-xs font-semibold">
                      Book Mentorship Session
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 4: COMMUNITY FEED & QUICK POST */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Compass className="h-5 w-5 text-emerald-600" /> Community Feed & Quick Post
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Share your daily learning milestone, ask questions, or connect with peers and mentors.
              </p>
            </div>
            <Link href="/feed">
              <Button variant="outline" size="sm" className="gap-1 text-xs font-semibold">
                Open Full Feed <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <QuickPostCard
                onPostCreated={handlePostCreated}
                placeholder="Share what technical concepts or courses you mastered today..."
              />
            </div>

            <div className="lg:col-span-2 space-y-3">
              {feedPosts.map((post) => (
                <Card key={post.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={post.author?.avatarUrl} fallback={post.author?.name || 'User'} size="sm" />
                      <div>
                        <span className="text-xs font-bold text-slate-900">{post.author?.name}</span>
                        <Badge variant="outline" className="ml-2 text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-800">
                          {post.author?.role === 'EMPLOYER' ? 'Company' : post.author?.role}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">Community Post</span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{post.content}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-rose-500" /> {post.likesCount || post.likes?.length || 0} Likes</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> {post.commentsCount || post.comments?.length || 0} Comments</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
