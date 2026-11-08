'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  headline: string;
  setHeadline: (h: string) => void;
  targetRole: string;
  setTargetRole: (t: string) => void;
  careerGoal: string;
  setCareerGoal: (c: string) => void;
  location: string;
  setLocation: (l: string) => void;
  portfolioUrl: string;
  setPortfolioUrl: (p: string) => void;
  bio: string;
  setBio: (b: string) => void;
  isSaving: boolean;
}

export function EditProfileModal({
  isOpen,
  onClose,
  onSubmit,
  headline,
  setHeadline,
  targetRole,
  setTargetRole,
  careerGoal,
  setCareerGoal,
  location,
  setLocation,
  portfolioUrl,
  setPortfolioUrl,
  bio,
  setBio,
  isSaving,
}: EditProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Edit Profile Information</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Headline</label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Full Stack Engineer | React & Java Specialist"
              className="bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Role</label>
              <Input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Backend Engineer"
                className="bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Career Goal</label>
              <Input
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                placeholder="e.g. Master Cloud Microservices"
                className="bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Location</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bangalore, India"
                className="bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Portfolio Link</label>
              <Input
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://..."
                className="bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">About / Bio</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 shadow-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="default" size="sm" type="submit" isLoading={isSaving} className="shadow-xs font-semibold">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddEducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  school: string;
  setSchool: (s: string) => void;
  degree: string;
  setDegree: (d: string) => void;
  field: string;
  setField: (f: string) => void;
  startYear: string;
  setStartYear: (y: string) => void;
  endYear: string;
  setEndYear: (y: string) => void;
  isAdding: boolean;
}

export function AddEducationModal({
  isOpen,
  onClose,
  onSubmit,
  school,
  setSchool,
  degree,
  setDegree,
  field,
  setField,
  startYear,
  setStartYear,
  endYear,
  setEndYear,
  isAdding,
}: AddEducationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Add Academic Education</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">School / University *</label>
            <Input
              placeholder="e.g. Stanford University"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Degree *</label>
            <Input
              placeholder="e.g. Bachelor of Science in Computer Science"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Field of Study</label>
            <Input
              placeholder="e.g. Software Engineering"
              value={field}
              onChange={(e) => setField(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Year</label>
              <Input
                type="number"
                placeholder="2020"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Year</label>
              <Input
                type="number"
                placeholder="2024"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="default" size="sm" type="submit" isLoading={isAdding} className="font-semibold">
              Add Education
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  company: string;
  setCompany: (c: string) => void;
  title: string;
  setTitle: (t: string) => void;
  location: string;
  setLocation: (l: string) => void;
  startDate: string;
  setStartDate: (s: string) => void;
  endDate: string;
  setEndDate: (e: string) => void;
  description: string;
  setDescription: (d: string) => void;
  isAdding: boolean;
}

export function AddExperienceModal({
  isOpen,
  onClose,
  onSubmit,
  company,
  setCompany,
  title,
  setTitle,
  location,
  setLocation,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  description,
  setDescription,
  isAdding,
}: AddExperienceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Add Professional Experience</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company / Organization *</label>
            <Input
              placeholder="e.g. Acme Corp"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Job Title *</label>
            <Input
              placeholder="e.g. Full Stack Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Location</label>
            <Input
              placeholder="e.g. Remote / Bangalore"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
              <Input
                placeholder="Jan 2023"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date</label>
              <Input
                placeholder="Present"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Key responsibilities and accomplishments..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="default" size="sm" type="submit" isLoading={isAdding} className="font-semibold">
              Save Experience
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
