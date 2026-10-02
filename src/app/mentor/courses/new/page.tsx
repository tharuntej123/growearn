'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Plus,
  Trash2,
  ArrowLeft,
  Sparkles,
  Layers,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface LessonInput {
  title: string;
  durationMinutes: number;
  content?: string;
  videoUrl?: string;
}

interface ModuleInput {
  title: string;
  description?: string;
  lessons: LessonInput[];
}

export default function NewCoursePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Backend');
  const [level, setLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [price, setPrice] = useState<number>(0);
  const [durationHours, setDurationHours] = useState<number>(12);
  const [skillsCovered, setSkillsCovered] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modules, setModules] = useState<ModuleInput[]>([
    {
      title: 'Module 1: Foundations & Architecture Setup',
      description: 'Core overview, environment configuration, and project architecture.',
      lessons: [
        { title: 'Introduction & Project Overview', durationMinutes: 15 },
        { title: 'Environment Setup & Tooling', durationMinutes: 20 },
      ],
    },
    {
      title: 'Module 2: Core Engineering & Implementation',
      description: 'Building the core service logic, relational data models, and API endpoints.',
      lessons: [
        { title: 'Domain Data Modeling & Schema Design', durationMinutes: 25 },
        { title: 'Implementing Service Layer Logic', durationMinutes: 30 },
      ],
    },
  ]);

  const handleAddModule = () => {
    setModules([
      ...modules,
      {
        title: `Module ${modules.length + 1}: Advanced Topics`,
        description: 'Deep dive into advanced patterns and production deployment.',
        lessons: [{ title: 'Advanced Design Patterns', durationMinutes: 20 }],
      },
    ]);
  };

  const handleRemoveModule = (mIdx: number) => {
    if (modules.length <= 1) {
      toast.error('Course must have at least one module');
      return;
    }
    setModules(modules.filter((_, idx) => idx !== mIdx));
  };

  const handleAddLesson = (mIdx: number) => {
    const updated = [...modules];
    updated[mIdx].lessons.push({
      title: `Lesson ${updated[mIdx].lessons.length + 1}: Topic`,
      durationMinutes: 15,
    });
    setModules(updated);
  };

  const handleRemoveLesson = (mIdx: number, lIdx: number) => {
    const updated = [...modules];
    if (updated[mIdx].lessons.length <= 1) {
      toast.error('Module must have at least one lesson');
      return;
    }
    updated[mIdx].lessons = updated[mIdx].lessons.filter((_, idx) => idx !== lIdx);
    setModules(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Please enter course title and description');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          level,
          price: Number(price),
          durationHours: Number(durationHours),
          skillsCovered: skillsCovered.trim(),
          modules: modules.map((m, mIdx) => ({
            title: m.title.trim(),
            description: m.description?.trim(),
            orderIndex: mIdx,
            lessons: m.lessons.map((l, lIdx) => ({
              title: l.title.trim(),
              durationMinutes: Number(l.durationMinutes) || 15,
              content: l.content?.trim(),
              videoUrl: l.videoUrl?.trim(),
              orderIndex: lIdx,
            })),
          })),
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.course) {
        toast.success(`🎉 Course "${title}" published successfully!`);
        router.push(`/courses/${json.data.course.slug}`);
      } else {
        toast.error(json.error?.message || 'Course publishing failed');
      }
    } catch {
      toast.error('Network error publishing course');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/mentor/courses" className="hover:text-emerald-600 flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to My Courses
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            <span>Publish New Engineering Course</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create a structured course with interactive modules and lessons for learners worldwide.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Course Info */}
          <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" /> Course Details
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Spring Boot 3 & High-Throughput Microservices"
                required
                className="text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Description & Overview</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the skills learners will gain, prerequisites, and what hands-on projects they will build..."
                rows={4}
                required
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900"
                >
                  <option value="Backend">Backend</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Full Stack">Full Stack</option>
                  <option value="AI & Machine Learning">AI & Machine Learning</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="Database & Architecture">Database & Architecture</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Price (USD)</label>
                <Input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0 for Free"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Hours</label>
                <Input
                  type="number"
                  min="1"
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseFloat(e.target.value) || 1)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Skills Covered (Comma-separated)</label>
                <Input
                  value={skillsCovered}
                  onChange={(e) => setSkillsCovered(e.target.value)}
                  placeholder="e.g. Java, Spring Boot, PostgreSQL, Docker"
                  className="text-xs"
                />
              </div>
            </div>
          </Card>

          {/* Curriculum Syllabus Builder */}
          <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" /> Curriculum Modules & Lessons
              </h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddModule}
                className="text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Module
              </Button>
            </div>

            <div className="space-y-4">
              {modules.map((m, mIdx) => (
                <div key={mIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Input
                      value={m.title}
                      onChange={(e) => {
                        const updated = [...modules];
                        updated[mIdx].title = e.target.value;
                        setModules(updated);
                      }}
                      placeholder="Module Title"
                      className="text-xs font-bold bg-white"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveModule(mIdx)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Lessons list */}
                  <div className="pl-4 space-y-2 border-l-2 border-slate-200">
                    {m.lessons.map((l, lIdx) => (
                      <div key={lIdx} className="flex items-center gap-2">
                        <Input
                          value={l.title}
                          onChange={(e) => {
                            const updated = [...modules];
                            updated[mIdx].lessons[lIdx].title = e.target.value;
                            setModules(updated);
                          }}
                          placeholder="Lesson Title"
                          className="text-xs bg-white flex-1"
                        />
                        <Input
                          type="number"
                          value={l.durationMinutes}
                          onChange={(e) => {
                            const updated = [...modules];
                            updated[mIdx].lessons[lIdx].durationMinutes = parseInt(e.target.value) || 15;
                            setModules(updated);
                          }}
                          placeholder="Mins"
                          className="text-xs w-20 bg-white"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLesson(mIdx, lIdx)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddLesson(mIdx)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 pt-1"
                    >
                      <Plus className="h-3 w-3" /> Add Lesson
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/mentor/courses">
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 h-11 rounded-xl shadow-sm flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Publishing Course...' : 'Publish Course'}</span>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
