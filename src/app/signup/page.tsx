'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  User,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Users,
  Briefcase,
  Building2,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DEMO_USERS, ROLE_INFO, isDemoMode } from '@/lib/constants';
import { toast } from 'sonner';

type SelectedRoleKey = 'STUDENT' | 'MENTOR' | 'FREELANCER' | 'COMPANY';

export default function SignupPage() {
  const { register, login } = useAuth();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<SelectedRoleKey>('STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemoEmail, setActiveDemoEmail] = useState<string | null>(null);
  const [error, setError] = useState('');
  const showDemo = isDemoMode();

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  const roleOptions: {
    key: SelectedRoleKey;
    dbRole: 'LEARNER' | 'MENTOR' | 'FREELANCER' | 'COMPANY' | 'PROFESSIONAL' | 'EMPLOYER';
    title: string;
    tagline: string;
    description: string;
    icon: React.ElementType;
    dashboard: string;
  }[] = [
    {
      key: 'STUDENT',
      dbRole: 'LEARNER',
      title: 'Learner / Student',
      tagline: 'Learn & Master Skills',
      description: 'Follow AI career roadmaps, learn from top courses, and get 1-on-1 mentorship coaching.',
      icon: GraduationCap,
      dashboard: '/learner/dashboard',
    },
    {
      key: 'MENTOR',
      dbRole: 'MENTOR',
      title: 'Expert Mentor',
      tagline: 'Coach & Teach',
      description: 'Host 1-on-1 coaching sessions, publish technical courses, and guide ambitious learners.',
      icon: Users,
      dashboard: '/mentor/dashboard',
    },
    {
      key: 'FREELANCER',
      dbRole: 'FREELANCER',
      title: 'Freelancer',
      tagline: 'Work & Earn',
      description: 'Discover remote & local client jobs, submit 1-click AI proposals, and build verified portfolio.',
      icon: Briefcase,
      dashboard: '/freelancer/dashboard',
    },
    {
      key: 'COMPANY',
      dbRole: 'COMPANY',
      title: 'Company',
      tagline: 'Hire & Scale',
      description: 'Post full-time & contract roles, use AI candidate matching, and hire verified top tech talent.',
      icon: Building2,
      dashboard: '/company/dashboard',
    },
  ];

  const currentOption = roleOptions.find((r) => r.key === selectedRole) || roleOptions[0];

  const handleInstantDemoLogin = async (demoEmail: string, demoRole: string) => {
    setActiveDemoEmail(demoEmail);
    setError('');
    try {
      const res = await login(demoEmail, 'Demo1234!');
      if (res.success && res.user) {
        toast.success(`Signed in as ${res.user.role}: ${res.user.name}`);
        const norm = res.user.role?.toUpperCase();
        if (norm === 'STUDENT' || norm === 'LEARNER') router.push('/learner/dashboard');
        else if (norm === 'MENTOR') router.push('/mentor/dashboard');
        else if (norm === 'FREELANCER' || norm === 'PROFESSIONAL') router.push('/freelancer/dashboard');
        else if (norm === 'COMPANY' || norm === 'EMPLOYER') router.push('/company/dashboard');
        else router.push(ROLE_INFO[norm]?.defaultDashboard || '/feed');
      } else {
        setError(res.error || 'Demo login failed');
        toast.error(res.error || 'Demo login failed');
      }
    } catch {
      setError('Network error during demo login');
      toast.error('Network error during demo login');
    } finally {
      setActiveDemoEmail(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (!hasMinLength || !hasUppercase || !hasNumber) {
      setError('Please satisfy all password strength requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    const res = await register(name, email, password, confirmPassword, currentOption.dbRole);
    setIsLoading(false);

    if (res.success && res.user) {
      toast.success(`Account created successfully as ${currentOption.title}!`);
      router.push(currentOption.dashboard);
    } else {
      setError(res.error || 'Registration failed');
      toast.error(res.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8FAF9] relative overflow-hidden">
      <div className="w-full max-w-2xl space-y-6 relative z-10">
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-sm mb-2">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Your Growearn Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Choose your role first, then set your profile to unlock dedicated features.
          </p>
        </div>

        <Card className="bg-white border border-slate-200 shadow-md">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Step 1: Choose Your Dedicated Role
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Your role determines your workspace, access permissions, and tools.
                </CardDescription>
              </div>
              <Badge variant="default" className="text-xs font-semibold">
                {currentOption.title}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-5">
            {/* 4 Primary Role Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedRole === opt.key;

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelectedRole(opt.key)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl text-white shrink-0 ${
                          isSelected ? 'bg-emerald-600' : 'bg-slate-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{opt.title}</p>
                        <p className="text-[11px] font-semibold text-emerald-700">{opt.tagline}</p>
                        <p className="text-[11px] text-slate-500 leading-snug pt-0.5 line-clamp-2">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {/* Step 2: Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
                <span>Step 2: Enter Account Details for {currentOption.title}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Arjun Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon={<User className="h-4 w-4" />}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    required
                  />
                </div>
              </div>

              {/* Password strength indicators */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <p className="text-[11px] font-semibold text-slate-500 mb-1">Password Requirements:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-center gap-1.5">
                    {hasMinLength ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                    <span className={hasMinLength ? 'text-slate-800' : 'text-slate-500'}>8+ characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasUppercase ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                    <span className={hasUppercase ? 'text-slate-800' : 'text-slate-500'}>1 uppercase (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasNumber ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                    <span className={hasNumber ? 'text-slate-800' : 'text-slate-500'}>1 number (0-9)</span>
                  </div>
                </div>
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200 text-xs">
                    {isMatch ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-rose-600" />}
                    <span className={isMatch ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
                      {isMatch ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="default"
                className="w-full h-11 text-sm font-semibold"
                isLoading={isLoading}
              >
                Create {currentOption.title} Account <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>

            {/* Instant 1-Click Guest Login Alternative (Only when DEMO_MODE=true) */}
            {showDemo && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                  <Zap className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Or Jump In with 1-Click Guest Demo:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DEMO_USERS.map((demo) => {
                    const isThisLoading = activeDemoEmail === demo.email;
                    return (
                      <button
                        key={demo.email}
                        type="button"
                        disabled={Boolean(activeDemoEmail) || isLoading}
                        onClick={() => handleInstantDemoLogin(demo.email, demo.role)}
                        className={`p-2 rounded-xl border text-left transition-all text-xs ${
                          isThisLoading
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 bg-slate-50/60 hover:bg-emerald-50/50 hover:border-emerald-300'
                        }`}
                      >
                        <p className="font-bold text-slate-800 text-[11px] truncate">{demo.role}</p>
                        <p className="text-[10px] text-emerald-700 font-medium truncate">{demo.name.split(' ')[0]}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
                Sign in here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
