'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Star,
  Users,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  BookOpen,
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  Clock,
  MapPin,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MentorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuth();

  const [mentor, setMentor] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mentorship request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMentorDetail();
    }
  }, [id]);

  const fetchMentorDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/mentors/${id}`);
      const json = await res.json();
      if (json.success && json.data?.mentor) {
        setMentor(json.data.mentor);
      } else {
        toast.error('Mentor not found');
      }
    } catch {
      toast.error('Failed to load mentor details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestMentorship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to request mentorship');
      router.push(`/login?redirect=/mentors/${id}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/mentors/${id}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          message: message.trim(),
          preferredTime: preferredTime.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`🎉 Mentorship request submitted to ${mentor.user.name}!`);
        setShowRequestModal(false);
        setTopic('');
        setMessage('');
        setPreferredTime('');
      } else {
        toast.error(json.error?.message || 'Failed to submit request');
      }
    } catch {
      toast.error('Error submitting mentorship request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
        <DashboardSidebar />
        <main className="flex-1 p-8 max-w-5xl mx-auto flex items-center justify-center">
          <p className="text-slate-500 font-medium">Loading mentor profile...</p>
        </main>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
        <DashboardSidebar />
        <main className="flex-1 p-8 max-w-5xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Mentor Not Found</h2>
          <p className="text-slate-500 text-sm">The mentor profile you are looking for is unavailable.</p>
          <Link href="/mentors">
            <Button variant="default">Back to Mentors</Button>
          </Link>
        </main>
      </div>
    );
  }

  const expertiseList = mentor.expertise ? mentor.expertise.split(',').map((s: string) => s.trim()) : [];
  const u = mentor.user;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/mentors" className="hover:text-emerald-600 flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Mentors
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{u.name}</span>
        </div>

        {/* Mentor Header Hero */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
            <div className="flex flex-col sm:flex-row items-start gap-5 flex-1">
              <Avatar src={u.avatarUrl} fallback={u.name} size="lg" className="rounded-2xl ring-4 ring-emerald-50 shrink-0" />

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-slate-900">{u.name}</h1>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold">
                    Verified Mentor
                  </Badge>
                </div>

                <p className="text-sm font-medium text-slate-600">
                  {u.headline || mentor.title || `${mentor.yearsExperience}+ Years Senior Engineering Experience`}
                </p>

                {u.location && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {u.location}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 pt-1">
                  <div className="flex items-center gap-1 text-amber-600">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span>{mentor.rating} Rating</span>
                  </div>
                  <span>•</span>
                  <span>{mentor.studentsCount} Students Coached</span>
                  <span>•</span>
                  <span>{mentor.sessionCount} Sessions Done</span>
                </div>
              </div>
            </div>

            {/* Action Box */}
            <Card className="w-full lg:w-72 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shrink-0">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-500">Mentorship Rate</span>
                <span className="text-2xl font-extrabold text-slate-900">${mentor.hourlyRate}/hr</span>
              </div>

              {mentor.availability && (
                <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
                  🗓️ <strong>Availability:</strong> {mentor.availability}
                </p>
              )}

              <Button
                onClick={() => setShowRequestModal(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm h-11 rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>Request Mentorship</span>
              </Button>
            </Card>
          </div>
        </section>

        {/* Bio & Expertise Section */}
        <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">About & Architectural Background</h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{mentor.bio}</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Core Expertise & Technologies</h2>
            <div className="flex flex-wrap gap-2">
              {expertiseList.map((exp: string) => (
                <span
                  key={exp}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
                >
                  {exp}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Experience History */}
        {u.experiences && u.experiences.length > 0 && (
          <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-600" />
              <span>Industry Experience</span>
            </h2>
            <div className="space-y-4">
              {u.experiences.map((exp: any) => (
                <div key={exp.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">{exp.title}</h3>
                  <p className="text-xs font-medium text-emerald-700">{exp.company} • {exp.location || 'Remote'}</p>
                  {exp.description && (
                    <p className="text-xs text-slate-600 pt-1 leading-relaxed">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {u.receivedReviews && u.receivedReviews.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Student Reviews & Endorsements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {u.receivedReviews.map((rev: any) => (
                <Card key={rev.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar src={rev.author?.avatarUrl} fallback={rev.author?.name || 'S'} size="sm" />
                      <span className="text-xs font-bold text-slate-900">{rev.author?.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      {'★'.repeat(rev.rating)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Avatar src={u.avatarUrl} fallback={u.name} size="sm" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Request Mentorship Session</h3>
                    <p className="text-xs text-slate-500">with {u.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRequestMentorship} className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Session Topic / Focus Area</label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Microservices architecture audit & Spring Security guidance"
                    required
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Message & Specific Questions</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share what project you are working on, challenges you have encountered, or specific code reviews you need..."
                    rows={4}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Time / Schedule</label>
                  <Input
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    placeholder="e.g. Tuesday/Thursday 7 PM IST or Weekends"
                    className="text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRequestModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    {isSubmitting ? 'Submitting...' : 'Send Request'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
