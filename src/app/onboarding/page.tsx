'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Search,
  Plus,
  X,
  Target,
  GraduationCap,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

const POPULAR_SKILL_SUGGESTIONS = [
  'Java',
  'Spring Boot',
  'Python',
  'SQL',
  'PostgreSQL',
  'React',
  'Next.js',
  'TypeScript',
  'Node.js',
  'Docker',
  'AWS',
  'Git',
  'Machine Learning',
  'PyTorch',
  'FastAPI',
  'REST APIs',
  'Tailwind CSS',
  'System Design',
];

const TARGET_ROLE_OPTIONS = [
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'AI / ML Engineer',
  'Data Scientist',
  'DevOps Engineer',
  'Mobile Developer (React Native/Flutter)',
  'Cloud Software Architect',
];

const CAREER_GOAL_OPTIONS = [
  'Find a High-Paying Full-Time Job',
  'Start High-Rate Professional Contracting',
  'Upskill & Master Production Engineering',
  'Transition into AI & Machine Learning',
  'Prepare for Tier-1 System Design Interviews',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Form State
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [targetRole, setTargetRole] = useState('Backend Developer');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [careerGoal, setCareerGoal] = useState('Find a High-Paying Full-Time Job');
  const [experienceLevel, setExperienceLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Professional'>('Beginner');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [preferredWorkType, setPreferredWorkType] = useState('REMOTE');
  const [preferredLocation, setPreferredLocation] = useState('Chennai, Tamil Nadu');

  // AI Generation Loading State
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (!selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
    }
    setCustomSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill));
  };

  const handleFinalSubmit = async () => {
    setIsGenerating(true);

    const stageInterval = setInterval(() => {
      setLoadingStage((prev) => (prev < 4 ? prev + 1 : prev));
    }, 450);

    try {
      const finalRole = customRoleInput.trim() || targetRole;
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: selectedSkills,
          careerGoal,
          targetRole: finalRole,
          experienceLevel,
          yearsOfExperience: Number(yearsOfExperience),
          preferredWorkType,
          preferredLocation,
        }),
      });

      const json = await res.json();
      clearInterval(stageInterval);

      if (json.success) {
        setLoadingStage(5);
        toast.success('✨ Your personalized career workspace is ready!');
        await refreshUser();
        setTimeout(() => {
          if (user?.role === 'PROFESSIONAL' || (user?.role as string) === 'FREELANCER') {
            router.push('/professional/dashboard');
          } else {
            router.push('/student/dashboard');
          }
        }, 800);
      } else {
        setIsGenerating(false);
        toast.error(json.error?.message || 'Onboarding failed');
      }
    } catch {
      clearInterval(stageInterval);
      setIsGenerating(false);
      toast.error('Failed to submit onboarding');
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#F8FAF9]">
        <Card className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center animate-pulse">
              <Sparkles className="h-8 w-8" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Personalizing Your Experience</h2>
            <p className="text-xs text-slate-500 mt-1">
              Building your tailored career ecosystem based on your actual competencies
            </p>
          </div>

          <div className="space-y-3 text-left text-xs text-slate-600">
            <div className={`flex items-center gap-2.5 ${loadingStage >= 1 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Understanding your verified skills ({selectedSkills.length} selected)
            </div>
            <div className={`flex items-center gap-2.5 ${loadingStage >= 2 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Identifying skill gaps for {customRoleInput || targetRole}
            </div>
            <div className={`flex items-center gap-2.5 ${loadingStage >= 3 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Matching relevant jobs, courses & mentors
            </div>
            <div className={`flex items-center gap-2.5 ${loadingStage >= 4 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Generating structured multi-phase career roadmap
            </div>
            <div className={`flex items-center gap-2.5 ${loadingStage >= 5 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              <Zap className="h-4 w-4 text-emerald-600 animate-spin" /> Finalizing personalized dashboard...
            </div>
          </div>

          <Progress value={Math.min(100, (loadingStage + 1) * 20)} />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-[#F8FAF9]">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress Header */}
        <div className="text-center space-y-2">
          <Badge variant="default" className="gap-1.5 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" /> Step {step} of {totalSteps}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Let&apos;s Personalize Your Career Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Tell us about your background so our AI can accurately match jobs, courses, and generate your career roadmap.
          </p>
          <div className="w-full max-w-xs mx-auto pt-2">
            <Progress value={(step / totalSteps) * 100} />
          </div>
        </div>

        {/* Multi-Step Card */}
        <Card className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* STEP 1: Current Skills */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-600" /> What skills do you currently have?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Select your current technologies or type your own.
                </p>
              </div>

              {/* Selected Skills Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Your Selected Skills ({selectedSkills.length}):
                </label>
                <div className="min-h-[48px] p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap gap-2">
                  {selectedSkills.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No skills selected yet. Click pills below or type custom skills.</span>
                  ) : (
                    selectedSkills.map((sk) => (
                      <span
                        key={sk}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
                      >
                        {sk}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(sk)}
                          className="hover:text-emerald-950"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Custom Skill Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddSkill(customSkillInput);
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Type any skill (e.g. Java, Python, React, SQL, Docker)..."
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
                <Button type="submit" variant="outline" size="sm" className="gap-1 shrink-0">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </form>

              {/* Popular Skill Suggestions */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Popular suggestions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILL_SUGGESTIONS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => (isSelected ? handleRemoveSkill(skill) : handleAddSkill(skill))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Career Goal & Target Role */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600" /> What role and career direction are you targeting?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Our AI compares your skills against this role to identify exact skill gaps and build your roadmap.
                </p>
              </div>

              {/* Target Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Target Role:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TARGET_ROLE_OPTIONS.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setTargetRole(role);
                        setCustomRoleInput('');
                      }}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        targetRole === role && !customRoleInput
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                <div className="mt-2">
                  <Input
                    placeholder="Or type custom target role (e.g. Java Microservices Architect)..."
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Primary Career Goal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Primary Goal:
                </label>
                <div className="space-y-2">
                  {CAREER_GOAL_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setCareerGoal(g)}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        careerGoal === g
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Experience Level */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-emerald-600" /> What is your experience level?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Helps calibrate the depth of course recommendations and roadmap difficulty.
                </p>
              </div>

              {/* Experience Level Cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'Beginner', title: 'Beginner', desc: '0-1 yrs • Learning foundations' },
                  { id: 'Intermediate', title: 'Intermediate', desc: '1-3 yrs • Built small apps' },
                  { id: 'Advanced', title: 'Advanced', desc: '3-6 yrs • Professional engineer' },
                  { id: 'Professional', title: 'Professional / Lead', desc: '6+ yrs • Tech lead / Architect' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setExperienceLevel(lvl.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      experienceLevel === lvl.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-sm text-slate-900">{lvl.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{lvl.desc}</p>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Years of Industry Experience:
                </label>
                <Input
                  type="number"
                  min={0}
                  max={40}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* STEP 4: Preferences & Final Action */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-600" /> Job & Location Preferences
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Filter global remote vs local opportunities in your region.
                </p>
              </div>

              {/* Work Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Preferred Work Mode:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['REMOTE', 'HYBRID', 'ONSITE'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPreferredWorkType(mode)}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                        preferredWorkType === mode
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your City / Region:</label>
                <Input
                  placeholder="e.g. Chennai, Tamil Nadu"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  icon={<MapPin className="h-4 w-4" />}
                />
              </div>

              {/* Summary Pill Preview */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                <p className="font-bold text-emerald-800">Ready to Generate Your Personalized Ecosystem:</p>
                <div className="space-y-1 text-slate-700">
                  <p>• <strong>Target Role:</strong> {customRoleInput || targetRole}</p>
                  <p>• <strong>Skills ({selectedSkills.length}):</strong> {selectedSkills.join(', ') || 'None selected (Foundational mode)'}</p>
                  <p>• <strong>Experience:</strong> {experienceLevel} ({yearsOfExperience} yrs)</p>
                  <p>• <strong>Location:</strong> {preferredLocation} ({preferredWorkType})</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {step > 1 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(step - 1)}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (step === 1 && selectedSkills.length === 0) {
                    toast.info('You can proceed without skills, or select your current technologies for better matching.');
                  }
                  setStep(step + 1);
                }}
                className="gap-1.5"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleFinalSubmit}
                className="gap-2 px-6"
              >
                <Sparkles className="h-4 w-4" /> Generate My Personalized Experience
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
