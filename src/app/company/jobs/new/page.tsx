'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  ArrowLeft,
  Sparkles,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CompanyNewJobPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationType, setLocationType] = useState<'REMOTE' | 'ONSITE' | 'HYBRID'>('REMOTE');
  const [jobType, setJobType] = useState('CONTRACT');
  const [experienceLevel, setExperienceLevel] = useState('MID');
  const [minSalary, setMinSalary] = useState<number>(3000);
  const [maxSalary, setMaxSalary] = useState<number>(6000);
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('Tamil Nadu');
  const [city, setCity] = useState('Chennai');
  const [skills, setSkills] = useState('React, TypeScript, Next.js, PostgreSQL');
  const [isLocal, setIsLocal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Please enter job title and description');
      return;
    }

    const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
    if (skillsArray.length === 0) {
      toast.error('Please specify at least one required skill');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          locationType,
          jobType,
          experienceLevel,
          minSalary: Number(minSalary),
          maxSalary: Number(maxSalary),
          currency: 'USD',
          country,
          state: locationType === 'REMOTE' ? undefined : state,
          city: locationType === 'REMOTE' ? undefined : city,
          isLocal,
          skills: skillsArray,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.job) {
        toast.success(`🎉 Job "${title}" published successfully!`);
        router.push('/company/dashboard');
      } else {
        toast.error(json.error?.message || 'Failed to create job');
      }
    } catch {
      toast.error('Network error creating job posting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            href="/company/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Company Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-emerald-600" />
            <span>Post a New Technical Job Opportunity</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Specify required engineering competencies, compensation, and work mode.
          </p>
        </div>

        <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Senior Java & Spring Boot Microservices Architect"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Mode</label>
                <select
                  value={locationType}
                  onChange={(e) => {
                    const mode = e.target.value as 'REMOTE' | 'ONSITE' | 'HYBRID';
                    setLocationType(mode);
                    if (mode !== 'REMOTE') setIsLocal(true);
                  }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="REMOTE">Remote Worldwide</option>
                  <option value="ONSITE">Onsite (Local)</option>
                  <option value="HYBRID">Hybrid (Local)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="CONTRACT">Contract Project</option>
                  <option value="FULL_TIME">Full-Time Role</option>
                  <option value="PART_TIME">Part-Time</option>
                  <option value="FREELANCE">Freelance Gig</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Seniority Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ENTRY">Entry Level (0-2 Yrs)</option>
                  <option value="MID">Mid-Level (3-5 Yrs)</option>
                  <option value="SENIOR">Senior (6-9 Yrs)</option>
                  <option value="LEAD">Lead / Architect (10+ Yrs)</option>
                </select>
              </div>
            </div>

            {locationType !== 'REMOTE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <Input
                    type="text"
                    placeholder="e.g. Chennai, Bangalore, Hyderabad"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <Input
                    type="text"
                    placeholder="e.g. Tamil Nadu, Karnataka"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Budget Min ($ USD)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={minSalary}
                  onChange={(e) => setMinSalary(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Budget Max ($ USD)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Required Technical Skills (Comma-separated) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Java, Spring Boot, PostgreSQL, Docker, Kubernetes"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Detailed Job Description & Requirements <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe role responsibilities, deliverables, architectural stack, and requirements..."
                className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                required
              />
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md"
            >
              <Send className="h-4 w-4 mr-2" /> Publish Technical Posting
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
