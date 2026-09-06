'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Mail, Lock, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { DEMO_USERS, ROLE_INFO } from '@/lib/constants';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      const target = ROLE_INFO[user.role]?.defaultDashboard || '/feed';
      router.push(target);
    }
  }, [user, router]);

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

    if (res.success) {
      toast.success('Welcome back!');
      router.push('/feed');
    } else {
      setError(res.error || 'Invalid email or password');
      toast.error(res.error || 'Login failed');
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Demo1234!');
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#F8FAF9] relative overflow-hidden">
      <Card className="w-full max-w-md bg-white border border-slate-200 shadow-md relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-sm mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Sign in to access your Groearn workspace
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
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

          {/* 1-Click Demo Accounts Quick-Fill */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mb-2">
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
              <span>Click to Autofill Demo Credentials:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleFillDemo(demo.email)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 text-[11px] text-slate-700 text-left transition-all"
                >
                  <p className="font-bold text-emerald-700">{demo.role}</p>
                  <p className="text-slate-500 text-[10px] truncate">{demo.email}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 pt-2">
            Don’t have an account yet?{' '}
            <Link href="/signup" className="text-emerald-600 font-semibold hover:underline">
              Sign up here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
