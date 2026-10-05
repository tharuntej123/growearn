'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FolderCheck,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  Briefcase,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

export default function FreelancerApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/profile');
      const json = await res.json();
      if (json.success && json.data?.user) {
        setApplications(json.data.user.applications || []);
      }
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SHORTLISTED':
        return <Badge className="bg-emerald-600 text-white text-xs font-semibold">Shortlisted</Badge>;
      case 'INTERVIEW':
        return <Badge className="bg-teal-600 text-white text-xs font-semibold">Interview Scheduled</Badge>;
      case 'ACCEPTED':
        return <Badge className="bg-emerald-700 text-white text-xs font-semibold">Offer Accepted 🎉</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold">Not Selected</Badge>;
      case 'REVIEWING':
        return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-semibold">Under Review</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-semibold">Applied</Badge>;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <FolderCheck className="h-6 w-6 text-emerald-600" />
              <span>My Job & Contract Applications</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track real-time hiring progress, interviews, and employer status updates.
            </p>
          </div>
          <Link href="/jobs">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
              Explore More Jobs
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500 py-8 text-center">Loading applications...</p>
        ) : applications.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
            <p className="text-sm font-semibold text-slate-800">No applications submitted yet</p>
            <p className="text-xs text-slate-500">Discover matching contract gigs and full-time opportunities.</p>
            <Link href="/jobs">
              <Button size="sm" variant="outline" className="text-xs">Browse Jobs</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card
                key={app.id}
                className="p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{app.job?.title || 'Contract Position'}</h3>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 font-medium">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>{app.job?.company?.name || 'Hiring Organization'}</span>
                      {app.job?.locationType && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500">{app.job.locationType}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(app.status)}
                  </div>
                </div>

                {app.coverLetter && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                    &ldquo;{app.coverLetter}&rdquo;
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Applied on {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                  </span>
                  {app.job?.id && (
                    <Link href={`/jobs/${app.job.id}`} className="text-emerald-600 font-semibold hover:underline">
                      View Job Details →
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
