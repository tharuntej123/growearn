'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Users,
  ArrowRight,
  Search,
  RefreshCw,
  Bot,
  Cpu,
} from 'lucide-react';
import { toast } from 'sonner';

const POPULAR_SKILLS = [
  { name: 'Java', icon: '☕', tag: 'Core Java, Spring Boot & Microservices' },
  { name: 'Full Stack Web Development', icon: '🚀', tag: 'Next.js, TypeScript & PostgreSQL' },
  { name: 'Python & Machine Learning', icon: '🤖', tag: 'PyTorch, Pandas & Scikit-Learn' },
  { name: 'Generative AI & RAG Workflows', icon: '🧠', tag: 'LangChain, pgvector & LLMs' },
  { name: 'Cloud & DevOps Mastery', icon: '☁️', tag: 'Docker, Kubernetes & AWS' },
  { name: 'System Design & Distributed Architecture', icon: '🏛️', tag: 'Scalability & Microservices' },
  { name: 'PostgreSQL & Database Optimization', icon: '🗄️', tag: 'Indexing, ACID & Query Tuning' },
];

import { CourseUI, MentorUI, AgenticRoadmapDataUI, RAGRoadmapDataUI } from '@/types/ui';
import { AgenticRoadmapView, DatabaseRoadmapView } from '@/components/learner/learner-roadmap-views';
import { LearnerCoursesSection } from '@/components/learner/learner-courses-section';
import { MentorshipRequestModal } from '@/components/learner/mentorship-request-modal';

export default function LearnerDashboardPage() {
  const { user } = useAuth();
  const [selectedSkill, setSelectedSkill] = useState<string>('Java');
  const [customSkillInput, setCustomSkillInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [ragData, setRagData] = useState<RAGRoadmapDataUI | null>(null);

  // Pagination & duplicate exclusion states
  const [courses, setCourses] = useState<CourseUI[]>([]);
  const [mentors, setMentors] = useState<MentorUI[]>([]);
  const [displayedCourseIds, setDisplayedCourseIds] = useState<string[]>([]);
  const [displayedMentorIds, setDisplayedMentorIds] = useState<string[]>([]);
  const [isLoadingMoreCourses, setIsLoadingMoreCourses] = useState(false);
  const [isLoadingMoreMentors, setIsLoadingMoreMentors] = useState(false);
  const [hasMoreCourses, setHasMoreCourses] = useState(true);
  const [hasMoreMentors, setHasMoreMentors] = useState(true);

  // Mentorship request modal state
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState<MentorUI | null>(null);
  const [requestTopic, setRequestTopic] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestPreferredTime, setRequestPreferredTime] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Enrolled courses state
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());

  // CrewAI Multi-Agent Roadmap state
  const [agenticData, setAgenticData] = useState<AgenticRoadmapDataUI | null>(null);
  const [isGeneratingAgentic, setIsGeneratingAgentic] = useState(false);

  const handleGenerateAgenticRoadmap = async (skillToSearch = selectedSkill) => {
    setIsGeneratingAgentic(true);
    try {
      const res = await fetch('/api/ai/roadmap/agentic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: skillToSearch,
          current_skills: user?.skills?.map((s: { skill?: { name?: string }; name?: string }) => s.skill?.name || s.name || String(s)) || [],
          target_timeline_weeks: 16,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAgenticData(json.data);
        toast.success(`🤖 CrewAI 3-Agent Roadmap generated for "${skillToSearch}"!`);
      } else {
        toast.error(json.error?.message || 'Agentic roadmap generation failed');
      }
    } catch {
      toast.error('Network error during agentic roadmap generation');
    } finally {
      setIsGeneratingAgentic(false);
    }
  };

  const executeRAGSearch = async (skillToSearch: string, showToast = true) => {
    if (!skillToSearch || !skillToSearch.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/rag-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: skillToSearch.trim() }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setRagData(json.data);
        const topC = json.data.topCourses || [];
        const topM = json.data.topMentors || [];
        setCourses(topC);
        setMentors(topM);
        setDisplayedCourseIds(topC.map((c: { id: string }) => c.id));
        setDisplayedMentorIds(topM.map((m: { id: string }) => m.id));
        setHasMoreCourses(topC.length >= 5);
        setHasMoreMentors(topM.length >= 5);

        if (showToast) {
          toast.success(`✨ Roadmap & Recommendations loaded for "${skillToSearch}"!`);
        }
      } else {
        toast.error(json.error?.message || 'Failed to load recommendations');
      }
    } catch {
      toast.error('Network error loading skill roadmap');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNext5Courses = async () => {
    setIsLoadingMoreCourses(true);
    try {
      const excludeParam = displayedCourseIds.join(',');
      const res = await fetch(
        `/api/ai/courses?skill=${encodeURIComponent(selectedSkill)}&offset=${courses.length}&limit=5&excludeIds=${encodeURIComponent(excludeParam)}`
      );
      const json = await res.json();
      if (json.success && json.data?.courses) {
        const nextCourses = json.data.courses;
        if (nextCourses.length === 0) {
          setHasMoreCourses(false);
          toast.info('All relevant courses for this skill are already displayed.');
        } else {
          setCourses((prev) => [...prev, ...nextCourses]);
          setDisplayedCourseIds((prev) => [...prev, ...nextCourses.map((c: { id: string }) => c.id)]);
          setHasMoreCourses(json.data.hasMore && nextCourses.length === 5);
          toast.success(`Loaded ${nextCourses.length} more verified courses!`);
        }
      }
    } catch {
      toast.error('Failed to load next courses');
    } finally {
      setIsLoadingMoreCourses(false);
    }
  };

  const loadNext5Mentors = async () => {
    setIsLoadingMoreMentors(true);
    try {
      const excludeParam = displayedMentorIds.join(',');
      const res = await fetch(
        `/api/ai/mentors?skill=${encodeURIComponent(selectedSkill)}&offset=${mentors.length}&limit=5&excludeIds=${encodeURIComponent(excludeParam)}`
      );
      const json = await res.json();
      if (json.success && json.data?.mentors) {
        const nextMentors = json.data.mentors;
        if (nextMentors.length === 0) {
          setHasMoreMentors(false);
          toast.info('All relevant mentors for this skill are already displayed.');
        } else {
          setMentors((prev) => [...prev, ...nextMentors]);
          setDisplayedMentorIds((prev) => [...prev, ...nextMentors.map((m: { id: string }) => m.id)]);
          setHasMoreMentors(json.data.hasMore && nextMentors.length === 5);
          toast.success(`Loaded ${nextMentors.length} more verified mentors!`);
        }
      }
    } catch {
      toast.error('Failed to load next mentors');
    } finally {
      setIsLoadingMoreMentors(false);
    }
  };

  const handleEnroll = async (courseId: string, courseTitle: string) => {
    if (!user) {
      toast.error('Please sign in to enroll in this course');
      return;
    }

    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        setEnrolledCourseIds((prev) => new Set([...prev, courseId]));
        toast.success(`🎉 Successfully enrolled in "${courseTitle}"!`);
      } else {
        toast.error(json.error?.message || 'Enrollment failed');
      }
    } catch {
      toast.error('Network error during enrollment');
    }
  };

  const handleSubmitMentorshipRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentorForRequest || !requestTopic.trim() || !requestMessage.trim()) {
      toast.error('Please fill in the topic and message');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const res = await fetch(`/api/mentors/${selectedMentorForRequest.id}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: requestTopic.trim(),
          message: requestMessage.trim(),
          preferredTime: requestPreferredTime.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`🎉 Mentorship request sent to ${selectedMentorForRequest.name}!`);
        setSelectedMentorForRequest(null);
        setRequestTopic('');
        setRequestMessage('');
        setRequestPreferredTime('');
      } else {
        toast.error(json.error?.message || 'Failed to submit request');
      }
    } catch {
      toast.error('Network error submitting mentorship request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  useEffect(() => {
    executeRAGSearch('Java', false);
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

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto">
        {/* Hero Section: Skill-First Learning Discovery */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span>Skill-First Career Growth Platform</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              What do you want to learn today?
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Enter any technical skill to instantly load a PostgreSQL database roadmap, verified curriculum courses, and industry expert mentors.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleCustomSkillSubmit} className="flex flex-col sm:flex-row gap-2 pt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="e.g. Java, Python, Next.js, Docker, Machine Learning..."
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 text-sm rounded-xl focus:bg-white/15 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Generate Path</span>
              </Button>
            </form>

            {/* Popular Skill Pills */}
            <div className="pt-2">
              <p className="text-xs font-medium text-slate-400 mb-2">Popular Learning Paths:</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SKILLS.map((sk) => (
                  <button
                    key={sk.name}
                    type="button"
                    onClick={() => handlePickSkill(sk.name)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedSkill === sk.name
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                        : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                    }`}
                  >
                    <span>{sk.icon}</span>
                    <span>{sk.name}</span>
                  </button>
                ))}
              </div>
              {/* CrewAI Multi-Agent Trigger */}
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Bot className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>CrewAI Multi-Agent System: <strong>Researcher</strong> (Tavily search), <strong>Planner</strong> &amp; <strong>Reviewer</strong> agents</span>
                </div>
                <Button
                  type="button"
                  onClick={() => handleGenerateAgenticRoadmap(selectedSkill)}
                  disabled={isGeneratingAgentic}
                  isLoading={isGeneratingAgentic}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Cpu className="h-4 w-4" />
                  <span>{isGeneratingAgentic ? 'Agents Collaborating...' : `Run CrewAI Roadmap (${selectedSkill})`}</span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CrewAI Agentic Multi-Agent Section */}
        {agenticData && (
          <AgenticRoadmapView data={agenticData} selectedSkill={selectedSkill} />
        )}

        {/* Database Roadmap Steps Section */}
        {ragData?.roadmap && (
          <DatabaseRoadmapView data={ragData} selectedSkill={selectedSkill} />
        )}

        {/* Top 5 Verified Courses Section */}
        <LearnerCoursesSection
          selectedSkill={selectedSkill}
          courses={courses}
          enrolledCourseIds={enrolledCourseIds}
          onEnroll={handleEnroll}
          hasMoreCourses={hasMoreCourses}
          isLoadingMoreCourses={isLoadingMoreCourses}
          onLoadNext5Courses={loadNext5Courses}
        />

        {/* Top 5 Verified Mentors Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <span>Industry Mentors in &quot;{selectedSkill}&quot;</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Book 1-on-1 architecture audits, code reviews, and technical mock interviews with verified senior engineers.
              </p>
            </div>
            <Link href="/mentors" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              <span>View All Mentors</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {mentors.length === 0 ? (
            <Card className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
              <p className="text-sm text-slate-500">No mentors currently matched for this skill query.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((m) => (
                <Card
                  key={m.id}
                  className="p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar src={m.avatarUrl} fallback={m.name} size="md" className="rounded-xl ring-2 ring-emerald-100" />
                      <div className="overflow-hidden">
                        <Link href={`/mentors/${m.id}`}>
                          <h3 className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors truncate">
                            {m.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500 truncate">{m.headline || `${m.yearsExperience}+ yrs experience`}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-emerald-700">
                          <span>⭐ {m.rating}</span>
                          <span>•</span>
                          <span>${m.hourlyRate}/hr</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{m.bio}</p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {(typeof m.expertise === 'string' ? m.expertise.split(',') : []).slice(0, 4).map((exp: string) => (
                        <span key={exp} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link href={`/mentors/${m.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                        View Profile
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedMentorForRequest(m);
                        setRequestTopic(`Mentorship on ${selectedSkill}`);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      Request Mentorship
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Show Next 5 Mentors Pagination */}
          {hasMoreMentors && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                onClick={loadNext5Mentors}
                disabled={isLoadingMoreMentors}
                className="px-6 rounded-xl text-xs font-semibold border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
              >
                {isLoadingMoreMentors ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading next mentors...
                  </span>
                ) : (
                  <span>Show Next 5 Mentors (Exclude Displayed)</span>
                )}
              </Button>
            </div>
          )}
        </section>

        {/* Mentorship Request Modal */}
        <MentorshipRequestModal
          mentor={selectedMentorForRequest}
          onClose={() => setSelectedMentorForRequest(null)}
          onSubmit={handleSubmitMentorshipRequest}
          topic={requestTopic}
          setTopic={setRequestTopic}
          message={requestMessage}
          setMessage={setRequestMessage}
          preferredTime={requestPreferredTime}
          setPreferredTime={setRequestPreferredTime}
          isSubmitting={isSubmittingRequest}
        />
      </main>
    </div>
  );
}
