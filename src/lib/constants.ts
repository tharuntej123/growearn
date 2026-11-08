export const ROLES = {
  LEARNER: 'LEARNER',
  FREELANCER: 'FREELANCER',
  MENTOR: 'MENTOR',
  COMPANY: 'COMPANY',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = 'LEARNER' | 'FREELANCER' | 'MENTOR' | 'COMPANY' | 'ADMIN';

export const ROLE_INFO: Record<
  UserRole,
  {
    title: string;
    description: string;
    badgeColor: string;
    defaultDashboard: string;
    icon: string;
  }
> = {
  LEARNER: {
    title: 'Learner',
    description: 'Learn in-demand skills, follow AI career roadmaps, complete courses, and connect with industry mentors.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    defaultDashboard: '/learner/dashboard',
    icon: 'GraduationCap',
  },
  MENTOR: {
    title: 'Expert Mentor',
    description: 'Share your industry expertise, conduct 1-on-1 coaching sessions, create courses, and earn revenue.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    defaultDashboard: '/mentor/dashboard',
    icon: 'Sparkles',
  },
  FREELANCER: {
    title: 'Verified Freelancer',
    description: 'Showcase your verified portfolio, discover project contracts, and submit AI-enhanced proposals.',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    defaultDashboard: '/freelancer/dashboard',
    icon: 'Briefcase',
  },
  COMPANY: {
    title: 'Company',
    description: 'Post full-time or contract roles, utilize AI candidate matching, and hire verified top-tier talent.',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    defaultDashboard: '/company/dashboard',
    icon: 'Building2',
  },
  ADMIN: {
    title: 'System Administrator',
    description: 'Platform oversight, moderation, analytics, and verification management.',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    defaultDashboard: '/admin/dashboard',
    icon: 'ShieldCheck',
  },
};

export const WORK_MODES = ['REMOTE', 'ONSITE', 'HYBRID'] as const;
export const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'] as const;
export const EXPERIENCE_LEVELS = ['ENTRY', 'MID', 'SENIOR', 'LEAD'] as const;
export const SKILL_CATEGORIES = [
  'Frontend',
  'Backend',
  'Full Stack',
  'AI / Machine Learning',
  'DevOps & Cloud',
  'Mobile Development',
  'Database & Architecture',
  'UI/UX Design',
  'Cybersecurity',
] as const;

export function isDemoEnvironment(): boolean {
  if (typeof process === 'undefined') return false;
  return (process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV) === 'demo';
}
