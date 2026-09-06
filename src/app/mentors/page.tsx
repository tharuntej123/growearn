'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  Users,
  Search,
  Star,
  Calendar,
  DollarSign,
  Award,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MentorsPage() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Booking Modal
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');
  const [preferredTime, setPreferredTime] = useState('Tomorrow, 7 PM IST');
  const [isBooking, setIsBooking] = useState(false);

  const fetchMentors = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res = await fetch(`/api/mentors?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data?.mentors) {
        setMentors(json.data.mentors);
      }
    } catch {
      toast.error('Failed to load mentors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;

    if (!user) {
      toast.error('Please log in to book a mentorship session');
      return;
    }

    setIsBooking(true);
    try {
      const res = await fetch(`/api/mentors/${selectedMentor.id}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: sessionTopic,
          message: sessionMessage,
          preferredTime,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Mentorship request sent to ${selectedMentor.user.name}!`);
        setSelectedMentor(null);
        setSessionTopic('');
        setSessionMessage('');
      } else {
        toast.error(json.error?.message || 'Booking failed');
      }
    } catch {
      toast.error('Error submitting request');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Connect with Industry Mentors
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Accelerate your engineering trajectory with 1-on-1 architecture reviews, mock interviews, and personalized career guidance.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="p-4 bg-white border-slate-200/90 shadow-sm rounded-2xl max-w-xl">
          <Input
            placeholder="Search by mentor name, skill (e.g. Java, System Design)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchMentors()}
            icon={<Search className="h-4 w-4" />}
            className="bg-white"
          />
        </Card>

        {/* Mentor Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mentors.map((m) => (
              <Card
                key={m.id}
                className="p-6 bg-white border-slate-200/90 hover:border-emerald-500/50 hover:shadow-md transition-all rounded-2xl shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Avatar src={m.user.avatarUrl} fallback={m.user.name} size="lg" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{m.user.name}</h3>
                          <Badge variant="success" className="text-[10px]">Verified Mentor</Badge>
                        </div>
                        <p className="text-xs text-emerald-800 font-medium mt-0.5">{m.user.headline || m.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{m.yearsExperience} yrs industry experience</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-extrabold text-emerald-700">${m.hourlyRate}/hr</p>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs mt-0.5 justify-end">
                        <Star className="h-3.5 w-3.5 fill-amber-400" /> {m.rating}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {m.bio}
                  </p>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-700 mb-1.5">Core Expertise:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.expertise.split(',').map((exp: string) => (
                        <span
                          key={exp}
                          className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-medium"
                        >
                          {exp.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {m.studentsCount || 100}+ students mentored
                  </span>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedMentor(m);
                      setSessionTopic('Architecture & Code Review');
                      setSessionMessage(`Hi ${m.user.name.split(' ')[0]}, I would like to schedule a 1-on-1 coaching session to review my project architecture.`);
                    }}
                    className="gap-1.5 shadow-sm"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Book 1-on-1 Session
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Booking Request Modal */}
        {selectedMentor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-600" /> Book Session with {selectedMentor.user.name}
                </h3>
                <button onClick={() => setSelectedMentor(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleBookSession} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Session Topic</label>
                  <Input
                    placeholder="e.g. Spring Security 6 Microservices Architecture"
                    value={sessionTopic}
                    onChange={(e) => setSessionTopic(e.target.value)}
                    className="bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preferred Time / Slot</label>
                  <Input
                    placeholder="e.g. Tomorrow, 7:30 PM IST"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specific Goals or Questions</label>
                  <textarea
                    rows={4}
                    placeholder="What specific architectural challenges or mock interview goals do you want to cover?"
                    value={sessionMessage}
                    onChange={(e) => setSessionMessage(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600">Hourly Rate:</span>
                  <span className="text-emerald-700 font-bold text-sm">${selectedMentor.hourlyRate} / hour</span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setSelectedMentor(null)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" type="submit" isLoading={isBooking} className="shadow-sm">
                    Send Mentorship Request
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
