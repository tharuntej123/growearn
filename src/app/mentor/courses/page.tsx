'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  PlusCircle,
  Clock,
  Star,
  Users,
  Eye,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MentorCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMentorCourses();
  }, []);

  const fetchMentorCourses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/profile');
      const json = await res.json();
      if (json.success && json.data?.user) {
        setCourses(json.data.user.instructedCourses || []);
      }
    } catch {
      toast.error('Failed to load mentor courses');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-emerald-600" />
              <span>My Published Courses</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your engineering curriculum modules, lesson videos, and student enrollments.
            </p>
          </div>
          <Link href="/mentor/courses/new">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4" /> Publish New Course
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500 py-8 text-center">Loading courses...</p>
        ) : courses.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
            <p className="text-sm font-semibold text-slate-800">No courses published yet</p>
            <p className="text-xs text-slate-500">Share your technical mastery by publishing a modular course.</p>
            <Link href="/mentor/courses/new">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                Create First Course
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c) => (
              <Card key={c.id} className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold">
                      {c.level || 'BEGINNER'}
                    </Badge>
                    <span className="text-xs font-bold text-slate-900">
                      {c.price === 0 ? 'Free' : `$${c.price}`}
                    </span>
                  </div>

                  <Link href={`/courses/${c.slug || c.id}`}>
                    <h3 className="text-base font-bold text-slate-900 hover:text-emerald-600 transition-colors line-clamp-2">
                      {c.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {c.durationHours} hrs
                  </span>
                  <Link href={`/courses/${c.slug || c.id}`}>
                    <Button size="sm" variant="outline" className="text-xs font-semibold">
                      View Public Page
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
