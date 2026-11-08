'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Layers, CheckCircle2 } from 'lucide-react';
import { AgenticRoadmapDataUI, RAGRoadmapDataUI } from '@/types/ui';

interface AgenticRoadmapViewProps {
  data: AgenticRoadmapDataUI;
  selectedSkill: string;
}

export function AgenticRoadmapView({ data, selectedSkill }: AgenticRoadmapViewProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                CrewAI Multi-Agent Architecture
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Tavily Tool-Calling
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold">
              Autonomous Career Roadmap for {data.target_role || data.role || selectedSkill}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Estimated {data.estimated_weeks} weeks • Status: <span className="font-semibold text-emerald-400">{data.review_status}</span> by Principal Reviewer Agent
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400">
          <span>{data.reviewer_notes || 'Audited for prerequisite pacing and resource legitimacy.'}</span>
        </div>
      </div>

      {/* Agent Collaboration Trace Cards */}
      {data.agent_trace && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.agent_trace.map((step, idx: number) => (
            <Card key={idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  {step.agent} Agent
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900 mb-1">{step.action}</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">{step.summary}</p>
            </Card>
          ))}
        </div>
      )}

      {/* 4-Phase Curriculum Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(data.phases || []).map((phase, idx: number) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 hover:bg-emerald-50/50 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white uppercase tracking-wider">
                  Phase {phase.phase_number || idx + 1}
                </span>
                <span className="text-xs font-medium text-slate-500">{phase.duration_weeks || 4} wks</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">{phase.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{phase.objective}</p>

              {phase.skills && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {phase.skills.slice(0, 3).map((sk: string) => (
                    <span key={sk} className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {sk}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/60 space-y-1">
                <p className="text-[11px] font-semibold text-slate-800">Capstone Project:</p>
                <p className="text-[11px] text-slate-600 line-clamp-2">{phase.capstone_project}</p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-semibold">{phase.milestone?.slice(0, 30)}...</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

interface DatabaseRoadmapViewProps {
  data: RAGRoadmapDataUI;
  selectedSkill: string;
}

export function DatabaseRoadmapView({ data, selectedSkill }: DatabaseRoadmapViewProps) {
  if (!data.roadmap) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-600" />
            <span>Structured Learning Roadmap for {data.roadmap.targetRole || selectedSkill}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Estimated duration: {data.roadmap.estimatedDurationWeeks} weeks • Pacing level: {data.roadmap.currentLevel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              data.ragMetrics?.searchMode === 'SEMANTIC_RAG'
                ? 'bg-purple-50 text-purple-800 border-purple-200 text-xs font-semibold'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold'
            }
          >
            {data.ragMetrics?.searchMode === 'SEMANTIC_RAG' ? '✨ pgvector AI Semantic RAG' : '⚡ Verified Skill Engine'}
          </Badge>
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-semibold">
            Database-Backed
          </Badge>
        </div>
      </div>

      <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <p className="text-sm text-slate-700 mb-6 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
          {data.roadmap.summary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data.roadmap.phases || []).map((phase, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    Phase {phase.phaseNumber || idx + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-500">{phase.durationWeeks || 4} wks</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{phase.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{phase.objective}</p>

                {phase.skills && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {phase.skills.slice(0, 3).map((sk: string) => (
                      <span key={sk} className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{phase.milestone || 'Phase verified'}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

