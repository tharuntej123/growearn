'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Search,
  Star,
  Play,
  CheckCircle2,
  Lock,
  Award,
  Clock,
  User,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  // Selected Course Viewer Modal
  const [activeCourse, setActiveCourse] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'ALL') params.append('category', category);

      const res = await fetch(`/api/courses?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data?.courses) {
        setCourses(json.data.courses);
      }
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [category]);

  const handleOpenCourse = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      const json = await res.json();
      if (json.success && json.data?.course) {
        setActiveCourse(json.data.course);
        const firstLesson = json.data.course.modules?.[0]?.lessons?.[0];
        setActiveLesson(firstLesson || null);
      }
    } catch {
      toast.error('Failed to load course lessons');
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      toast.error('Please log in to enroll');
      return;
    }

    setIsEnrolling(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success('Successfully enrolled! Payment processed via MockProvider.');
        handleOpenCourse(courseId);
      } else {
        toast.error(json.error?.message || 'Enrollment failed');
      }
    } catch {
      toast.error('Error during enrollment');
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Explore Courses & Certifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Learn in-demand engineering skills, build verified portfolio projects, and earn automated certificates.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <Card className="p-4 bg-white border-slate-200/90 shadow-sm rounded-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-96">
              <Input
                placeholder="Search course title, skill (e.g. Spring Boot, Next.js)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCourses()}
                icon={<Search className="h-4 w-4" />}
                className="bg-white"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {['ALL', 'Backend', 'Full Stack', 'Database & Architecture', 'AI / Machine Learning'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    category === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'ALL' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Course Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="bg-white border-slate-200/90 hover:border-emerald-500/50 hover:shadow-md transition-all rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge variant="outline" className="text-[10px] bg-white/90 backdrop-blur-md shadow-sm border-slate-200">
                        {course.level}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="text-emerald-700 font-semibold">{course.category}</span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-400" /> {course.rating}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {course.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    <p className="text-[11px] text-slate-500 pt-1">
                      Instructor: <span className="text-slate-700 font-medium">{course.instructor?.name}</span>
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-base font-extrabold text-emerald-700">
                      {course.price > 0 ? formatCurrency(course.price) : 'Free'}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-1">({course.durationHours} hrs)</span>
                  </div>

                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleOpenCourse(course.id)}
                    className="gap-1.5 shadow-sm"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" /> Start Learning
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Interactive Course Player & Module Viewer Modal */}
        {activeCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <Badge variant="outline" className="mb-1 bg-emerald-50 text-emerald-800 border-emerald-200">{activeCourse.category}</Badge>
                  <h3 className="text-xl font-bold text-slate-900">{activeCourse.title}</h3>
                </div>
                <button onClick={() => setActiveCourse(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Video Player & Lesson Details */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative shadow-sm">
                    <iframe
                      src={activeLesson?.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ'}
                      title={activeLesson?.title || 'Course Lesson'}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">{activeLesson?.title || 'Select a lesson'}</h4>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {activeLesson?.content || activeCourse.description}
                    </p>
                  </div>
                </div>

                {/* Right: Modules & Lessons Playlist */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 h-fit">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Course Syllabus</h4>
                    <span className="text-xs text-emerald-700 font-bold">{activeCourse.price > 0 ? `$${activeCourse.price}` : 'Free'}</span>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {activeCourse.modules?.map((mod: any) => (
                      <div key={mod.id} className="space-y-1.5">
                        <p className="text-xs font-bold text-slate-800">{mod.title}</p>
                        <div className="space-y-1">
                          {mod.lessons?.map((les: any) => {
                            const isSelected = activeLesson?.id === les.id;
                            return (
                              <button
                                key={les.id}
                                onClick={() => setActiveLesson(les)}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <Play className="h-3 w-3 shrink-0" /> {les.title}
                                </span>
                                <span className="text-[10px] text-slate-500 shrink-0">{les.durationMinutes}m</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleEnroll(activeCourse.id)}
                      isLoading={isEnrolling}
                      className="w-full shadow-sm"
                    >
                      Enroll in Course ({activeCourse.price > 0 ? `$${activeCourse.price}` : 'Free'})
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
