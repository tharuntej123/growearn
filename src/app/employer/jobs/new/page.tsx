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

export default function NewJobPage() {
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
          country: country.trim(),
          state: state.trim(),
          city: city.trim(),
          isLocal,
          skills: skillsArray,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.job) {
        toast.success(`🎉 Job "${title}" published successfully!`);
        router.push('/employer/dashboard');
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
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/employer/dashboard" className="hover:text-emerald-600 flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-600" />
            <span>Post New Job or Project Contract</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Target qualified engineers with real-time 5-factor hybrid matching.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Job / Contract Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer (Next.js & PostgreSQL)"
                required
                className="text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description & Requirements</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe project responsibilities, required architectural experience, deliverables, and team expectations..."
                rows={5}
                required
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location Flexibility</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900"
                >
                  <option value="REMOTE">100% Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-Site</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900"
                >
                  <option value="CONTRACT">Contract / Freelance</option>
                  <option value="FULL_TIME">Full-Time</option>
                  <option value="PART_TIME">Part-Time</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900"
                >
                  <option value="ENTRY">Entry Level (0-2 yrs)</option>
                  <option value="MID">Mid Level (2-5 yrs)</option>
                  <option value="SENIOR">Senior (5+ yrs)</option>
                  <option value="LEAD">Lead / Architect (8+ yrs)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Min Salary ($/yr)</label>
                <Input
                  type="number"
                  min="0"
                  value={minSalary}
                  onChange={(e) => setMinSalary(parseFloat(e.target.value) || 0)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Max Salary ($/yr)</label>
                <Input
                  type="number"
                  min="0"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(parseFloat(e.target.value) || 0)}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Required Skills (Comma-separated)</label>
              <Input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. TypeScript, React, Next.js, PostgreSQL, Docker"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Chennai"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Tamil Nadu"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="India"
                  className="text-xs"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href="/employer/dashboard">
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 h-11 rounded-xl shadow-sm flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Posting...' : 'Publish Job Listing'}</span>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
