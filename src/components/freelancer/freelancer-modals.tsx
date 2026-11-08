'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, UploadCloud } from 'lucide-react';
import { FreelancerJobUI } from '@/types/ui';

interface ProposalModalProps {
  job: FreelancerJobUI | null;
  onClose: () => void;
  isGenerating: boolean;
  proposedRate: number;
  setProposedRate: (rate: number) => void;
  customCoverLetter: string;
  setCustomCoverLetter: (letter: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ProposalSubmissionModal({
  job,
  onClose,
  isGenerating,
  proposedRate,
  setProposedRate,
  customCoverLetter,
  setCustomCoverLetter,
  onSubmit,
  isSubmitting,
}: ProposalModalProps) {
  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <Badge variant="default" className="mb-1">AI Proposal Generator</Badge>
            <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg"
          >
            ✕
          </button>
        </div>

        {isGenerating ? (
          <div className="py-12 text-center space-y-2">
            <Sparkles className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm text-slate-700 font-semibold">AI is drafting your custom proposal...</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Proposed Price ($):
              </label>
              <input
                type="number"
                value={proposedRate}
                onChange={(e) => setProposedRate(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Editable Proposal Content:
              </label>
              <textarea
                rows={10}
                value={customCoverLetter}
                onChange={(e) => setCustomCoverLetter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onSubmit}
                isLoading={isSubmitting}
                className="gap-1.5"
              >
                <Send className="h-3.5 w-3.5" /> Submit Proposal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeText: string;
  setResumeText: (text: string) => void;
  extractedSkills: string[] | null;
  onParseResume: () => void;
  isParsingResume: boolean;
}

export function ResumeExtractionModal({
  isOpen,
  onClose,
  resumeText,
  setResumeText,
  extractedSkills,
  onParseResume,
  isParsingResume,
}: ResumeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-emerald-600" /> Resume Skill Extractor
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Paste your resume text below. Our AI will automatically identify technical competencies and save them directly to your profile:
          </p>
          <textarea
            rows={6}
            placeholder="Paste your resume work history, technical skills (e.g. React, Next.js, Java, Spring Boot, PostgreSQL, Docker)..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500"
          />

          {extractedSkills && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <p className="font-bold text-emerald-800">AI Detected Skills Saved to Profile:</p>
              <div className="flex flex-wrap gap-1.5">
                {extractedSkills.map((sk) => (
                  <Badge key={sk} variant="success">{sk}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
            <Button variant="default" size="sm" onClick={onParseResume} isLoading={isParsingResume}>
              Analyze & Save Skills with AI
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

