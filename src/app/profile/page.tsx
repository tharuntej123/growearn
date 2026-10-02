'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  User as UserIcon,
  MapPin,
  Sparkles,
  Plus,
  Briefcase,
  GraduationCap,
  Award,
  Link as LinkIcon,
  Globe,
  Code2,
  Edit3,
  CheckCircle2,
  X,
  Target,
  FileText,
  Upload,
  Download,
  Trash2,
  Building2,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  grade?: string;
}

interface ExperienceItem {
  id: string;
  companyName: string;
  jobTitle: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrentRole?: boolean;
  description?: string;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>(65);
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('INTERMEDIATE');
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [showAddEduModal, setShowAddEduModal] = useState(false);
  const [eduSchool, setEduSchool] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduField, setEduField] = useState('');
  const [eduStartYear, setEduStartYear] = useState('2022');
  const [eduEndYear, setEduEndYear] = useState('2026');
  const [isAddingEdu, setIsAddingEdu] = useState(false);

  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [showAddExpModal, setShowAddExpModal] = useState(false);
  const [expCompany, setExpCompany] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expLocation, setExpLocation] = useState('');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [isAddingExp, setIsAddingExp] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/profile');
      const json = await res.json();
      if (json.success && json.data?.user) {
        const u = json.data.user;
        setProfileData(u);
        setHeadline(u.headline || '');
        setBio(u.bio || '');
        setLocation(u.location || '');
        setCareerGoal(u.profile?.careerGoal || '');
        setTargetRole(u.profile?.targetRole || '');
        setPortfolioUrl(u.profile?.portfolioUrl || '');
        setHourlyRate(u.profile?.hourlyRate || (u.mentorProfile?.hourlyRate ? Number(u.mentorProfile.hourlyRate) : 65));
        setCompanyName(u.profile?.companyName || u.name || '');
        setCompanyWebsite(u.profile?.companyWebsite || '');
        setEducations(u.educations || []);
        setExperiences(u.experiences || []);
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline,
          bio,
          location,
          careerGoal,
          targetRole,
          portfolioUrl,
          companyName,
          companyWebsite,
          hourlyRate: Number(hourlyRate),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Profile updated successfully!');
        setShowEditModal(false);
        await fetchProfile();
        await refreshUser();
      } else {
        toast.error(json.error?.message || 'Update failed');
      }
    } catch {
      toast.error('Error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    setIsAddingSkill(true);
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSkillName.trim(),
          proficiencyLevel: newSkillProficiency,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Skill "${newSkillName}" added!`);
        setNewSkillName('');
        await fetchProfile();
        await refreshUser();
      } else {
        toast.error(json.error?.message || 'Failed to add skill');
      }
    } catch {
      toast.error('Failed to add skill');
    } finally {
      setIsAddingSkill(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error('Resume file exceeds the 5 MB limit. Please select a smaller PDF or DOCX file.');
      return;
    }

    setIsUploadingResume(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/profile/upload-resume', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Resume "${file.name}" uploaded successfully!`);
        await fetchProfile();
      } else {
        toast.error(json.error?.message || 'Resume upload failed');
      }
    } catch {
      toast.error('Network error uploading resume');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduSchool.trim() || !eduDegree.trim()) {
      toast.error('Please enter school and degree');
      return;
    }
    setIsAddingEdu(true);
    try {
      const res = await fetch('/api/profile/educations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution: eduSchool.trim(),
          degree: eduDegree.trim(),
          fieldOfStudy: eduField.trim() || undefined,
          startYear: eduStartYear ? parseInt(eduStartYear, 10) : undefined,
          endYear: eduEndYear ? parseInt(eduEndYear, 10) : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Education record added!');
        setShowAddEduModal(false);
        setEduSchool('');
        setEduDegree('');
        setEduField('');
        await fetchProfile();
      } else {
        toast.error(json.error?.message || 'Failed to add education');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsAddingEdu(false);
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/educations/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Education record removed');
        await fetchProfile();
      } else {
        toast.error(json.error?.message || 'Failed to delete education');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCompany.trim() || !expTitle.trim()) {
      toast.error('Please enter company and job title');
      return;
    }
    setIsAddingExp(true);
    try {
      const res = await fetch('/api/profile/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: expCompany.trim(),
          jobTitle: expTitle.trim(),
          location: expLocation.trim() || undefined,
          startDate: expStartDate.trim() || undefined,
          endDate: expEndDate.trim() || undefined,
          description: expDesc.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Experience record added!');
        setShowAddExpModal(false);
        setExpCompany('');
        setExpTitle('');
        setExpLocation('');
        setExpStartDate('');
        setExpEndDate('');
        setExpDesc('');
        await fetchProfile();
      } else {
        toast.error(json.error?.message || 'Failed to add experience');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsAddingExp(false);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/experiences/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Experience record removed');
        await fetchProfile();
      } else {
        toast.error(json.error?.message || 'Failed to delete experience');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const p = profileData || user;
  const userRole = user?.role || 'LEARNER';
  const userSkills = profileData?.skills || [];
  const resumeUrl = profileData?.profile?.resumeUrl;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Profile Card Header */}
        <Card className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <Avatar src={p?.avatarUrl} fallback={p?.name || 'User'} size="xl" />
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{p?.name}</h1>
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">
                    {userRole}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-700 mt-1">{p?.headline || `${userRole} Profile`}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {p?.location || 'Remote'}
                  </span>
                  {p?.profile?.targetRole && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">
                        Target Role: {p.profile.targetRole}
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
                onClick={() => setShowEditModal(true)}
                className="gap-1.5 text-xs bg-white font-semibold"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-900 mb-1">About</p>
            <p>{p?.bio || 'Building modern software solutions and advancing career skills with Growearn.'}</p>
          </div>
        </Card>

        {/* Education Section */}
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
              onClick={() => setShowAddEduModal(true)}
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
                    onClick={() => handleDeleteEducation(edu.id)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Skills Section */}
        <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-emerald-600" /> Skills & Competencies
              </h2>
              <p className="text-xs text-slate-500">Validated competencies for AI matching and recommendations.</p>
            </div>
          </div>

          <form onSubmit={handleAddSkill} className="flex flex-col sm:flex-row items-center gap-2 pt-1">
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
              userSkills.map((sk: any, idx: number) => {
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

        {/* Experience Section */}
        <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-emerald-600" /> Work History & Experience
              </h2>
              <p className="text-xs text-slate-500">Industry roles, internships, and project engagements.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAddExpModal(true)} className="gap-1 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" /> Add Experience
            </Button>
          </div>

          <div className="space-y-3">
            {experiences.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No experience records added yet.</p>
            ) : (
              experiences.map((exp) => (
                <div key={exp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">{exp.jobTitle}</h4>
                    <p className="text-xs text-emerald-700 font-semibold">
                      {exp.companyName} {exp.location ? `• ${exp.location}` : ''}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {exp.startDate || 'Started'} - {exp.endDate || (exp.isCurrentRole ? 'Present' : '')}
                    </p>
                    {exp.description && <p className="text-xs text-slate-600 mt-1">{exp.description}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteExperience(exp.id)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Resume Upload Section */}
        <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" /> Resume & CV Document
            </h2>
            <p className="text-xs text-slate-500">Upload your PDF/DOCX resume (max 5MB) for verified applications and review.</p>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-400 transition-colors bg-slate-50/50">
            <Upload className={`h-8 w-8 text-emerald-600 mx-auto mb-2 ${isUploadingResume ? 'animate-bounce' : ''}`} />
            <input
              type="file"
              id="resume-file-input"
              accept=".pdf,.docx,.doc"
              disabled={isUploadingResume}
              onChange={handleResumeUpload}
              className="hidden"
            />
            <label htmlFor="resume-file-input" className="cursor-pointer">
              <span className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                {isUploadingResume ? 'Uploading resume to secure storage...' : 'Click to select resume file from computer'}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Accepted formats: PDF, DOCX • File size limit: 5 MB</p>
            </label>
          </div>

          {resumeUrl && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-emerald-700" />
                <div>
                  <p className="text-xs font-bold text-slate-900">{resumeUrl.split('/').pop()}</p>
                  <p className="text-[10px] text-slate-500">Stored on server • Verified Profile Attachment</p>
                </div>
              </div>
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
              >
                <Download className="h-3.5 w-3.5" /> View / Download
              </a>
            </div>
          )}
        </Card>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Edit Profile Information</h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
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
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" type="submit" isLoading={isSaving} className="shadow-xs font-semibold">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Education Modal */}
        {showAddEduModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Add Academic Education</h3>
                <button onClick={() => setShowAddEduModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleAddEducation} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">School / University *</label>
                  <Input
                    placeholder="e.g. Stanford University"
                    value={eduSchool}
                    onChange={(e) => setEduSchool(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Degree *</label>
                  <Input
                    placeholder="e.g. Bachelor of Science in Computer Science"
                    value={eduDegree}
                    onChange={(e) => setEduDegree(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Field of Study</label>
                  <Input
                    placeholder="e.g. Software Engineering"
                    value={eduField}
                    onChange={(e) => setEduField(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Year</label>
                    <Input
                      type="number"
                      placeholder="2020"
                      value={eduStartYear}
                      onChange={(e) => setEduStartYear(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Year</label>
                    <Input
                      type="number"
                      placeholder="2024"
                      value={eduEndYear}
                      onChange={(e) => setEduEndYear(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddEduModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" type="submit" isLoading={isAddingEdu} className="font-semibold">
                    Add Education
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Experience Modal */}
        {showAddExpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Add Professional Experience</h3>
                <button onClick={() => setShowAddExpModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleAddExperience} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company / Organization *</label>
                  <Input
                    placeholder="e.g. NovaTech Solutions"
                    value={expCompany}
                    onChange={(e) => setExpCompany(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Title *</label>
                  <Input
                    placeholder="e.g. Full Stack Engineer"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <Input
                    placeholder="e.g. Remote / Bangalore"
                    value={expLocation}
                    onChange={(e) => setExpLocation(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                    <Input
                      placeholder="Jan 2023"
                      value={expStartDate}
                      onChange={(e) => setExpStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                    <Input
                      placeholder="Present"
                      value={expEndDate}
                      onChange={(e) => setExpEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Key responsibilities and accomplishments..."
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddExpModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" type="submit" isLoading={isAddingExp} className="font-semibold">
                    Save Experience
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
