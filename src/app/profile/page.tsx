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
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [hourlyRate, setHourlyRate] = useState<number>(65);
  const [isSaving, setIsSaving] = useState(false);

  // Add Skill State
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('INTERMEDIATE');
  const [isAddingSkill, setIsAddingSkill] = useState(false);

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
        setExperienceLevel(u.profile?.experienceLevel || 'Beginner');
        setHourlyRate(u.profile?.hourlyRate || 65);
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
          experienceLevel,
          hourlyRate: Number(hourlyRate),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Profile and career goals updated!');
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

  const p = profileData || user;
  const userSkills = profileData?.skills || user?.skills?.map((s: any) => s.skill?.name || s.name) || [];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Profile Header Card */}
        <Card className="bg-white border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <Avatar src={p?.avatarUrl} fallback={p?.name || 'User'} size="xl" />
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{p?.name}</h1>
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200">{p?.role}</Badge>
                </div>
                <p className="text-sm font-medium text-slate-700 mt-1">{p?.headline || 'Groearn Member'}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {p?.location || 'Remote'}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">
                    ${p?.profile?.hourlyRate || 65}/hr
                  </span>
                  <span>•</span>
                  <span className="text-slate-700 font-semibold">
                    Target: {p?.profile?.targetRole || 'Software Engineer'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href="/onboarding">
                <Button variant="default" size="sm" className="gap-1 text-xs shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" /> Re-calibrate AI
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)} className="gap-1.5 text-xs bg-white">
                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-900 mb-1">About</p>
            <p>{p?.bio || 'No bio provided yet. Add an about section to introduce yourself to clients and mentors.'}</p>
          </div>
        </Card>

        {/* Skills Section */}
        <Card className="bg-white border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Verified Technical Skills ({userSkills.length})</h2>
              <p className="text-xs text-slate-500">Grounded competencies used by our AI matching engine (Only skills you entered)</p>
            </div>
          </div>

          {/* Add Skill Form */}
          <form onSubmit={handleAddSkill} className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <Input
              placeholder="Add skill (e.g. Next.js, Docker, Java, PostgreSQL, PyTorch)..."
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="flex-1 bg-white"
            />
            <select
              value={newSkillProficiency}
              onChange={(e) => setNewSkillProficiency(e.target.value)}
              aria-label="Skill Proficiency Level"
              className="bg-white border border-slate-300 text-xs text-slate-800 rounded-lg h-10 px-3 shadow-sm"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>
            <Button type="submit" variant="default" size="sm" isLoading={isAddingSkill} className="h-10 shrink-0 gap-1 shadow-sm">
              <Plus className="h-4 w-4" /> Add Skill
            </Button>
          </form>

          {/* Skills Badges Grid */}
          <div className="flex flex-wrap gap-2 pt-3">
            {userSkills.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No skills recorded yet. Add your first skill above or open onboarding.</p>
            ) : (
              userSkills.map((sk: any, idx: number) => {
                const name = typeof sk === 'string' ? sk : sk.skill?.name || sk.name;
                const level = typeof sk === 'object' ? sk.proficiencyLevel : 'VERIFIED';
                return (
                  <div
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2"
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

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Edit Profile & Career Goals</h3>
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
                    <label className="block font-semibold text-slate-700 mb-1">Hourly Rate ($)</label>
                    <Input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" type="submit" isLoading={isSaving} className="shadow-sm">
                    Save Changes
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
