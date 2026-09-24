'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { RoleGuard } from '@/components/auth/role-guard';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { QuickPostCard } from '@/components/feed/quick-post-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Play,
  Clock,
  Users,
  Compass,
  ArrowRight,
  Heart,
  MessageSquare,
  Search,
  Zap,
  Layers,
  Award,
  Calendar,
  ShieldCheck,
  Check,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

const POPULAR_SKILLS = [
  { name: 'Full Stack Web Development', icon: '🚀', tag: 'Next.js & TypeScript' },
  { name: 'Java & Spring Boot Microservices', icon: '☕', tag: 'Java 21 & Spring Boot 3' },
  { name: 'Python & Machine Learning', icon: '🤖', tag: 'PyTorch & Scikit-Learn' },
  { name: 'Generative AI & RAG Workflows', icon: '🧠', tag: 'LangChain & Vector DBs' },
  { name: 'Cloud & DevOps Mastery', icon: '☁️', tag: 'Docker, K8s & AWS' },
  { name: 'System Design & Distributed Architecture', icon: '🏛️', tag: 'High-Throughput Scaling' },
  { name: 'PostgreSQL & Database Optimization', icon: '🗄️', tag: 'Indexing & Performance' },
  { name: 'Mobile App Development', icon: '📱', tag: 'Flutter & React Native' },
  { name: 'Cybersecurity & Web Defense', icon: '🛡️', tag: 'OAuth2 & OWASP' },
  { name: 'UI/UX Design Systems', icon: '🎨', tag: 'Figma & Tailwind CSS' },
];

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Interactive "What I Want to Learn" State
  const [selectedSkill, setSelectedSkill] = useState<string>('Full Stack Web Development');
  const [customSkillInput, setCustomSkillInput] = useState<string>('');
  const [isGeneratingRAG, setIsGeneratingRAG] = useState<boolean>(false);
  const [ragData, setRagData] = useState<any>(null);

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
        setMentors(mentorJson.data.mentors.slice(0, 5));
      }
      if (feedJson.success && feedJson.data?.posts) {
        setFeedPosts(feedJson.data.posts.slice(0, 3));
      }

      // Initial RAG query for default skill
      const initialSkill =
        dashJson.data?.userContext?.profile?.targetRole ||
        dashJson.data?.userContext?.profile?.careerGoal ||
        'Full Stack Web Development';
      setSelectedSkill(initialSkill);
      await executeRAGSearch(initialSkill, false);
    } catch {
      toast.error('Failed to load personalized dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const executeRAGSearch = async (skillToSearch: string, showToast = true) => {
    if (!skillToSearch || !skillToSearch.trim()) {
      toast.error('Please select or type a skill to generate recommendations.');
      return;
    }

    setIsGeneratingRAG(true);
    try {
      const res = await fetch('/api/ai/rag-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: skillToSearch.trim() }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setRagData(json.data);
        if (showToast) {
          toast.success(
            `✨ RAG generated learning roadmap, top 5 courses & top 5 mentors for "${skillToSearch}"!`
          );
        }
      } else {
        toast.error(json.error?.message || 'Failed to retrieve RAG recommendations');
      }
    } catch {
      toast.error('Network error during RAG retrieval');
    } finally {
      setIsGeneratingRAG(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePickSkill = (skillName: string) => {
    setSelectedSkill(skillName);
    setCustomSkillInput('');
    executeRAGSearch(skillName);
  };

  const handleCustomSkillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSkillInput.trim()) {
      setSelectedSkill(customSkillInput.trim());
      executeRAGSearch(customSkillInput.trim());
    }
  };

  const handlePostCreated = (newPost: any) => {
    setFeedPosts([newPost, ...feedPosts]);
  };

  const userContext = data?.userContext;
  const activeRoadmap = ragData?.roadmap || data?.roadmap;
  const topCourses = ragData?.topCourses || data?.recommendedCourses?.slice(0, 5) || [];
  const topMentors = ragData?.topMentors || mentors.slice(0, 5) || [];

  return (
    <RoleGuard allowedRoles={['STUDENT', 'LEARNER', 'ADMIN']} roleName="Learner / Student">
      <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
        <DashboardSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Welcome Banner */}
          <div className="p-6 sm:p-8 rounded-3xl border border-emerald-200/80 bg-white shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">Learner Dashboard</Badge>
                  <Badge variant="success" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    <ShieldCheck className="h-3 w-3 mr-1 inline" /> Student Verified
                  </Badge>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome back, {userContext?.name || user?.name || 'Learner'}! 👋
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                  Choose any skill or topic below to activate the <span className="font-bold text-emerald-700">Growearn RAG Engine</span>. It retrieves the exact <span className="font-bold text-slate-800">4-Phase AI Roadmap</span>, the <span className="font-bold text-slate-800">Top 5 Matching Courses</span>, and the <span className="font-bold text-slate-800">Top 5 Verified Mentors</span> from our live platform database.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link href="/onboarding">
                  <Button variant="outline" size="sm" className="bg-white gap-1.5 font-semibold text-slate-700 border-slate-200">
                    Edit Profile Goals
                  </Button>
                </Link>
                <Link href="/ai-assistant">
                  <Button variant="default" size="sm" className="gap-1.5 shadow-sm font-semibold">
                    <Sparkles className="h-4 w-4" /> Ask AI Assistant
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* 🎯 Interactive "What Do You Want to Learn?" Section */}
          <div className="p-6 sm:p-7 rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white shadow-md relative overflow-hidden space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                    <Flame className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    What do you want to learn today?
                  </h2>
                </div>
                <p className="text-xs text-slate-600">
                  Click a skill pill or type any custom tech to generate your personalized Roadmap, Top 5 Courses & Top 5 Mentors via RAG.
                </p>
              </div>

              <Badge variant="outline" className="text-xs bg-white text-emerald-800 border-emerald-300 font-semibold px-3 py-1 shadow-2xs shrink-0">
                <Zap className="h-3 w-3 text-emerald-600 mr-1 fill-emerald-600" /> Live Vector RAG Active
              </Badge>
            </div>

            {/* Quick Skill Selector Pills */}
            <div className="flex flex-wrap gap-2">
              {POPULAR_SKILLS.map((sk) => {
                const isSelected = selectedSkill.toLowerCase() === sk.name.toLowerCase();
                return (
                  <button
                    key={sk.name}
                    type="button"
                    onClick={() => handlePickSkill(sk.name)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md scale-102 ring-2 ring-emerald-600/30'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <span>{sk.icon}</span>
                    <span>{sk.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 ml-0.5 stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Input & Action */}
            <form onSubmit={handleCustomSkillSubmit} className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Or type any specific skill (e.g. Docker, Rust, Golang, PyTorch, GraphQL, Spring Security, Flutter)..."
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  className="pl-10 h-11 bg-white border-slate-300 text-xs rounded-xl focus:border-emerald-500 shadow-xs"
                />
              </div>

              <Button
                type="submit"
                variant="default"
                disabled={isGeneratingRAG}
                isLoading={isGeneratingRAG}
                className="w-full sm:w-auto h-11 px-6 text-xs font-bold gap-2 shrink-0 shadow-md bg-emerald-600 hover:bg-emerald-700"
              >
                <Sparkles className="h-4 w-4 fill-white" />
                {isGeneratingRAG ? 'Searching RAG Database...' : 'Generate AI Learning Path'}
              </Button>
            </form>

            {ragData?.ragMetrics && (
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 pt-1 border-t border-emerald-200/60 font-medium">
                <span>🎯 Active Query: <strong className="text-emerald-800">{ragData.skill}</strong></span>
                <span>📚 Indexed Courses: <strong className="text-slate-800">{ragData.ragMetrics.totalIndexedCourses}</strong></span>
                <span>👥 Indexed Mentors: <strong className="text-slate-800">{ragData.ragMetrics.totalIndexedMentors}</strong></span>
                <span className="text-emerald-700 font-semibold">⚡ {ragData.ragMetrics.searchConfidence}</span>
              </div>
            )}
          </div>

          {/* 1️⃣ OUTPUT 1: AI Career Roadmap for Selected Skill */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  1. AI Career Roadmap: {activeRoadmap?.targetRole || selectedSkill}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeRoadmap?.summary || 'Tailored step-by-step career path synthesized through RAG database retrieval.'}
                </p>
              </div>

              <Badge variant="success" className="shrink-0 font-bold self-start sm:self-auto">
                <Calendar className="h-3 w-3 mr-1 inline" />
                {activeRoadmap?.estimatedDurationWeeks || 14} Weeks Estimated Pacing
              </Badge>
            </div>

            {isGeneratingRAG ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeRoadmap?.phases?.map((phase: any, index: number) => (
                  <Card
                    key={phase.phaseNumber || index}
                    className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Badge variant="purple" className="text-[10px] font-bold">
                          Phase {phase.phaseNumber || index + 1}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {phase.durationWeeks || 3} wks
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{phase.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{phase.objective}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-[11px] space-y-1.5">
                      <div className="flex flex-wrap gap-1">
                        {phase.skills?.slice(0, 3).map((s: string) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[10px]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <p className="text-slate-500 font-medium line-clamp-1">
                        <strong className="text-slate-700">Milestone:</strong> {phase.milestone}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 2️⃣ OUTPUT 2: Top 5 Matching Courses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-teal-600" />
                  2. Top 5 Verified Courses for &ldquo;{selectedSkill}&rdquo;
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Semantic RAG vector matching retrieved the top 5 highest-rated courses specifically teaching this curriculum.
                </p>
              </div>

              <Link href="/courses">
                <Button variant="outline" size="sm" className="gap-1 text-xs font-semibold bg-white">
                  All Courses <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {isGeneratingRAG ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-52 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : topCourses.length === 0 ? (
              <Card className="p-8 text-center bg-white border-dashed border-slate-300 rounded-2xl">
                <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800 text-sm">No exact course matches in database</h3>
                <p className="text-xs text-slate-500 mt-1">Try selecting another popular skill above or browse all platform courses.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topCourses.map((course: any, idx: number) => (
                  <Card
                    key={course.id || idx}
                    className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between shadow-xs hover:border-emerald-300 hover:shadow-md transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">
                          {course.category}
                        </Badge>
                        <Badge variant="success" className="text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border-emerald-200">
                          {course.matchScore ? `${course.matchScore}% RAG Match` : `#${idx + 1} Best Match`}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">{course.title}</h4>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">{course.description}</p>
                      </div>

                      {course.skillsCovered && course.skillsCovered.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(course.skillsCovered)
                            ? course.skillsCovered
                            : course.skillsCovered.split(',')
                          )
                            .slice(0, 3)
                            .map((s: string) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                              >
                                {s.trim()}
                              </span>
                            ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span>Instructor: <strong className="text-slate-700">{course.instructor?.name || 'Growearn Mentor'}</strong></span>
                        <span className="font-bold text-amber-600">★ {course.rating || '4.9'}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-emerald-700">
                        {course.price > 0 ? `$${course.price}` : 'Free'}
                      </span>
                      <Link href={`/courses/${course.id || ''}`}>
                        <Button size="sm" variant="default" className="gap-1 text-xs font-semibold">
                          <Play className="h-3 w-3 fill-current" /> Start Learning
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 3️⃣ OUTPUT 3: Top 5 Matching Mentors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  3. Top 5 Expert Mentors for &ldquo;{selectedSkill}&rdquo;
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Semantic RAG vector matching retrieved the top 5 verified industry mentors with expertise in this technology.
                </p>
              </div>

              <Link href="/mentors">
                <Button variant="outline" size="sm" className="gap-1 text-xs font-semibold bg-white">
                  Find More Mentors <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {isGeneratingRAG ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-52 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : topMentors.length === 0 ? (
              <Card className="p-8 text-center bg-white border-dashed border-slate-300 rounded-2xl">
                <Users className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800 text-sm">No mentors matched for this query</h3>
                <p className="text-xs text-slate-500 mt-1">Browse our full verified mentor directory for 1-on-1 coaching.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topMentors.map((m: any, idx: number) => {
                  const expertiseList = Array.isArray(m.expertise)
                    ? m.expertise
                    : m.expertise?.split(',') || [];

                  return (
                    <Card
                      key={m.id || idx}
                      className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between shadow-xs hover:border-emerald-300 hover:shadow-md transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <Avatar src={m.avatarUrl || m.user?.avatarUrl} fallback={m.name || m.user?.name} size="md" />
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{m.name || m.user?.name}</h4>
                              <p className="text-xs text-emerald-700 font-semibold">
                                ${m.hourlyRate || m.mentorProfile?.hourlyRate || 85}/hr
                              </p>
                            </div>
                          </div>

                          <Badge variant="success" className="text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border-emerald-200 shrink-0">
                            {m.matchScore ? `${m.matchScore}% Match` : `#${idx + 1} Top Mentor`}
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {m.headline || m.bio || m.user?.headline || m.user?.bio || 'Experienced Tech Mentor & Code Auditor'}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {expertiseList.slice(0, 3).map((sk: string) => (
                            <span
                              key={sk}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                            >
                              {sk.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-600">
                          ★ {m.rating || '4.9'} ({m.studentsCount || 80}+ students)
                        </span>
                        <Link href="/mentors">
                          <Button size="sm" variant="default" className="text-xs font-semibold">
                            Book Session
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Community Feed & Quick Post */}
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
                <Button variant="outline" size="sm" className="gap-1 text-xs font-semibold bg-white">
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
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 text-rose-500" /> {post.likesCount || post.likes?.length || 0} Likes
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> {post.commentsCount || post.comments?.length || 0} Comments
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
