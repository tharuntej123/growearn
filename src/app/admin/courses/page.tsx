'use client';

import React, { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Star,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await fetch(`/api/courses?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCourses(json.data.courses || []);
        setTotalPages(json.data.pagination?.totalPages || 1);
      } else {
        toast.error(json.error?.message || 'Failed to load courses');
      }
    } catch {
      toast.error('Network error loading courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, statusFilter]);

  const handleModerate = async (courseId: string, status: string, isFeatured?: boolean) => {
    setUpdatingId(courseId);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/moderate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, isFeatured }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Course status updated to ${status}`);
        fetchCourses();
      } else {
        toast.error(json.error?.message || 'Moderation failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-emerald-600" /> Course Moderation
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Review published and draft courses, verify syllabus quality, and feature high-impact content.
            </p>
          </div>
          <Button onClick={fetchCourses} variant="outline" size="sm" className="gap-2 self-start">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search courses by title or skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCourses()}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Status"
              className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </Card>

        {/* Courses Table */}
        <Card className="bg-white border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Instructor</th>
                  <th className="py-3.5 px-4">Level & Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading courses...
                    </td>
                  </tr>
                ) : courses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No courses found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  courses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {c.title}
                          {c.isFeatured && (
                            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {c.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-slate-800">{c.instructor?.name || 'Instructor'}</div>
                        <div className="text-slate-400">{c.instructor?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-slate-900">${c.price}</div>
                        <div className="text-slate-500">{c.level}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            c.status === 'PUBLISHED'
                              ? 'success'
                              : c.status === 'DRAFT'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/courses/${c.slug}`} target="_blank">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          {c.status === 'PUBLISHED' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingId === c.id}
                              onClick={() => handleModerate(c.id, 'DRAFT')}
                              className="h-7 px-2.5 text-xs text-amber-700 hover:bg-amber-50"
                            >
                              Unpublish
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              disabled={updatingId === c.id}
                              onClick={() => handleModerate(c.id, 'PUBLISHED')}
                              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                            >
                              Publish
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === c.id}
                            onClick={() => handleModerate(c.id, c.status, !c.isFeatured)}
                            className="h-7 px-2 text-xs text-slate-600"
                            title={c.isFeatured ? 'Unfeature' : 'Feature'}
                          >
                            <Star className={`h-3.5 w-3.5 ${c.isFeatured ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
