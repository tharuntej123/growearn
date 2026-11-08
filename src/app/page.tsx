'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/layout/footer';
import {
  Sparkles,
  ArrowRight,
  Users,
  BrainCircuit,
  ShieldCheck,
  Search,
} from 'lucide-react';

export default function LandingPage() {
  const [activeRoleTab, setActiveRoleTab] = useState<'learner' | 'freelancer' | 'mentor' | 'company' | 'admin'>('learner');

  const roleJourneys = {
    learner: {
      title: 'Learner Journey',
      badge: 'Learn & Accelerate',
      description: 'Start with ambitious career goals, follow multi-agent AI career roadmaps, complete verified course modules, and book 1-on-1 sessions with industry mentors.',
      steps: [
        { title: 'AI Career Roadmaps', desc: 'CrewAI researcher, planner, and reviewer agents generate personalized curricula with Tavily live market data.' },
        { title: 'Structured Courses', desc: 'Enroll in verified learning tracks and track practical milestone progress.' },
        { title: '1-on-1 Mentorship', desc: 'Book direct architecture reviews and career guidance sessions with verified mentors.' },
        { title: 'Portfolio Projects', desc: 'Build verifiable production projects to showcase proven technical skills.' },
      ],
      dashboard: '/learner/dashboard',
    },
    freelancer: {
      title: 'Freelancer Journey',
      badge: 'Work & Deliver',
      description: 'Find verified contract milestones and client projects. Utilize multi-signal semantic search to match opportunities aligned with your technical capabilities.',
      steps: [
        { title: 'Skill Profile', desc: 'Maintain verified skills and project achievements in your portfolio.' },
        { title: 'Smart Project Matching', desc: 'Hybrid vector search and full-text ranking match high-fit client contracts.' },
        { title: 'Proposal Management', desc: 'Submit structured milestone deliverables and track proposal reviews.' },
        { title: 'Contract Execution', desc: 'Deliver production-ready solutions and build verifiable marketplace reputation.' },
      ],
      dashboard: '/freelancer/dashboard',
    },
    mentor: {
      title: 'Mentor Journey',
      badge: 'Teach & Monetize',
      description: 'Share proven engineering expertise. Host 1-on-1 coaching sessions, author structured courses, and guide ambitious developers.',
      steps: [
        { title: 'Mentor Profile', desc: 'Set your hourly rate, availability slots, and core technical domain.' },
        { title: 'Manage Bookings', desc: 'Accept mentorship requests and conduct targeted architecture reviews.' },
        { title: 'Author Courses', desc: 'Create curriculum modules and distribute learning materials to enrolled students.' },
        { title: 'Marketplace Impact', desc: 'Earn verified reviews and support the next generation of engineers.' },
      ],
      dashboard: '/mentor/dashboard',
    },
    company: {
      title: 'Company Journey',
      badge: 'Hire & Scale',
      description: 'Post full-time and contract engineering roles. Use semantic talent discovery to shortlist pre-vetted professionals with explainable scoring.',
      steps: [
        { title: 'Post Opportunities', desc: 'Define skill requirements, experience levels, and compensation parameters.' },
        { title: 'Talent Discovery', desc: 'Search opt-in candidate profiles using hybrid vector similarity and verified skill overlap.' },
        { title: 'Candidate Pipeline', desc: 'Manage applicants from initial review through technical interview to contract offer.' },
        { title: 'Direct Collaboration', desc: 'Coordinate project deliverables with contract freelancers and full-time hires.' },
      ],
      dashboard: '/company/dashboard',
    },
    admin: {
      title: 'Admin Governance',
      badge: 'Monitor & Reconcile',
      description: 'Full marketplace telemetry, payment audit logs, Cashfree transaction reconciliation, and dispute resolution.',
      steps: [
        { title: 'Payment Reconciliation', desc: 'Inspect internal ledger vs Cashfree gateway statuses with automatic discrepancy detection.' },
        { title: 'Audit Trail', desc: 'Review append-only administrative audit logs across all critical operations.' },
        { title: 'Marketplace Metrics', desc: 'Track real-time platform telemetry computed directly from PostgreSQL tables.' },
        { title: 'Dispute Resolution', desc: 'Process verified refunds and enforce role permission policies.' },
      ],
      dashboard: '/admin',
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAF9] text-slate-900 overflow-hidden">
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 mb-8 shadow-xs">
          <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
          <span className="text-xs font-semibold">
            GrowEarn — Unified AI Career & Talent Ecosystem
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.15]">
          Learn. Work. Mentor. Grow —{' '}
          <span className="text-gradient-emerald">All in One.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
          An enterprise platform connecting learning, mentorship, freelance contracts, and hiring across 5 verified roles with CrewAI multi-agent intelligence and hybrid semantic RAG search.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" variant="default" className="w-full sm:w-auto gap-2 text-base px-8 h-12 shadow-sm font-semibold">
              Create Account (Choose Role) <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-12 font-semibold">
              Sign In to Workspace
            </Button>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <div className="bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <Badge variant="success">CrewAI Microservice</Badge>
            </div>
            <h4 className="font-bold text-slate-900 text-base">Multi-Agent Roadmaps</h4>
            <p className="text-xs text-slate-500 mt-1">Researcher, Planner, and Reviewer agents orchestrate tailored technical milestones.</p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold">Tavily Search Grounded</span>
              <span className="text-slate-500">Live Web Validation</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                <Search className="h-5 w-5" />
              </div>
              <Badge variant="purple">Hybrid RAG</Badge>
            </div>
            <h4 className="font-bold text-slate-900 text-base">BGE-M3 & pgvector</h4>
            <p className="text-xs text-slate-500 mt-1">1024-dim dense embeddings + PostgreSQL HNSW cosine index + GIN full-text search.</p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-800 font-semibold">RRF k=60 Fusion</span>
              <span className="text-emerald-700 font-medium">Explainable Scoring</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Users className="h-5 w-5" />
              </div>
              <Badge variant="success">1-on-1 Sessions</Badge>
            </div>
            <h4 className="font-bold text-slate-900 text-base">Industry Mentorship</h4>
            <p className="text-xs text-slate-500 mt-1">Book personalized coaching, code audits, and architectural reviews with verified mentors.</p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-700">Calendar Integration</span>
              <span className="text-slate-500">Hourly Bookings</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <Badge variant="warning">Cashfree Verified</Badge>
            </div>
            <h4 className="font-bold text-slate-900 text-base">Marketplace Payments</h4>
            <p className="text-xs text-slate-500 mt-1">Server-verified orders, raw HMAC-SHA256 webhook signatures, and transactional fulfillment.</p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">INR Decimal Precision</span>
              <span className="text-emerald-700 font-semibold">Idempotent</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Metric Telemetry */}
      <section className="border-y border-slate-200 bg-white py-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">5</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Canonical User Roles</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600">1024</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">BGE-M3 Embedding Dims</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-teal-600">3-Agent</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">CrewAI Workflow</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-700">100%</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Containerized Stack</p>
          </div>
        </div>
      </section>

      {/* Role Journey Tabs */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="default" className="mb-3">Connected Lifecycle</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            One Account. Continuous Career Progression.
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Progress seamlessly as your technical journey advances: learn skills, deliver contract gigs, mentor aspiring developers, or recruit engineering talent.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {(['learner', 'freelancer', 'mentor', 'company', 'admin'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveRoleTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
                activeRoleTab === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {tab === 'learner' && 'Learner'}
              {tab === 'freelancer' && 'Freelancer'}
              {tab === 'mentor' && 'Mentor'}
              {tab === 'company' && 'Company'}
              {tab === 'admin' && 'Admin'}
            </button>
          ))}
        </div>

        {(() => {
          const activeJourney = roleJourneys[activeRoleTab];
          return (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-5xl mx-auto shadow-sm">
              <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
                <div className="max-w-xl">
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 mb-3 border border-emerald-200">
                    {activeJourney.badge}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{activeJourney.title}</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{activeJourney.description}</p>

                  <div className="mt-8 space-y-4">
                    {activeJourney.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-slate-900">{step.title}</h5>
                          <p className="text-xs text-slate-500 mt-0.5 leading-normal">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <Link href={activeJourney.dashboard}>
                      <Button variant="default" className="gap-2">
                        Explore {activeRoleTab} Workspace <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="w-full lg:w-80 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Key Architecture Attributes</h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-600">Authentication</span>
                      <span className="font-semibold text-slate-900">Google OAuth / Jose</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-600">Access Control</span>
                      <span className="font-semibold text-slate-900">Strict Server RBAC</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-600">Data Isolation</span>
                      <span className="font-semibold text-slate-900">Role-gated Retrieval</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-600">Audit Logging</span>
                      <span className="font-semibold text-slate-900">PostgreSQL Append-Only</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      <Footer />
    </div>
  );
}
