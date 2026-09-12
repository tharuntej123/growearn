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
} from 'lucide-react';
import { toast } from 'sonner';

interface EducationItem {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  year?: string;
}

interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  duration?: string;
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

  const [resumeFile, setResumeFile] = useState<{ name: string; size: string; url?: string } | null>({
    name: 'Alex_Chen_Resume_2026.pdf',
    size: '480 KB',
  });

  const [educations, setEducations] = useState<EducationItem[]>([
    {
      id: 'edu-1',
      school: 'Anna University / Tech Institute',
      degree: 'Bachelor of Technology (B.Tech)',
      fieldOfStudy: 'Computer Science & Engineering',
      year: '2022 - 2026',
    },
  ]);
  const [showAddEduModal, setShowAddEduModal] = useState(false);
  const [eduSchool, setEduSchool] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduField, setEduField] = useState('');
  const [eduYear, setEduYear] = useState('');

  const [experiences, setExperiences] = useState<ExperienceItem[]>([
    {
      id: 'exp-1',
      company: 'TechCraft Solutions',
      title: 'Full Stack & Cloud Developer Intern',
      duration: '2024 - 2025',
      description: 'Engineered REST APIs with Next.js and PostgreSQL. Implemented JWT authentication and microservice workflows.',
    },
  ]);
  const [showAddExpModal, setShowAddExpModal] = useState(false);
  const [expCompany, setExpCompany] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expDuration, setExpDuration] = useState('');
  const [expDesc, setExpDesc] = useState('');

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
        setHourlyRate(u.profile?.hourlyRate || 65);
        setCompanyName(u.profile?.companyName || u.name || '');
        setCompanyWebsite(u.profile?.companyWebsite || 'https://example.com');
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
        toast.success(`Skill "${newSkillName}" added and verified!`);
        setNewSkillName('');
        await fetchProfile();
        await refreshUser();
      }
    } catch {
      toast.error('Failed to add skill');
    } finally {
      setIsAddingSkill(false);
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 1 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error('Resume file exceeds the 1 MB limit. Please select a smaller PDF or DOCX file.');
      return;
    }

    const kbSize = (file.size / 1024).toFixed(0);
    const objectUrl = URL.createObjectURL(file);
    setResumeFile({
      name: file.name,
      size: `${kbSize} KB`,
      url: objectUrl,
    });
    toast.success(`✅ Resume "${file.name}" (${kbSize} KB) uploaded successfully!`);
  };

  const handleAddEducation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduSchool.trim() || !eduDegree.trim()) {
      toast.error('Please enter school and degree');
      return;
    }
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      school: eduSchool.trim(),
      degree: eduDegree.trim(),
      fieldOfStudy: eduField.trim() || 'Computer Science',
      year: eduYear.trim() || '2022 - 2026',
    };
    setEducations([...educations, newEdu]);
    toast.success('Education entry added!');
    setShowAddEduModal(false);
    setEduSchool('');
    setEduDegree('');
    setEduField('');
    setEduYear('');
  };

  const handleAddExperience = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCompany.trim() || !expTitle.trim()) {
      toast.error('Please enter company and job title');
      return;
    }
    const newExp: ExperienceItem = {
      id: `exp-${Date.now()}`,
      company: expCompany.trim(),
      title: expTitle.trim(),
      duration: expDuration.trim() || 'Present',
      description: expDesc.trim(),
    };
    setExperiences([...experiences, newExp]);
    toast.success('Experience record added!');
    setShowAddExpModal(false);
    setExpCompany('');
    setExpTitle('');
    setExpDuration('');
    setExpDesc('');
  };

  const p = profileData || user;
  const userRole = user?.role || 'LEARNER';
  const userSkills = profileData?.skills || user?.skills?.map((s: any) => s.skill?.name || s.name) || [];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        <Card className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <Avatar src={p?.avatarUrl} fallback={p?.name || 'User'} size="xl" />
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{p?.name}</h1>
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">
                    {userRole === 'EMPLOYER' ? 'COMPANY' : userRole}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-700 mt-1">{p?.headline || `${userRole} Profile`}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {p?.location || 'Chennai, India'}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">
                    Target Role: {p?.profile?.targetRole || 'Full Stack Developer'}
                  </span>
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
            <p>{p?.bio || 'Building modern software solutions and mastering full-stack engineering principles with Groearn.'}</p>
          </div>
        </Card>

        {(userRole === 'LEARNER' || (userRole as string) === 'STUDENT') && (
          <div className="space-y-6">
            <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-emerald-600" /> 1. Education
                  </h2>
                  <p className="text-xs text-slate-500">Your academic institutions, degrees, and graduation years.</p>
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
                {educations.map((edu) => (
                  <div key={edu.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{edu.school}</h4>
                      <p className="text-xs text-emerald-700 font-semibold">{edu.degree} in {edu.fieldOfStudy}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{edu.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-emerald-600" /> 2. Skills Learned (&ldquo;What I Learn&rdquo;)
                  </h2>
                  <p className="text-xs text-slate-500">Grounded competencies you have learned and validated with AI roadmaps.</p>
                </div>
              </div>

              <form onSubmit={handleAddSkill} className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <Input
                  placeholder="Add skill (e.g. Next.js, Docker, Java, PostgreSQL, PyTorch)..."
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="flex-1 bg-white"
                />
                <select
                  value={newSkillProficiency}
                  onChange={(e) => setNewSkillProficiency(e.target.value)}
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
                    const name = typeof sk === 'string' ? sk : sk.skill?.name || sk.name;
                    const level = typeof sk === 'object' ? sk.proficiencyLevel : 'INTERMEDIATE';
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

            <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" /> 3. Student Resume Upload (Max 1 MB)
                </h2>
                <p className="text-xs text-slate-500">Upload your latest PDF/DOCX resume for verified job matching and mentor reviews.</p>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-400 transition-colors bg-slate-50/50">
                <Upload className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <input
                  type="file"
                  id="learner-resume-input"
                  accept=".pdf,.docx,.doc"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
                <label htmlFor="learner-resume-input" className="cursor-pointer">
                  <span className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                    Click to select resume file from computer
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Accepted formats: PDF, DOCX • File size limit: 1 MB</p>
                </label>
              </div>

              {resumeFile && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-emerald-700" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{resumeFile.name}</p>
                      <p className="text-[10px] text-slate-500">{resumeFile.size} • Verified Resume</p>
                    </div>
                  </div>
                  {resumeFile.url && (
                    <a
                      href={resumeFile.url}
                      download={resumeFile.name}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {userRole === 'MENTOR' && (
          <div className="space-y-6">
            <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-600" /> Mentor Portfolio & Coaching Bio
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block mb-1">Portfolio Link:</span>
                  <a href={portfolioUrl || 'https://github.com'} target="_blank" rel="noreferrer" className="font-bold text-emerald-700 hover:underline flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" /> {portfolioUrl || 'https://github.com/mentor-portfolio'}
                  </a>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block mb-1">Hourly Coaching Benchmark:</span>
                  <span className="font-extrabold text-slate-900 text-sm">${hourlyRate}/hr</span>
                </div>
              </div>
            </Card>

            <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-emerald-600" /> Academic & Degrees
                </h2>
                <Button size="sm" variant="outline" onClick={() => setShowAddEduModal(true)} className="gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              <div className="space-y-3">
                {educations.map((edu) => (
                  <div key={edu.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-900">{edu.school}</h4>
                    <p className="text-xs text-emerald-700 font-semibold">{edu.degree} • {edu.fieldOfStudy}</p>
                    <p className="text-[11px] text-slate-400">{edu.year}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-emerald-600" /> Mentorship Expertise & Tech Stacks
              </h2>
              <div className="flex flex-wrap gap-2">
                {userSkills.map((sk: any, idx: number) => {
                  const name = typeof sk === 'string' ? sk : sk.skill?.name || sk.name;
                  return (
                    <span key={idx} className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                      ✓ {name}
                    </span>
                  );
                })}
              </div>
            </Card>

            <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-emerald-600" /> Industry & Teaching Experience
                </h2>
                <Button size="sm" variant="outline" onClick={() => setShowAddExpModal(true)} className="gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Experience
                </Button>
              </div>
              <div className="space-y-3">
                {experiences.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">{exp.title}</h4>
                    <p className="text-xs text-emerald-700 font-semibold">{exp.company} • {exp.duration}</p>
                    {exp.description && <p className="text-xs text-slate-600">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {(userRole === 'PROFESSIONAL' || (userRole as string) === 'FREELANCER') && (
          <div className="space-y-6">
            <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-emerald-600" /> Education
                </h2>
                <Button size="sm" variant="outline" onClick={() => setShowAddEduModal(true)} className="gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Education
                </Button>
              </div>
              <div className="space-y-3">
                {educations.map((edu) => (
                  <div key={edu.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-900">{edu.school}</h4>
                    <p className="text-xs text-emerald-700 font-semibold">{edu.degree} in {edu.fieldOfStudy}</p>
                    <p className="text-[11px] text-slate-400">{edu.year}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-emerald-600" /> Verified Engineering Skills
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {userSkills.map((sk: any, idx: number) => {
                  const name = typeof sk === 'string' ? sk : sk.skill?.name || sk.name;
                  return (
                    <span key={idx} className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                      ✓ {name}
                    </span>
                  );
                })}
              </div>
            </Card>

            <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" /> Professional Resume Upload (Max 1 MB)
              </h2>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-400 transition-colors bg-slate-50/50">
                <Upload className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <input
                  type="file"
                  id="pro-resume-input"
                  accept=".pdf,.docx,.doc"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
                <label htmlFor="pro-resume-input" className="cursor-pointer">
                  <span className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                    Click to select resume file from computer
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Accepted formats: PDF, DOCX • File size limit: 1 MB</p>
                </label>
              </div>

              {resumeFile && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-emerald-700" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{resumeFile.name}</p>
                      <p className="text-[10px] text-slate-500">{resumeFile.size}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-emerald-600" /> Work History & Contracting Experience
                </h2>
                <Button size="sm" variant="outline" onClick={() => setShowAddExpModal(true)} className="gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Experience
                </Button>
              </div>
              <div className="space-y-3">
                {experiences.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">{exp.title}</h4>
                    <p className="text-xs text-emerald-700 font-semibold">{exp.company} • {exp.duration}</p>
                    {exp.description && <p className="text-xs text-slate-600">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {(userRole === 'EMPLOYER' || (userRole as string) === 'COMPANY') && (
          <div className="space-y-6">
            <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" /> Company Information & Headquarters
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block mb-1">Company Entity:</span>
                  <span className="font-bold text-slate-900">{companyName || p?.name}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block mb-1">Official Website:</span>
                  <a href={companyWebsite || '#'} target="_blank" rel="noreferrer" className="font-bold text-emerald-700 hover:underline">
                    {companyWebsite || 'https://company.example.com'}
                  </a>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block mb-1">Headquarters:</span>
                  <span className="font-bold text-slate-900">{p?.location || 'Chennai, India'}</span>
                </div>
              </div>
            </Card>

            <Card className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-emerald-600" /> Active Job Postings
                </h2>
                <Link href="/company/dashboard">
                  <Button size="sm" variant="default" className="gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Post New Role
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Senior Next.js & Full Stack Engineer</h4>
                    <p className="text-xs text-emerald-700 font-semibold">$35,000 - $55,000 • Hybrid</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">8 candidates applied</p>
                  </div>
                  <Badge variant="success">ACTIVE</Badge>
                </div>
              </div>
            </Card>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Edit Profile Information</h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Headline</label>
                  <Input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Full Stack & AI Specialist"
                    className="bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Role</label>
                    <Input
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Backend Developer"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Career Goal</label>
                    <Input
                      value={careerGoal}
                      onChange={(e) => setCareerGoal(e.target.value)}
                      placeholder="e.g. Find High-Paying Job"
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
                      placeholder="e.g. Chennai, Tamil Nadu"
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

        {showAddEduModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Add Academic Education</h3>
                <button onClick={() => setShowAddEduModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleAddEducation} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">School / University *</label>
                  <Input
                    placeholder="e.g. Anna University"
                    value={eduSchool}
                    onChange={(e) => setEduSchool(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Degree *</label>
                  <Input
                    placeholder="e.g. Bachelor of Technology (B.Tech)"
                    value={eduDegree}
                    onChange={(e) => setEduDegree(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Field of Study</label>
                  <Input
                    placeholder="e.g. Computer Science & Engineering"
                    value={eduField}
                    onChange={(e) => setEduField(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Years Attended</label>
                  <Input
                    placeholder="e.g. 2022 - 2026"
                    value={eduYear}
                    onChange={(e) => setEduYear(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddEduModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" type="submit" className="font-semibold">
                    Add Education
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddExpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Add Professional Experience</h3>
                <button onClick={() => setShowAddExpModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleAddExperience} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company / Organization *</label>
                  <Input
                    placeholder="e.g. TechCorp Solutions"
                    value={expCompany}
                    onChange={(e) => setExpCompany(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Title *</label>
                  <Input
                    placeholder="e.g. Full Stack Developer"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration</label>
                  <Input
                    placeholder="e.g. 2023 - Present"
                    value={expDuration}
                    onChange={(e) => setExpDuration(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe your key responsibilities and technologies used..."
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddExpModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" type="submit" className="font-semibold">
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
