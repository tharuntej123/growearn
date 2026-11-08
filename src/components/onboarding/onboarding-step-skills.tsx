'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Zap, X, Plus, Search } from 'lucide-react';

interface OnboardingStepSkillsProps {
  customRoleInput: string;
  targetRole: string;
  selectedSkills: string[];
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
  customSkillInput: string;
  setCustomSkillInput: (val: string) => void;
  popularSkillSuggestions: readonly string[];
  careerGoal: string;
  setCareerGoal: (goal: string) => void;
  careerGoalOptions: readonly string[];
}

export function OnboardingStepSkills({
  customRoleInput,
  targetRole,
  selectedSkills,
  onAddSkill,
  onRemoveSkill,
  customSkillInput,
  setCustomSkillInput,
  popularSkillSuggestions,
  careerGoal,
  setCareerGoal,
  careerGoalOptions,
}: OnboardingStepSkillsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Zap className="h-5 w-5 text-emerald-600" /> Your Current Skill Baseline & Goal
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Tell us what technologies you already know. Our AI will identify your exact skill gaps for{' '}
          <span className="font-bold text-emerald-700">{customRoleInput || targetRole}</span>.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Selected Baseline Skills ({selectedSkills.length}):
        </label>
        <div className="min-h-[48px] p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap gap-2">
          {selectedSkills.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No skills selected yet. Click pills below or type custom skills.</span>
          ) : (
            selectedSkills.map((sk) => (
              <span
                key={sk}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
              >
                {sk}
                <button
                  type="button"
                  onClick={() => onRemoveSkill(sk)}
                  className="hover:text-emerald-950"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAddSkill(customSkillInput);
        }}
        className="flex gap-2"
      >
        <Input
          placeholder="Type any technology or tool (e.g. Docker, Python, Spring Boot)..."
          value={customSkillInput}
          onChange={(e) => setCustomSkillInput(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
        <Button type="submit" variant="outline" size="sm" className="gap-1 shrink-0">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2">Popular technical skills:</p>
        <div className="flex flex-wrap gap-1.5">
          {popularSkillSuggestions.map((skill) => {
            const isSelected = selectedSkills.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => (isSelected ? onRemoveSkill(skill) : onAddSkill(skill))}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isSelected ? `✓ ${skill}` : `+ ${skill}`}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Primary Career Goal:
        </label>
        <div className="space-y-2">
          {careerGoalOptions.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setCareerGoal(g)}
              className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                careerGoal === g
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

