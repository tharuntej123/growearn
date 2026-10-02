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
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  FileText,
  Star,
  Check,
  ShieldCheck,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { user } = useAuth();

  const [course, setCourse] = useState<any | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openModuleIndex, setOpenModuleIndex] = useState<number | null>(0);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchCourseDetail();
    }
  }, [slug]);

  const fetchCourseDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/courses/${slug}`);
      const json = await res.json();
      if (json.success && json.data?.course) {
        setCourse(json.data.course);
        setIsEnrolled(json.data.isEnrolled);
        setEnrollment(json.data.enrollment);
      } else {
        toast.error('Course not found');
      }
    } catch {
      toast.error('Failed to load course details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please log in to enroll in this course');
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }

    setIsEnrolling(true);
    try {
      const res = await fetch(`/api/courses/${slug}/enroll`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        setIsEnrolled(true);
        setEnrollment(json.data.enrollment);
        toast.success(`🎉 You are now enrolled in "${course.title}"!`);
      } else {
        toast.error(json.error?.message || 'Enrollment failed');
      }
    } catch {
      toast.error('Error during enrollment');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
        <DashboardSidebar />
        <main className="flex-1 p-8 max-w-5xl mx-auto flex items-center justify-center">
          <p className="text-slate-500 font-medium">Loading course curriculum...</p>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
        <DashboardSidebar />
        <main className="flex-1 p-8 max-w-5xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Course Not Found</h2>
          <p className="text-slate-500 text-sm">The course you are looking for does not exist or has been unpublished.</p>
          <Link href="/courses">
            <Button variant="default">Back to Courses</Button>
          </Link>
        </main>
      </div>
    );
  }

  const skillsList = course.skillsCovered ? course.skillsCovered.split(',').map((s: string) => s.trim()) : [];
  const totalLessons = (course.modules || []).reduce(
    (acc: number, m: any) => acc + (m.lessons?.length || 0),
    0
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/courses" className="hover:text-emerald-600 flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Courses
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate">{course.title}</span>
        </div>

        {/* Course Header Hero */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold text-xs">
                  {course.level}
                </Badge>
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 font-medium text-xs">
                  {course.category}
                </Badge>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {course.durationHours} hours total
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> {totalLessons} lessons
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {course.title}
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed">
                {course.description}
              </p>

              {/* Skills Tags */}
              {skillsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {skillsList.map((sk: string) => (
                    <span
                      key={sk}
                      className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              )}

              {/* Instructor Info */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <Avatar src={course.instructor?.avatarUrl} fallback={course.instructor?.name || 'I'} size="md" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{course.instructor?.name}</p>
                  <p className="text-xs text-slate-500">{course.instructor?.headline || 'Verified Course Instructor'}</p>
                </div>
                <div className="ml-auto flex items-center gap-1 text-xs font-bold text-amber-600">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{course.rating}</span>
                  <span className="text-slate-400 font-normal">({course.reviewsCount} reviews)</span>
                </div>
              </div>
            </div>

            {/* Action Box */}
            <Card className="w-full lg:w-72 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shrink-0">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-500">Price</span>
                <span className="text-2xl font-extrabold text-slate-900">
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </span>
              </div>

              {isEnrolled ? (
                <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-xl text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Check className="h-4 w-4 text-emerald-700" />
                    <span>Enrolled in Course</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Progress: {enrollment?.progressPercent || 0}% completed
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm h-11 rounded-xl shadow-sm"
                >
                  {isEnrolling ? 'Enrolling...' : 'Enroll in Course'}
                </Button>
              )}

              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Full lifetime access
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-600" /> Certificate of completion
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Verified curriculum
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Modules & Lessons Syllabus Accordion */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <span>Curriculum Syllabus</span>
            </h2>
            <span className="text-xs text-slate-500">
              {(course.modules || []).length} modules • {totalLessons} lessons
            </span>
          </div>

          <div className="space-y-3">
            {(course.modules || []).map((module: any, mIdx: number) => {
              const isOpen = openModuleIndex === mIdx;

              return (
                <div
                  key={module.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenModuleIndex(isOpen ? null : mIdx)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                        Module {mIdx + 1}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{module.title}</h3>
                      {module.description && (
                        <p className="text-xs text-slate-500">{module.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-xs font-medium text-slate-500">
                        {(module.lessons || []).length} lessons
                      </span>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 divide-y divide-slate-100 bg-slate-50/40">
                      {(module.lessons || []).map((lesson: any, lIdx: number) => (
                        <div
                          key={lesson.id}
                          className="p-3.5 pl-6 flex items-center justify-between hover:bg-white transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <PlayCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-semibold text-slate-800">
                              {lIdx + 1}. {lesson.title}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {lesson.durationMinutes || 15} mins
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Reviews Section */}
        {course.reviews && course.reviews.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Student Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.reviews.map((rev: any) => (
                <Card key={rev.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar src={rev.author?.avatarUrl} fallback={rev.author?.name || 'A'} size="sm" />
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
      </main>
    </div>
  );
}
