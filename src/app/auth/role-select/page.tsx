'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Briefcase,
  Users,
  Building2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { ROLES } from '@/lib/constants';
import { toast } from 'sonner';

export default function RoleSelectPage() {
  const { user, selectRole } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || ROLES.LEARNER);
  const [isLoading, setIsLoading] = useState(false);

  const roleChoices = [
    {
      role: ROLES.LEARNER,
      title: 'Learner / Student',
      tagline: 'Learn & Grow',
      description: 'Learn in-demand skills, follow AI roadmaps, complete verified courses, and connect with mentors.',
      icon: GraduationCap,
      color: 'bg-emerald-600',
    },
    {
      role: ROLES.PROFESSIONAL,
      title: 'Verified Professional',
      tagline: 'Work & Earn',
      description: 'Showcase verified skills, discover contract projects, and generate 1-click AI proposals.',
      icon: Briefcase,
      color: 'bg-teal-600',
    },
    {
      role: ROLES.MENTOR,
      title: 'Expert Mentor',
      tagline: 'Coach & Teach',
      description: 'Share architectural expertise, host 1-on-1 coaching sessions, publish courses, and earn revenue.',
      icon: Users,
      color: 'bg-emerald-700',
    },
    {
      role: ROLES.EMPLOYER,
      title: 'Company',
      tagline: 'Hire & Scale',
      description: 'Post jobs, discover verified candidates with AI matching, and hire top-tier talent effortlessly.',
      icon: Building2,
      color: 'bg-slate-800',
    },
  ];

  const handleConfirm = async () => {
    setIsLoading(true);
    const res = await selectRole(selectedRole);
    setIsLoading(false);

    if (res.success) {
      toast.success(`Active role set to ${selectedRole}`);
      if (selectedRole === ROLES.LEARNER || (selectedRole as string) === 'STUDENT' || selectedRole === ROLES.PROFESSIONAL || (selectedRole as string) === 'FREELANCER') {
        router.push('/onboarding');
      } else if (selectedRole === ROLES.MENTOR) {
        router.push('/mentor/dashboard');
      } else if (selectedRole === ROLES.EMPLOYER || (selectedRole as string) === 'COMPANY') {
        router.push('/company/dashboard');
      } else {
        router.push('/feed');
      }
    } else {
      toast.error(res.error || 'Failed to select role');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8FAF9] relative overflow-hidden">
      <div className="w-full max-w-4xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Personalize Your Experience</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How do you want to use Groearn?
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Select your primary focus to customize your dashboard. You can expand your capabilities
            or switch identities at any time.
          </p>
        </div>

        {/* 4 Primary Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {roleChoices.map((choice) => {
            const Icon = choice.icon;
            const isSelected = selectedRole === choice.role;

            return (
              <div
                key={choice.role}
                onClick={() => setSelectedRole(choice.role)}
                className={`cursor-pointer rounded-2xl p-6 border transition-all relative ${
                  isSelected
                    ? 'bg-emerald-50/50 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div
                    className={`h-12 w-12 rounded-xl ${choice.color} flex items-center justify-center text-white shrink-0 shadow-xs`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{choice.title}</h3>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-slate-600">
                        {choice.tagline}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {choice.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            variant="default"
            onClick={handleConfirm}
            isLoading={isLoading}
            className="px-10 h-12 text-base font-semibold shadow-sm"
          >
            Enter Dashboard as {selectedRole} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
