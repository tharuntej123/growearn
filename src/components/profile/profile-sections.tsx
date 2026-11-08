'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { GraduationCap, Briefcase, Plus, Trash2, Edit3, MapPin, Code2, CheckCircle2 } from 'lucide-react';
import { EducationItem, ExperienceItem, UserProfileUI } from '@/types/ui';

interface ProfileEducationSectionProps {
  educations: EducationItem[];
  onAddEducation: () => void;
  onDeleteEducation: (id: string) => void;
}

export function ProfileEducationSection({
  educations,
  onAddEducation,
  onDeleteEducation,
}: ProfileEducationSectionProps) {
  return (
    <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-600" /> Education & Degrees
          </h2>
          <p className="text-xs text-slate-500">Your academic background and credentials.</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddEducation}
          className="gap-1 text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" /> Add Education
        </Button>
      </div>

      <div className="space-y-3">
        {educations.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">No education records added yet.</p>
        ) : (
          educations.map((edu) => (
            <div key={edu.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{edu.institution}</h4>
                <p className="text-xs text-emerald-700 font-semibold">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {edu.startYear} - {edu.endYear || 'Present'}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDeleteEducation(edu.id)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

interface ProfileExperienceSectionProps {
  experiences: ExperienceItem[];
  onAddExperience: () => void;
  onDeleteExperience: (id: string) => void;
}

export function ProfileExperienceSection({
  experiences,
  onAddExperience,
  onDeleteExperience,
}: ProfileExperienceSectionProps) {
  return (
    <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-600" /> Work History & Experience
          </h2>
          <p className="text-xs text-slate-500">Industry roles, internships, and project engagements.</p>
        </div>
        <Button size="sm" variant="outline" onClick={onAddExperience} className="gap-1 text-xs font-semibold">
          <Plus className="h-3.5 w-3.5" /> Add Experience
        </Button>
      </div>

      <div className="space-y-3">
        {experiences.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">No work experience records added yet.</p>
        ) : (
          experiences.map((exp) => (
            <div key={exp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{exp.title || exp.jobTitle}</h4>
                <p className="text-xs text-emerald-700 font-semibold">{exp.company || exp.companyName}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {exp.startDate} - {exp.endDate || 'Present'} {exp.location ? `• ${exp.location}` : ''}
                </p>
                {exp.description && (
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{exp.description}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDeleteExperience(exp.id)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

interface ProfileHeaderCardProps {
  profile: UserProfileUI | null;
  userRole: string;
  onEdit: () => void;
}

export function ProfileHeaderCard({ profile, userRole, onEdit }: ProfileHeaderCardProps) {
  return (
    <Card className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Avatar src={profile?.avatarUrl} fallback={profile?.name || 'User'} size="xl" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{profile?.name}</h1>
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">
                {userRole}
              </Badge>
            </div>
            <p className="text-sm font-medium text-slate-700 mt-1">{profile?.headline || `${userRole} Profile`}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {String(profile?.location || 'Remote')}
              </span>
              {(profile?.profile as { targetRole?: string | null })?.targetRole && (
                <>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">
                    Target Role: {(profile?.profile as { targetRole?: string | null }).targetRole}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="gap-1.5 text-xs bg-white font-semibold"
          >
            <Edit3 className="h-3.5 w-3.5" /> Edit Profile
          </Button>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p className="font-bold text-slate-900 mb-1">About</p>
        <p>{String(profile?.bio || 'Building modern software solutions and advancing career skills with Growearn.')}</p>
      </div>
    </Card>
  );
}

interface ProfileSkillsSectionProps {
  userSkills: Array<{ id?: string; name?: string; skill?: { name?: string }; proficiencyLevel?: string }>;
  newSkillName: string;
  setNewSkillName: (n: string) => void;
  newSkillProficiency: string;
  setNewSkillProficiency: (p: string) => void;
  onAddSkill: (e: React.FormEvent) => void;
  isAddingSkill: boolean;
}

export function ProfileSkillsSection({
  userSkills,
  newSkillName,
  setNewSkillName,
  newSkillProficiency,
  setNewSkillProficiency,
  onAddSkill,
  isAddingSkill,
}: ProfileSkillsSectionProps) {
  return (
    <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="h-5 w-5 text-emerald-600" /> Skills & Competencies
          </h2>
          <p className="text-xs text-slate-500">Validated competencies for AI matching and recommendations.</p>
        </div>
      </div>

      <form onSubmit={onAddSkill} className="flex flex-col sm:flex-row items-center gap-2 pt-1">
        <Input
          placeholder="Add skill (e.g. Next.js, Docker, Java, PostgreSQL, Spring Boot)..."
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          className="flex-1 bg-white"
        />
        <select
          value={newSkillProficiency}
          onChange={(e) => setNewSkillProficiency(e.target.value)}
          aria-label="Skill Proficiency"
          className="bg-white border border-slate-200 text-xs text-slate-800 rounded-xl h-10 px-3 shadow-xs"
        >
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
          <option value="EXPERT">Expert</option>
        </select>
        <Button type="submit" variant="default" size="sm" isLoading={isAddingSkill} className="h-10 shrink-0 gap-1 shadow-xs font-semibold">
          <Plus className="h-4 w-4" /> Add Skill
        </Button>
      </form>

      <div className="flex flex-wrap gap-2 pt-2">
        {userSkills.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No skills recorded yet. Add your first skill above.</p>
        ) : (
          userSkills.map((sk, idx: number) => {
            const name = sk.skill?.name || sk.name || 'Skill';
            const level = sk.proficiencyLevel || 'INTERMEDIATE';
            return (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-2"
              >
                <span className="font-bold text-slate-900">{name}</span>
                <span className="text-[10px] text-emerald-700 font-semibold">({level})</span>
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
