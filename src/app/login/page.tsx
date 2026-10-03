'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Mail, Lock, Zap, ArrowRight, Eye, EyeOff, GraduationCap, Users, Briefcase, Building2 } from 'lucide-react';
import { DEMO_USERS, ROLE_INFO } from '@/lib/constants';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemoEmail, setActiveDemoEmail] = useState<string | null>(null);
  const [error, setError] = useState('');

  const getTargetDashboard = (role: string) => {
    const normalized = role?.toUpperCase();
    if (normalized === 'STUDENT' || normalized === 'LEARNER') return '/learner/dashboard';
    if (normalized === 'MENTOR') return '/mentor/dashboard';
    if (normalized === 'FREELANCER' || normalized === 'PROFESSIONAL') return '/professional/dashboard';
    if (normalized === 'COMPANY' || normalized === 'EMPLOYER') return '/employer/dashboard';
    if (normalized === 'ADMIN') return '/admin/dashboard';
    return ROLE_INFO[normalized]?.defaultDashboard || '/feed';
  };

  const handleInstantDemoLogin = async (demoEmail: string, demoRole: string) => {
    setActiveDemoEmail(demoEmail);
    setError('');
    try {
      const res = await login(demoEmail, 'Demo1234!');
      if (res.success && res.user) {
        toast.success(`Signed in as ${res.user.role}: ${res.user.name}`);
        const target = getTargetDashboard(res.user.role || demoRole);
        router.push(target);
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
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success && res.user) {
      toast.success(`Welcome back, ${res.user.name}!`);
      const target = getTargetDashboard(res.user.role);
      router.push(target);
    } else {
      setError(res.error || 'Invalid email or password');
      toast.error(res.error || 'Login failed');
    }
  };

  const roleIcons: Record<string, React.ElementType> = {
    LEARNER: GraduationCap,
    STUDENT: GraduationCap,
    MENTOR: Users,
    PROFESSIONAL: Briefcase,
    FREELANCER: Briefcase,
    EMPLOYER: Building2,
    COMPANY: Building2,
  };

  const roleLabels: Record<string, string> = {
    LEARNER: 'Learner / Student',
    MENTOR: 'Expert Mentor',
    PROFESSIONAL: 'Freelancer / Professional',
    EMPLOYER: 'Company / Employer',
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-[#F8FAF9] relative overflow-hidden">
      <div className="w-full max-w-lg space-y-4 relative z-10">
        <Card className="bg-white border border-slate-200 shadow-md">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-sm mb-2">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Sign in to your Growearn account or use 1-click guest demo login below
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {/* Instant 1-Click Guest Logins */}
            <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                <Zap className="h-4 w-4 text-emerald-600" />
                <span>1-Click Instant Guest Demo Login:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_USERS.map((demo) => {
                  const Icon = roleIcons[demo.role] || Sparkles;
                  const isThisLoading = activeDemoEmail === demo.email;

                  return (
                    <button
                      key={demo.email}
                      type="button"
                      disabled={Boolean(activeDemoEmail) || isLoading}
                      onClick={() => handleInstantDemoLogin(demo.email, demo.role)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative ${
                        isThisLoading
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400/30'
                          : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 rounded-md bg-emerald-100/70 text-emerald-700">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {roleLabels[demo.role] || demo.role}
                        </p>
                      </div>
                      <p className="text-[11px] font-semibold text-emerald-700 truncate">{demo.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{demo.email}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Or Sign In with Credentials
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
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

              <Button type="submit" variant="default" className="w-full h-11 text-sm font-semibold" isLoading={isLoading}>
                Sign In <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>

            <p className="text-center text-xs text-slate-500 pt-1">
              Don’t have an account yet?{' '}
              <Link href="/signup" className="text-emerald-600 font-semibold hover:underline">
                Sign up here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

