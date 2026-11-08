'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { BookOpen, ArrowRight, Check, RefreshCw } from 'lucide-react';
import { CourseUI } from '@/types/ui';

interface LearnerCoursesSectionProps {
  selectedSkill: string;
  courses: CourseUI[];
  enrolledCourseIds: Set<string>;
  onEnroll: (courseId: string, title: string) => void;
  hasMoreCourses: boolean;
  isLoadingMoreCourses: boolean;
  onLoadNext5Courses: () => void;
}

export function LearnerCoursesSection({
  selectedSkill,
  courses,
  enrolledCourseIds,
  onEnroll,
  hasMoreCourses,
  isLoadingMoreCourses,
  onLoadNext5Courses,
}: LearnerCoursesSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            <span>Verified Curriculum Courses for &quot;{selectedSkill}&quot;</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Top real courses retrieved from PostgreSQL with module breakdowns and completion tracking.
          </p>
        </div>
        <Link href="/courses" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
          <span>View All Courses</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {courses.length === 0 ? (
        <Card className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
          <p className="text-sm text-slate-500">No courses currently matched for this skill query.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <Card
              key={c.id}
              className="overflow-hidden bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] font-semibold">
                    {c.level || 'BEGINNER'}
                  </Badge>
                  <span className="text-xs font-bold text-slate-900">
                    {c.price === 0 ? 'Free' : `$${c.price}`}
                  </span>
                </div>

                <Link href={`/courses/${c.slug || c.id}`}>
                  <h3 className="text-base font-bold text-slate-900 hover:text-emerald-600 transition-colors leading-snug line-clamp-2">
                    {c.title}
                  </h3>
                </Link>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{c.description}</p>

                <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                  <Avatar src={c.instructor?.avatarUrl} fallback={c.instructor?.name || 'I'} size="sm" />
                  <span className="font-medium truncate">{c.instructor?.name}</span>
                  <span>•</span>
                  <span>⭐ {c.rating} ({c.reviewsCount} reviews)</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link href={`/courses/${c.slug || c.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                    View Syllabus
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => onEnroll(c.id, c.title)}
                  disabled={enrolledCourseIds.has(c.id)}
                  className={`text-xs font-semibold ${
                    enrolledCourseIds.has(c.id)
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {enrolledCourseIds.has(c.id) ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Enrolled
                    </span>
                  ) : (
                    'Enroll Now'
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Show Next 5 Courses Pagination */}
      {hasMoreCourses && (
        <div className="pt-2 text-center">
          <Button
            variant="outline"
            onClick={onLoadNext5Courses}
            disabled={isLoadingMoreCourses}
            className="px-6 rounded-xl text-xs font-semibold border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
          >
            {isLoadingMoreCourses ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading next courses...
              </span>
            ) : (
              <span>Show Next 5 Courses (Exclude Displayed)</span>
            )}
          </Button>
        </div>
      )}
    </section>
  );
}

