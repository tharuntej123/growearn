'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Users, ArrowRight, RefreshCw } from 'lucide-react';
import { MentorUI } from '@/types/ui';

interface LearnerMentorsSectionProps {
  selectedSkill: string;
  mentors: MentorUI[];
  onRequestMentorship: (mentor: MentorUI) => void;
  hasMoreMentors: boolean;
  isLoadingMoreMentors: boolean;
  onLoadNext5Mentors: () => void;
}

export function LearnerMentorsSection({
  selectedSkill,
  mentors,
  onRequestMentorship,
  hasMoreMentors,
  isLoadingMoreMentors,
  onLoadNext5Mentors,
}: LearnerMentorsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            <span>Industry Mentors in &quot;{selectedSkill}&quot;</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Book 1-on-1 architecture audits, code reviews, and technical mock interviews with verified senior engineers.
          </p>
        </div>
        <Link href="/mentors" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
          <span>View All Mentors</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {mentors.length === 0 ? (
        <Card className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
          <p className="text-sm text-slate-500">No mentors currently matched for this skill query.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((m) => (
            <Card
              key={m.id}
              className="p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar src={m.avatarUrl} fallback={m.name} size="md" className="rounded-xl ring-2 ring-emerald-100" />
                  <div className="overflow-hidden">
                    <Link href={`/mentors/${m.id}`}>
                      <h3 className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors truncate">
                        {m.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-500 truncate">{m.headline || `${m.yearsExperience}+ yrs experience`}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-emerald-700">
                      <span>⭐ {m.rating}</span>
                      <span>•</span>
                      <span>₹{m.hourlyRate}/hr</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{m.bio}</p>

                <div className="flex flex-wrap gap-1 pt-1">
                  {(typeof m.expertise === 'string' ? m.expertise.split(',') : []).slice(0, 4).map((exp: string) => (
                    <span key={exp} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link href={`/mentors/${m.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                    View Profile
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => onRequestMentorship(m)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Request Mentorship
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Show Next 5 Mentors Pagination */}
      {hasMoreMentors && (
        <div className="pt-2 text-center">
          <Button
            variant="outline"
            onClick={onLoadNext5Mentors}
            disabled={isLoadingMoreMentors}
            className="px-6 rounded-xl text-xs font-semibold border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
          >
            {isLoadingMoreMentors ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading next mentors...
              </span>
            ) : (
              <span>Show Next 5 Mentors (Exclude Displayed)</span>
            )}
          </Button>
        </div>
      )}
    </section>
  );
}
