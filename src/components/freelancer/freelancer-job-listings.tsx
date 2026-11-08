'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { FreelancerJobUI } from '@/types/ui';

interface FreelancerJobListingsProps {
  activeJobTab: 'ALL' | 'FREELANCE' | 'LOCAL';
  freelanceJobs: FreelancerJobUI[];
  localJobs: FreelancerJobUI[];
  onOpenProposal: (job: FreelancerJobUI) => void;
}

export function FreelancerJobListings({
  activeJobTab,
  freelanceJobs,
  localJobs,
  onOpenProposal,
}: FreelancerJobListingsProps) {
  return (
    <>
      {(activeJobTab === 'ALL' || activeJobTab === 'FREELANCE') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="text-xl">🌍</span> Main Freelancing & Global Gigs
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Worldwide remote contracts, client projects, and distributed freelance opportunities.
              </p>
            </div>
            <Badge variant="default" className="text-[11px]">
              {freelanceJobs.length} Global {freelanceJobs.length === 1 ? 'Opportunity' : 'Opportunities'}
            </Badge>
          </div>

          {freelanceJobs.length === 0 ? (
            <Card className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
              <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No freelance listings match your filter</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing your search query or switching city filters.</p>
            </Card>
          ) : (
            <div className="space-y-3.5">
              {freelanceJobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-5 sm:p-6 bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all rounded-2xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">{job.title}</h3>
                        {job.isPersonalized && Number(job.matchScore || 0) > 0 && (
                          <Badge variant="success" className="text-[10px]">
                            {job.matchScore}% Match
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
                          🌍 Remote / Freelance
                        </Badge>
                        <Badge variant="success" className="text-[10px]">
                          {job.experienceLevel}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.skills?.map((s: { id?: string; name?: string; skill?: { name?: string } }, sIdx: number) => (
                          <span
                            key={s.skill?.name || s.name || s.id || sIdx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-medium"
                          >
                            {s.skill?.name || s.name}
                          </span>
                        ))}
                      </div>

                      {job.whyMatches && job.isPersonalized && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                          {job.whyMatches}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end justify-between shrink-0 gap-3">
                      <div className="text-left sm:text-right">
                        <p className="text-base font-bold text-emerald-700">
                          {formatCurrency(job.minSalary || 0, (job.currency as string) || 'USD')} - {formatCurrency(job.maxSalary || 0, (job.currency as string) || 'USD')}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">{job.company?.name}</p>
                      </div>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onOpenProposal(job)}
                        className="gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Generate AI Proposal
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {(activeJobTab === 'ALL' || activeJobTab === 'LOCAL') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="text-xl">📍</span> Local Jobs & Tech Hubs
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                On-site and hybrid career positions in Chennai, Bengaluru, Hyderabad, and regional engineering centers.
              </p>
            </div>
            <Badge variant="purple" className="text-[11px]">
              {localJobs.length} Local {localJobs.length === 1 ? 'Job' : 'Jobs'}
            </Badge>
          </div>

          {localJobs.length === 0 ? (
            <Card className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
              <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No local jobs found matching your filters</p>
              <p className="text-xs text-slate-500 mt-1">Try selecting another city like Chennai or clearing the keyword search.</p>
            </Card>
          ) : (
            <div className="space-y-3.5">
              {localJobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-5 sm:p-6 bg-white border border-purple-200/80 hover:border-purple-400 hover:shadow-md transition-all rounded-2xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">{job.title}</h3>
                        {job.isPersonalized && Number(job.matchScore || 0) > 0 && (
                          <Badge variant="success" className="text-[10px]">
                            {job.matchScore}% Match
                          </Badge>
                        )}
                        <Badge variant="purple" className="text-[10px] font-bold">
                          📍 Local: {job.city || 'Chennai'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {job.locationType}
                        </Badge>
                        <Badge variant="success" className="text-[10px]">
                          {job.experienceLevel}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.skills?.map((s: { id?: string; name?: string; skill?: { name?: string } }, sIdx: number) => (
                          <span
                            key={s.skill?.name || s.name || s.id || sIdx}
                            className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-[11px] text-purple-900 font-medium"
                          >
                            {s.skill?.name || s.name}
                          </span>
                        ))}
                      </div>

                      {job.whyMatches && job.isPersonalized && (
                        <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
                          {job.whyMatches}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end justify-between shrink-0 gap-3">
                      <div className="text-left sm:text-right">
                        <p className="text-base font-bold text-purple-800">
                          {formatCurrency(job.minSalary || 0, (job.currency as string) || 'USD')} - {formatCurrency(job.maxSalary || 0, (job.currency as string) || 'USD')}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">{job.company?.name}</p>
                      </div>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onOpenProposal(job)}
                        className="gap-1.5 bg-purple-700 hover:bg-purple-800 text-white"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Generate AI Proposal
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

