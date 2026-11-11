'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
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
import { LearnerMentorsSection } from '@/components/learner/learner-mentors-section';
import { MentorshipRequestModal } from '@/components/learner/mentorship-request-modal';
import { CheckoutModal } from '@/components/payment/checkout-modal';

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

  // Course Cashfree Checkout state
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState<CourseUI | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

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

  const handleEnroll = async (course: CourseUI) => {
    if (!user) {
      toast.error('Please sign in to enroll in this course');
      return;
    }

    if (enrolledCourseIds.has(course.id)) {
      toast.info(`You are already enrolled in "${course.title}".`);
      return;
    }

    // If this is a paid course, launch Cashfree Checkout Modal directly
    if (Number(course.price || 0) > 0) {
      setSelectedCourseForCheckout(course);
      setShowCheckoutModal(true);
      return;
    }

    try {
      const res = await fetch(`/api/courses/${course.id}/enroll`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        setEnrolledCourseIds((prev) => new Set([...prev, course.id]));
        toast.success(`🎉 Successfully enrolled in "${course.title}"!`);
      } else if (res.status === 402 || json.error?.code === 'PAYMENT_REQUIRED') {
        setSelectedCourseForCheckout(course);
        setShowCheckoutModal(true);
      } else {
        toast.error(json.error?.message || 'Enrollment failed');
      }
    } catch {
      toast.error('Network error during enrollment');
    }
  };

  const handlePaymentSuccess = () => {
    if (selectedCourseForCheckout) {
      setEnrolledCourseIds((prev) => new Set([...prev, selectedCourseForCheckout.id]));
      toast.success(`🎉 Payment confirmed! You are now enrolled in "${selectedCourseForCheckout.title}"!`);
      setShowCheckoutModal(false);
      setSelectedCourseForCheckout(null);
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

  useEffect(() => {
    if (user) {
      fetch('/api/dashboard/stats')
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data?.userContext?.enrolledCourses) {
            const ids = json.data.userContext.enrolledCourses.map((c: { id: string }) => c.id);
            setEnrolledCourseIds(new Set(ids));
          }
        })
        .catch(() => {});
    }
  }, [user]);

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
        <LearnerMentorsSection
          selectedSkill={selectedSkill}
          mentors={mentors}
          onRequestMentorship={(m) => {
            setSelectedMentorForRequest(m);
            setRequestTopic(`Mentorship on ${selectedSkill}`);
          }}
          hasMoreMentors={hasMoreMentors}
          isLoadingMoreMentors={isLoadingMoreMentors}
          onLoadNext5Mentors={loadNext5Mentors}
        />

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

        {/* Cashfree Course Checkout Modal */}
        {showCheckoutModal && selectedCourseForCheckout && (
          <CheckoutModal
            isOpen={showCheckoutModal}
            onClose={() => {
              setShowCheckoutModal(false);
              setSelectedCourseForCheckout(null);
            }}
            itemType="COURSE"
            itemId={selectedCourseForCheckout.id}
            title={selectedCourseForCheckout.title}
            price={Number(selectedCourseForCheckout.price || 0)}
            instructorOrMentorName={selectedCourseForCheckout.instructor?.name}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </main>
    </div>
  );
}
