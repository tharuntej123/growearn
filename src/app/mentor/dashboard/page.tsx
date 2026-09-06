'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Users,
  Sparkles,
  Calendar,
  DollarSign,
  Star,
  CheckCircle2,
  XCircle,
  Video,
  PlusCircle,
  Clock,
  BookOpen,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function MentorDashboardPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([
    {
      id: 'req-1',
      student: { name: 'Alex Chen', email: 'student@example.com', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
      topic: 'Spring Security 6 Architecture & JWT Review',
      message: 'Need help validating microservices stateless filter chain and role authorizations.',
      status: 'ACCEPTED',
      time: 'Tomorrow, 7:30 PM IST',
    },
    {
      id: 'req-2',
      student: { name: 'Rahul Sharma', email: 'rahul.s@example.com', avatarUrl: '' },
      topic: 'High Throughput Kafka Event Sourcing Design',
      message: 'Architectural guidance on partition rebalancing and consumer offset lag.',
      status: 'PENDING',
      time: 'Saturday, 10:00 AM IST',
    },
  ]);

  const handleAccept = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'ACCEPTED' } : r))
    );
    toast.success('Mentorship session confirmed! Video meeting link created.');
  };

  const handleReject = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED' } : r))
    );
    toast.info('Request declined.');
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Mentor Banner */}
        <div className="p-6 sm:p-8 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <Badge variant="success" className="mb-2">Dashboard</Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Dashboard — Welcome, {user?.name || 'Mentor'}! 👨‍🏫
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Rate: <span className="text-emerald-700 font-semibold">${user?.profile?.hourlyRate || 85}/hr</span> • Expertise: <span className="text-slate-800 font-semibold">Java, Spring Boot, System Design</span>. Manage student requests and conduct 1-on-1 architecture sessions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/courses">
                <Button variant="default" size="sm" className="gap-1.5 shadow-sm">
                  <PlusCircle className="h-4 w-4" /> Create New Course
                </Button>
              </Link>
              <Link href="/mentors">
                <Button variant="outline" size="sm" className="bg-white">
                  View Public Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Mentor Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 bg-white border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Active Students</span>
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">142</p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">+14 this month</p>
          </Card>

          <Card className="p-5 bg-white border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Mentoring Revenue</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2">$18,400</p>
            <p className="text-[11px] text-slate-500 mt-1">From 260+ sessions</p>
          </Card>

          <Card className="p-5 bg-white border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Mentor Rating</span>
              <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">4.95 / 5.0</p>
            <p className="text-[11px] text-slate-500 mt-1">Across 84 student reviews</p>
          </Card>

          <Card className="p-5 bg-white border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Published Courses</span>
              <BookOpen className="h-4 w-4 text-teal-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">3 Courses</p>
            <p className="text-[11px] text-slate-500 mt-1">420 total enrollments</p>
          </Card>
        </div>

        {/* Student Mentorship Requests & Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Student Coaching Requests & Sessions</h2>
            <Badge variant="outline" className="bg-white">2 Active Requests</Badge>
          </div>

          <div className="space-y-4">
            {requests.map((req) => (
              <Card key={req.id} className="p-5 bg-white border-slate-200/90 shadow-sm rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar src={req.student.avatarUrl} fallback={req.student.name} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900">{req.student.name}</h4>
                        <Badge
                          variant={
                            req.status === 'ACCEPTED'
                              ? 'success'
                              : req.status === 'REJECTED'
                              ? 'destructive'
                              : 'warning'
                          }
                          className="text-[10px]"
                        >
                          {req.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-emerald-800 mt-0.5">Topic: {req.topic}</p>
                      <p className="text-xs text-slate-600 mt-1">{req.message}</p>
                      <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" /> Scheduled: {req.time}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'PENDING' ? (
                      <>
                        <Button size="sm" variant="success" onClick={() => handleAccept(req.id)} className="gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Accept Session
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(req.id)} className="gap-1 text-rose-600 hover:text-rose-700">
                          <XCircle className="h-3.5 w-3.5" /> Decline
                        </Button>
                      </>
                    ) : req.status === 'ACCEPTED' ? (
                      <Link href="https://meet.jit.si/ufp-mentorship-session" target="_blank">
                        <Button size="sm" variant="default" className="gap-1.5 shadow-sm">
                          <Video className="h-4 w-4" /> Launch Video Room
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">Declined</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
