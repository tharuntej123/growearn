export const ROLES = {
  LEARNER: 'LEARNER',
  STUDENT: 'LEARNER',
  FREELANCER: 'FREELANCER',
  PROFESSIONAL: 'FREELANCER',
  MENTOR: 'MENTOR',
  COMPANY: 'COMPANY',
  EMPLOYER: 'COMPANY',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = 'LEARNER' | 'PROFESSIONAL' | 'MENTOR' | 'EMPLOYER' | 'ADMIN' | 'STUDENT' | 'FREELANCER' | 'COMPANY';

export const ROLE_INFO: Record<
  string,
  {
    title: string;
    description: string;
    badgeColor: string;
    defaultDashboard: string;
    icon: string;
  }
> = {
  LEARNER: {
    title: 'Learner / Student',
    description: 'Learn in-demand skills, follow AI career roadmaps, complete courses, and connect with industry mentors.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    defaultDashboard: '/learner/dashboard',
    icon: 'GraduationCap',
  },
  STUDENT: {
    title: 'Learner / Student',
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
  PROFESSIONAL: {
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
  EMPLOYER: {
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

export const DEMO_USERS = [
  {
    email: 'student@example.com',
    role: ROLES.LEARNER,
    name: 'Alex Chen',
    title: 'Aspiring Full Stack Engineer',
  },
  {
    email: 'priya.sharma@example.com',
    role: ROLES.MENTOR,
    name: 'Priya Sharma',
    title: 'Senior Backend Engineer @ NovaTech Solutions (8+ yrs)',
  },
  {
    email: 'professional@example.com',
    role: ROLES.FREELANCER,
    name: 'Pooja Verma',
    title: 'Senior Mobile & Full Stack Specialist',
  },
  {
    email: 'careers@novatech-solutions.io',
    role: ROLES.COMPANY,
    name: 'NovaTech Solutions',
    title: 'Enterprise Cloud & FinTech Platforms',
  },
];

export function isDemoMode(): boolean {
  if (typeof process === 'undefined') return false;
  return (
    process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
    process.env.DEMO_MODE === 'true'
  );
}

