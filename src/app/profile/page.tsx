'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import {
  FileText,
  Upload,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

import { EducationItem, ExperienceItem, UserProfileUI } from '@/types/ui';
import { EditProfileModal, AddEducationModal, AddExperienceModal } from '@/components/profile/profile-modals';
import { ProfileEducationSection, ProfileExperienceSection, ProfileHeaderCard, ProfileSkillsSection } from '@/components/profile/profile-sections';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileUI | null>(null);
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

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
        <DashboardSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <p className="text-slate-500 text-sm">Loading profile information...</p>
        </main>
      </div>
    );
  }

  const p = (profileData || user) as UserProfileUI | null;
  const userRole = user?.role || 'LEARNER';
  const userSkills = Array.isArray(profileData?.skills) ? profileData.skills : [];
  const resumeUrl = profileData?.profile?.resumeUrl;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Profile Card Header */}
        <ProfileHeaderCard
          profile={p}
          userRole={userRole}
          onEdit={() => setShowEditModal(true)}
        />

        {/* Education Section */}
        <ProfileEducationSection
          educations={educations}
          onAddEducation={() => setShowAddEduModal(true)}
          onDeleteEducation={handleDeleteEducation}
        />

        {/* Skills Section */}
        <ProfileSkillsSection
          userSkills={userSkills}
          newSkillName={newSkillName}
          setNewSkillName={setNewSkillName}
          newSkillProficiency={newSkillProficiency}
          setNewSkillProficiency={setNewSkillProficiency}
          onAddSkill={handleAddSkill}
          isAddingSkill={isAddingSkill}
        />

        {/* Experience Section */}
        <ProfileExperienceSection
          experiences={experiences}
          onAddExperience={() => setShowAddExpModal(true)}
          onDeleteExperience={handleDeleteExperience}
        />

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

        {/* Modals */}
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleSaveProfile}
          headline={headline}
          setHeadline={setHeadline}
          targetRole={targetRole}
          setTargetRole={setTargetRole}
          careerGoal={careerGoal}
          setCareerGoal={setCareerGoal}
          location={location}
          setLocation={setLocation}
          portfolioUrl={portfolioUrl}
          setPortfolioUrl={setPortfolioUrl}
          bio={bio}
          setBio={setBio}
          isSaving={isSaving}
        />

        <AddEducationModal
          isOpen={showAddEduModal}
          onClose={() => setShowAddEduModal(false)}
          onSubmit={handleAddEducation}
          school={eduSchool}
          setSchool={setEduSchool}
          degree={eduDegree}
          setDegree={setEduDegree}
          field={eduField}
          setField={setEduField}
          startYear={eduStartYear}
          setStartYear={setEduStartYear}
          endYear={eduEndYear}
          setEndYear={setEduEndYear}
          isAdding={isAddingEdu}
        />

        <AddExperienceModal
          isOpen={showAddExpModal}
          onClose={() => setShowAddExpModal(false)}
          onSubmit={handleAddExperience}
          company={expCompany}
          setCompany={setExpCompany}
          title={expTitle}
          setTitle={setExpTitle}
          location={expLocation}
          setLocation={setExpLocation}
          startDate={expStartDate}
          setStartDate={setExpStartDate}
          endDate={expEndDate}
          setEndDate={setExpEndDate}
          description={expDesc}
          setDescription={setExpDesc}
          isAdding={isAddingExp}
        />
      </main>
    </div>
  );
}
