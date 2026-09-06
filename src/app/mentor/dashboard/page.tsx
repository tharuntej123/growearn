'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { QuickPostCard } from '@/components/feed/quick-post-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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
  Upload,
  FileText,
  X,
  Compass,
} from 'lucide-react';
import { toast } from 'sonner';

interface CourseItem {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
  fileName?: string;
  fileSizeMb?: string;
  enrollmentsCount: number;
}

export default function MentorDashboardPage() {
  const { user } = useAuth();

  // Create Course Modal State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('Full Stack Development');
  const [coursePrice, setCoursePrice] = useState(49);
  const [courseDescription, setCourseDescription] = useState('');
  const [courseFile, setCourseFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Published Courses List
  const [publishedCourses, setPublishedCourses] = useState<CourseItem[]>([
    {
      id: 'course-1',
      title: 'Full Stack Next.js 16 & Microservices Architecture',
      category: 'Full Stack Development',
      price: 59,
      description: 'Production-grade course covering React 19, Next.js App Router, Prisma ORM, and distributed microservices.',
      fileName: 'nextjs-microservices-syllabus.pdf',
      fileSizeMb: '2.4 MB',
      enrollmentsCount: 184,
    },
    {
      id: 'course-2',
      title: 'High Throughput System Design & Distributed Caching',
      category: 'System Architecture',
      price: 79,
      description: 'Master low-latency cache invalidation, Redis cluster topology, and Kafka event stream architectures.',
      fileName: 'system-design-case-studies.pdf',
      fileSizeMb: '4.1 MB',
      enrollmentsCount: 128,
    },
  ]);

  // Coaching Requests
  const [requests, setRequests] = useState([
    {
      id: 'req-1',
      student: { name: 'Alex Chen', email: 'student@example.com', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
      topic: 'Full Stack Architecture & Career Roadmap Review',
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check 5 MB limit
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error('File size exceeds the 5 MB limit. Please select a smaller file.');
      return;
    }

    setCourseFile(file);
    toast.success(`Attached "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
  };

  const handlePublishCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim() || !courseDescription.trim()) {
      toast.error('Please fill in all course details');
      return;
    }

    setIsPublishing(true);
    try {
      const newCourse: CourseItem = {
        id: `course-${Date.now()}`,
        title: courseTitle.trim(),
        category: courseCategory,
        price: Number(coursePrice),
        description: courseDescription.trim(),
        fileName: courseFile ? courseFile.name : 'course-overview.pdf',
        fileSizeMb: courseFile ? `${(courseFile.size / (1024 * 1024)).toFixed(2)} MB` : '1.2 MB',
        enrollmentsCount: 0,
      };

      setPublishedCourses([newCourse, ...publishedCourses]);
      toast.success(`🎉 Course "${courseTitle}" published successfully!`);
      setShowCourseModal(false);
      setCourseTitle('');
      setCourseDescription('');
      setCourseFile(null);
    } catch {
      toast.error('Failed to publish course');
    } finally {
      setIsPublishing(false);
    }
  };

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
              <Badge variant="success" className="mb-2">Mentor Dashboard</Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Welcome, {user?.name || 'Mentor'}! 👨‍🏫
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Rate: <span className="text-emerald-700 font-semibold">${user?.profile?.hourlyRate || 85}/hr</span> • Publish interactive courses (with up to 5 MB materials upload), conduct 1-on-1 sessions, and guide learners.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowCourseModal(true)}
                className="gap-1.5 shadow-sm font-semibold"
              >
                <PlusCircle className="h-4 w-4" /> Publish New Course
              </Button>
              <Link href="/profile">
                <Button variant="outline" size="sm" className="bg-white font-semibold">
                  Manage Mentor Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Active Students</span>
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">142</p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">+14 this month</p>
          </Card>

          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Mentoring Revenue</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">$18,400</p>
            <p className="text-[11px] text-slate-500 mt-1">From 260+ sessions</p>
          </Card>

          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Mentor Rating</span>
              <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">4.95 / 5.0</p>
            <p className="text-[11px] text-slate-500 mt-1">Across 84 student reviews</p>
          </Card>

          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Published Courses</span>
              <BookOpen className="h-4 w-4 text-teal-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{publishedCourses.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">312 total enrollments</p>
          </Card>
        </div>

        {/* SECTION 1: PUBLISHED COURSES MANAGEMENT */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-teal-600" /> My Published Courses & Materials
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload and manage structured learning modules, syllabus documents (up to 5 MB), and track student enrollments.
              </p>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={() => setShowCourseModal(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Post a Course
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedCourses.map((c) => (
              <Card key={c.id} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-[10px]">{c.category}</Badge>
                  <span className="text-sm font-extrabold text-emerald-700">${c.price}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{c.description}</p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 truncate max-w-xs">
                    <FileText className="h-4 w-4 text-emerald-600 shrink-0" /> {c.fileName} ({c.fileSizeMb})
                  </span>
                  <Badge variant="success" className="text-[10px]">{c.enrollmentsCount} Enrolled</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 2: STUDENT COACHING SESSIONS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" /> Student Coaching Requests & Sessions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage 1-on-1 architecture reviews and mentor booking requests.</p>
            </div>
            <Badge variant="outline" className="bg-white">{requests.length} Active</Badge>
          </div>

          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id} className="p-5 bg-white border border-slate-200 shadow-xs rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar src={req.student.avatarUrl} fallback={req.student.name} size="md" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{req.student.name}</h4>
                        <Badge
                          variant={req.status === 'ACCEPTED' ? 'success' : 'warning'}
                          className="text-[10px]"
                        >
                          {req.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-emerald-700">{req.topic}</p>
                      <p className="text-xs text-slate-600 max-w-xl leading-relaxed">{req.message}</p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {req.time}</span>
                        <span>•</span>
                        <span className="text-slate-600">{req.student.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'PENDING' ? (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAccept(req.id)}
                          className="gap-1 text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(req.id)}
                          className="gap-1 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Decline
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="default" className="gap-1.5 text-xs bg-emerald-600">
                        <Video className="h-3.5 w-3.5" /> Join Room
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 3: COMMUNITY FEED & QUICK POST */}
        <div className="space-y-4 pt-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Compass className="h-5 w-5 text-emerald-600" /> Share with Groearn Community
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Post architectural tips, course updates, and open mentorship slots.</p>
          </div>

          <QuickPostCard
            placeholder="Share an architectural tip, mentorship availability, or technical guidance..."
          />
        </div>
      </main>

      {/* CREATE COURSE MODAL WITH 5MB FILE UPLOAD */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowCourseModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1 mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-1">
                <BookOpen className="h-3.5 w-3.5" /> Course Publishing
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Create & Publish a Course</h3>
              <p className="text-xs text-slate-500">Provide course syllabus and upload supplementary notes (up to 5 MB).</p>
            </div>

            <form onSubmit={handlePublishCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title *</label>
                <Input
                  placeholder="e.g. Master Production Distributed Systems"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={courseCategory}
                    onChange={(e) => setCourseCategory(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs text-slate-800 bg-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Full Stack Development">Full Stack Development</option>
                    <option value="AI & Machine Learning">AI & Machine Learning</option>
                    <option value="System Architecture">System Architecture</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Backend Engineering">Backend Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price ($ USD)</label>
                  <Input
                    type="number"
                    min={0}
                    value={coursePrice}
                    onChange={(e) => setCoursePrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Description & Learning Outcomes *</label>
                <textarea
                  rows={3}
                  placeholder="Describe the modules, live projects, and technical skills students will master..."
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                  required
                />
              </div>

              {/* 5 MB FILE UPLOAD BOX */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Course Materials / Syllabus (PDF, ZIP, DOCX — Max 5 MB)
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-emerald-400 transition-colors bg-slate-50/50">
                  <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                  <input
                    type="file"
                    id="course-file-input"
                    accept=".pdf,.zip,.docx,.doc"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="course-file-input" className="cursor-pointer">
                    <span className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                      {courseFile ? `Selected: ${courseFile.name}` : 'Click to select file from computer'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Maximum file size: 5 MB</p>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowCourseModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm" isLoading={isPublishing} className="gap-1.5 px-5 font-semibold">
                  <Sparkles className="h-4 w-4" /> Publish Course
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
