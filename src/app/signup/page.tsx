'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, User, Mail, Lock, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (!hasMinLength || !hasUppercase || !hasNumber) {
      setError('Please meet all password strength requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    const res = await register(name, email, password, confirmPassword, 'LEARNER');
    setIsLoading(false);

    if (res.success) {
      toast.success('Account created successfully!');
      router.push('/auth/role-select');
    } else {
      setError(res.error || 'Registration failed');
      toast.error(res.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#F8FAF9] relative overflow-hidden">
      <Card className="w-full max-w-lg bg-white border border-slate-200 shadow-md relative z-10">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-sm mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Create Your Account</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Join Groearn for learning, contract projects, and mentorship
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
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Alex Morgan"
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
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <Input
                  type="password"
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
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4" />}
                  required
                />
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <p className="text-[11px] font-semibold text-slate-500 mb-1">Password Requirements:</p>
              <div className="flex items-center gap-2">
                {hasMinLength ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-slate-400" />}
                <span className={hasMinLength ? 'text-slate-800' : 'text-slate-500'}>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-2">
                {hasUppercase ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-slate-400" />}
                <span className={hasUppercase ? 'text-slate-800' : 'text-slate-500'}>At least one uppercase letter (A-Z)</span>
              </div>
              <div className="flex items-center gap-2">
                {hasNumber ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-slate-400" />}
                <span className={hasNumber ? 'text-slate-800' : 'text-slate-500'}>At least one number (0-9)</span>
              </div>
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                  {isMatch ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-rose-600" />}
                  <span className={isMatch ? 'text-emerald-700 font-medium' : 'text-rose-600'}>{isMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                </div>
              )}
            </div>

            <Button type="submit" variant="default" className="w-full h-11 text-sm font-semibold" isLoading={isLoading}>
              Continue to Role Selection <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 pt-2">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
