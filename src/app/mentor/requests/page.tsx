'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Users,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MentorRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mentor/requests');
      const json = await res.json();
      if (json.success && json.data?.requests) {
        setRequests(json.data.requests);
      }
    } catch {
      toast.error('Failed to load mentorship requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/mentor/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Request marked as ${status}!`);
        await fetchRequests();
      } else {
        toast.error(json.error?.message || 'Update failed');
      }
    } catch {
      toast.error('Network error updating request');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            <span>Mentorship Requests</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review 1-on-1 coaching requests from ambitious learners and start direct communication.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500 py-8 text-center">Loading incoming requests...</p>
        ) : requests.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
            <p className="text-sm font-semibold text-slate-800">No mentorship requests pending</p>
            <p className="text-xs text-slate-500">When learners request coaching on your profile, they will appear here.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const isPending = req.status === 'PENDING';
              const isAccepted = req.status === 'ACCEPTED';

              return (
                <Card
                  key={req.id}
                  className="p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-xs transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={req.student?.avatarUrl} fallback={req.student?.name || 'S'} size="md" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{req.student?.name}</h3>
                        <p className="text-xs text-slate-500">{req.student?.headline || req.student?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold ${
                          isAccepted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {req.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-900">
                      Topic: <span className="text-emerald-700 font-semibold">{req.topic}</span>
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">&quot;{req.message}&quot;</p>
                    {req.preferredTime && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>Preferred Schedule: {req.preferredTime}</span>
                      </p>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                        className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(req.id, 'ACCEPTED')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        Accept & Start Session
                      </Button>
                    </div>
                  )}

                  {isAccepted && (
                    <div className="flex justify-end pt-1">
                      <Link href="/messages">
                        <Button size="sm" variant="outline" className="text-xs font-semibold flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" /> Go to Messages
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
