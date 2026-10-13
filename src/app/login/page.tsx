'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Sparkles,
  Mail,
  Lock,
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  Briefcase,
  Building2,
  ShieldCheck,
  Copy,
  Check,
  MousePointerClick,
} from 'lucide-react';
import { DEMO_USERS, ROLE_INFO, isDemoMode } from '@/lib/constants';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemoEmail, setActiveDemoEmail] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [error, setError] = useState('');

  const getTargetDashboard = (role: string) => {
    const normalized = role?.toUpperCase();
    if (normalized === 'STUDENT' || normalized === 'LEARNER') return '/learner/dashboard';
    if (normalized === 'MENTOR') return '/mentor/dashboard';
    if (normalized === 'FREELANCER' || normalized === 'PROFESSIONAL') return '/freelancer/dashboard';
    if (normalized === 'COMPANY' || normalized === 'EMPLOYER') return '/company/dashboard';
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

  const handleAutoFill = (demoEmail: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmail(demoEmail);
    setPassword('Demo1234!');
    toast.info(`Filled credentials for ${demoEmail}`);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText('Demo1234!');
    setCopiedPassword(true);
    toast.success('Copied demo password: Demo1234!');
    setTimeout(() => setCopiedPassword(false), 2000);
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
    ADMIN: ShieldCheck,
  };

  const roleLabels: Record<string, string> = {
    LEARNER: 'Learner',
    STUDENT: 'Learner',
    MENTOR: 'Expert Mentor',
    FREELANCER: 'Freelancer',
    PROFESSIONAL: 'Freelancer',
    COMPANY: 'Company',
    EMPLOYER: 'Company',
    ADMIN: 'Admin',
  };

  const roleBadgeColors: Record<string, string> = {
    LEARNER: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    STUDENT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    MENTOR: 'bg-teal-100 text-teal-800 border-teal-200',
    FREELANCER: 'bg-sky-100 text-sky-800 border-sky-200',
    PROFESSIONAL: 'bg-sky-100 text-sky-800 border-sky-200',
    COMPANY: 'bg-purple-100 text-purple-800 border-purple-200',
    EMPLOYER: 'bg-purple-100 text-purple-800 border-purple-200',
    ADMIN: 'bg-rose-100 text-rose-800 border-rose-200',
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
              Sign in to your Growearn account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {/* Instant 1-Click Guest Logins & Credentials Display (Visible only in development when demo mode is explicitly enabled) */}
            {isDemoMode() && (
              <>
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/20 border border-emerald-200/90 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
                      <Zap className="h-4 w-4 text-emerald-600 fill-emerald-600" />
                      <span>Instant 1-Click Guest Logins:</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer shadow-2xs"
                      title="Click to copy demo password"
                    >
                      {copiedPassword ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-emerald-600" />}
                      <span>Password: Demo1234!</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {DEMO_USERS.map((demo) => {
                      const Icon = roleIcons[demo.role] || Sparkles;
                      const isThisLoading = activeDemoEmail === demo.email;
                      const badgeColor = roleBadgeColors[demo.role] || 'bg-slate-100 text-slate-700 border-slate-200';

                      return (
                        <div
                          key={demo.email}
                          onClick={() => handleInstantDemoLogin(demo.email, demo.role)}
                          className={`p-2.5 rounded-xl border text-left transition-all relative cursor-pointer group select-none ${
                            isThisLoading
                              ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400/30'
                              : 'border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 hover:shadow-xs'
                          }`}
                          title={`Click to login as ${demo.name} (${demo.role})`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${badgeColor}`}>
                              <Icon className="h-3 w-3" />
                              <span>{roleLabels[demo.role] || demo.role}</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleAutoFill(demo.email, e)}
                              className="text-[10px] text-slate-500 hover:text-emerald-700 font-medium px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
                              title="Auto-fill form inputs below"
                            >
                              Fill
                            </button>
                          </div>
                          <p className="text-[12px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                            {demo.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{demo.email}</p>
                          <div className="mt-1 flex items-center justify-end text-[10px] font-semibold text-emerald-600 opacity-90 group-hover:opacity-100 transition-opacity">
                            <span className="flex items-center gap-0.5">
                              {isThisLoading ? 'Signing in...' : '1-Click Login'}
                              <MousePointerClick className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Or Sign In with Email & Password
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>
              </>
            )}

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
