'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Footer } from '@/components/layout/footer';
import {
  Sparkles,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Users,
  Building2,
  TrendingUp,
  BrainCircuit,
  MapPin,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { DEMO_USERS } from '@/lib/constants';
import { toast } from 'sonner';

export default function LandingPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [activeRoleTab, setActiveRoleTab] = useState<'student' | 'professional' | 'mentor' | 'company'>('student');
  const [isLoggingInDemo, setIsLoggingInDemo] = useState(false);

  const handleQuickDemoLogin = async (email: string, targetDashboard: string) => {
    setIsLoggingInDemo(true);
    toast.loading('Logging in to demo environment...');
    const res = await login(email, 'Demo1234!');
    toast.dismiss();
    setIsLoggingInDemo(false);
    if (res.success) {
      toast.success(`Welcome to ${email}!`);
      router.push(targetDashboard);
    } else {
      toast.error(res.error || 'Failed to log in to demo account');
    }
  };

  const roleJourneys = {
    student: {
      title: 'Learner & Student Journey',
      badge: 'Learn & Accelerate',
      description: 'Start with raw passion, follow personalized AI career roadmaps, complete verified course modules, and get mentored by industry veterans.',
      steps: [
        { title: 'AI Skill Gap Analysis', desc: 'Input your target role; our AI identifies exact gaps in your current stack.' },
        { title: 'Interactive Learning', desc: 'Enroll in structured video courses and track module completion.' },
        { title: '1-on-1 Mentorship', desc: 'Book live architecture reviews and mock interviews with senior engineers.' },
        { title: 'Portfolio Capstone', desc: 'Build verifiable production projects and earn automated completion certificates.' },
        { title: 'First Contract / Role', desc: 'Get matched directly to entry-level roles and local internship opportunities.' },
      ],
      dashboard: '/student/dashboard',
    },
    professional: {
      title: 'Verified Professional Journey',
      badge: 'Work & Deliver',
      description: 'Find high-paying local and global contract gigs. Use the 5-factor explainable AI matching engine and generate tailored proposals in seconds.',
      steps: [
        { title: 'Resume Skill Extraction', desc: 'Upload resume text to automatically extract verified skills and portfolio metadata.' },
        { title: 'Smart Job Matching', desc: 'Hybrid algorithm scores jobs (Skills 50%, Exp 20%, Location 10%, Goal 10%, AI 10%).' },
        { title: 'AI Proposal Assistant', desc: 'Generate high-converting custom proposals with milestone breakdowns.' },
        { title: 'Contract Execution', desc: 'Deliver projects, communicate with hiring companies, and receive verified 5-star ratings.' },
        { title: 'Evolve to Mentor', desc: 'Unlock coaching and mentorship capabilities as your industry reputation grows.' },
      ],
      dashboard: '/professional/dashboard',
    },
    mentor: {
      title: 'Expert Mentor & Instructor',
      badge: 'Teach & Monetize',
      description: 'Monetize your hard-earned engineering insights. Host 1-on-1 coaching sessions, publish paid courses, and guide ambitious developers.',
      steps: [
        { title: 'Create Mentor Profile', desc: 'Set your hourly rate, availability calendar, and core architectural domain.' },
        { title: 'Receive Student Requests', desc: 'Review student roadmaps and accept tailored coaching sessions.' },
        { title: 'Conduct Video Sessions', desc: 'Lead architecture audits and deep-dive code reviews with integrated sessions.' },
        { title: 'Publish Courses', desc: 'Build rich video lessons, share downloadable assets, and generate passive revenue.' },
        { title: 'Earn & Build Reputation', desc: 'Receive verified student reviews and grow your personal industry brand.' },
      ],
      dashboard: '/mentor/dashboard',
    },
    company: {
      title: 'Company & Talent Recruiter',
      badge: 'Hire & Scale',
      description: 'Post full-time, contract, or local project jobs. Use AI candidate ranking to shortlist pre-vetted professionals with pinpoint accuracy.',
      steps: [
        { title: 'Post Job Listing', desc: 'Specify required skills, experience level, salary range, and local/remote mode.' },
        { title: 'AI Talent Search', desc: 'Query candidates with natural language to automatically filter by verified skills.' },
        { title: 'Candidate Match Scores', desc: 'Inspect transparent match breakdowns before scheduling interviews.' },
        { title: 'Unified Pipeline', desc: 'Manage applicants from Applied → Shortlisted → Interview → Hired.' },
        { title: 'Direct Messaging', desc: 'Communicate with candidates and polish interview messages using AI.' },
      ],
      dashboard: '/company/dashboard',
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAF9] text-slate-900 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 mb-8 shadow-xs">
          <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
          <span className="text-xs font-semibold">
            Groearn — The Unified Career & Talent Ecosystem
          </span>
        </div>

        {/* Hero Tagline & Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.15]">
          Learn. Work. Mentor. Grow —{' '}
          <span className="text-gradient-emerald">All in One.</span>
        </h1>

        {/* Supporting Text */}
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
          A modern professional platform connecting learning, mentorship, contract gigs, and AI-powered hiring into one continuous career journey.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" variant="default" className="w-full sm:w-auto gap-2 text-base px-8 h-12 shadow-sm font-semibold">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/jobs">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-12">
              Explore Opportunities
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="ghost" className="w-full sm:w-auto text-base text-slate-600 hover:text-slate-900">
              Login to Account
            </Button>
          </Link>
        </div>

        {/* 1-Click Demo Accounts Bar */}
        <div className="mt-12 p-4 rounded-2xl border border-slate-200 bg-white shadow-xs max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span>Instant Demo Account Logins:</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.email}
                  disabled={isLoggingInDemo}
                  onClick={() =>
                    handleQuickDemoLogin(
                      demo.email,
                      demo.role === 'LEARNER' || (demo.role as string) === 'STUDENT'
                        ? '/student/dashboard'
                        : demo.role === 'MENTOR'
                        ? '/mentor/dashboard'
                        : demo.role === 'PROFESSIONAL' || (demo.role as string) === 'FREELANCER'
                        ? '/professional/dashboard'
                        : '/company/dashboard'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium transition-all hover:border-emerald-400 flex items-center gap-1.5"
                >
                  <span className="font-bold text-emerald-700">{demo.role}:</span> {demo.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Ecosystem Live Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {/* Card 1: Student / Learning */}
          <div className="bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all p-5 rounded-2xl relative overflow-hidden group shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <GraduationCap className="h-5 w-5" />
              </div>
              <Badge variant="success">94% AI Match</Badge>
            </div>
            <h4 className="font-bold text-slate-900 text-base">Spring Boot 3 & Microservices</h4>
            <p className="text-xs text-slate-500 mt-1">Recommended for Backend Engineer goal</p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold">4.9 ★ (84 reviews)</span>
              <span className="text-slate-500">By Dr. Marcus Vance</span>
            </div>
          </div>

          {/* Card 2: Professional / Job */}
          <div className="bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all p-5 rounded-2xl relative overflow-hidden group shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                <Briefcase className="h-5 w-5" />
              </div>
              <Badge variant="purple">Local Match</Badge>
            </div>
            <h4 className="font-bold text-slate-900 text-base">Next.js & AI Web Engineer</h4>
            <p className="text-xs text-slate-500 mt-1">Nexus Dynamics • Chennai / Remote</p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-800 font-semibold">$4,500 - $7,500</span>
              <span className="text-emerald-700 font-medium">95% Match Score</span>
            </div>
          </div>

          {/* Card 3: Mentorship */}
          <div className="bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all p-5 rounded-2xl relative overflow-hidden group shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Users className="h-5 w-5" />
              </div>
              <Badge variant="success">Verified Mentor</Badge>
            </div>
            <h4 className="font-bold text-slate-900 text-base">Dr. Marcus Vance</h4>
            <p className="text-xs text-slate-500 mt-1">Principal Distributed Systems Architect</p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-700">$85/hr • 142 Students</span>
              <span className="text-amber-600 font-semibold">4.95 ★</span>
            </div>
          </div>

          {/* Card 4: Company Talent */}
          <div className="bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all p-5 rounded-2xl relative overflow-hidden group shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                <Building2 className="h-5 w-5" />
              </div>
              <Badge variant="warning">AI Candidate Ranking</Badge>
            </div>
            <h4 className="font-bold text-slate-900 text-base">Elena Rostova</h4>
            <p className="text-xs text-slate-500 mt-1">Senior Full Stack & AI Specialist</p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">TypeScript, Next.js, LLMs</span>
              <span className="text-emerald-700 font-semibold">98% Fit</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS & METRICS BAR */}
      <section className="border-y border-slate-200 bg-white py-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">30+</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Technical Skills Indexed</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600">95%</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">AI Match Accuracy</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-teal-600">100%</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Verified Growth Progression</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-700">5-Factor</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Explainable Hybrid Scoring</p>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE ROLE JOURNEY SWITCHER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="default" className="mb-3">Connected Lifecycle</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            One Account. Infinite Career Possibilities.
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            You don’t switch apps as you grow. Learn skills as a student, take freelance contracts,
            become a verified mentor, and hire talent as a company — all with one unified profile.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {(['student', 'professional', 'mentor', 'company'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveRoleTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
                activeRoleTab === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {tab === 'student' && '👨‍🎓 Learner Journey'}
              {tab === 'professional' && '💼 Professional Journey'}
              {tab === 'mentor' && '👨‍🏫 Mentor Journey'}
              {tab === 'company' && '🏢 Company Journey'}
            </button>
          ))}
        </div>

        {/* Role Content Card */}
        {(() => {
          const activeJourney = roleJourneys[activeRoleTab];
          return (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-5xl mx-auto shadow-sm">
              <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
                <div className="lg:w-1/3">
                  <Badge variant="success" className="mb-3">{activeJourney.badge}</Badge>
                  <h3 className="text-2xl font-bold text-slate-900">{activeJourney.title}</h3>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                    {activeJourney.description}
                  </p>
                  <div className="mt-6">
                    <Link href={activeJourney.dashboard}>
                      <Button variant="default" className="gap-2">
                        Open Hub <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Stepper Progression */}
                <div className="lg:w-2/3 space-y-4 w-full">
                  {activeJourney.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-4 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">{step.title}</h4>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* 4. CORE PLATFORM PILLARS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="default" className="mb-3">Unified Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Engineered for Modern Software Professionals
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all shadow-xs">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit mb-4">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Explainable AI Match Engine</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              No black-box scores. Understand exactly why a job or candidate matches across Skills (50%),
              Experience (20%), Location (10%), Goal (10%), and AI Semantic Relevance (10%).
            </p>
          </Card>

          <Card className="p-6 bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all shadow-xs">
            <div className="p-3 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 w-fit mb-4">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Local & Global Job Discovery</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Find on-site and hybrid contract projects in your exact city alongside remote worldwide opportunities using our extensible JobProvider architecture.
            </p>
          </Card>

          <Card className="p-6 bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all shadow-xs">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Verified Reputation & Reviews</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Build lasting professional trust. Reviews and 5-star ratings are strictly guarded by verified completed transactions (courses, mentorship bookings, and project contracts).
            </p>
          </Card>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="p-10 sm:p-14 rounded-3xl border border-emerald-200 bg-white shadow-sm relative overflow-hidden">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Ready to accelerate your professional journey?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Join thousands of developers, mentors, professionals, and high-growth companies thriving in one connected ecosystem.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" variant="default" className="px-8 h-12 text-base font-semibold">
                Create Free Account
              </Button>
            </Link>
            <Link href="/feed">
              <Button size="lg" variant="outline" className="px-8 h-12 text-base">
                Browse Live Feed
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
