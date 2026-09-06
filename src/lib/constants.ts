export const ROLES = {
  LEARNER: 'LEARNER',
  STUDENT: 'LEARNER', // alias
  PROFESSIONAL: 'PROFESSIONAL',
  FREELANCER: 'PROFESSIONAL', // alias
  MENTOR: 'MENTOR',
  EMPLOYER: 'EMPLOYER',
  COMPANY: 'EMPLOYER', // alias
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
    defaultDashboard: '/student/dashboard',
    icon: 'GraduationCap',
  },
  STUDENT: {
    title: 'Learner / Student',
    description: 'Learn in-demand skills, follow AI career roadmaps, complete courses, and connect with industry mentors.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    defaultDashboard: '/student/dashboard',
    icon: 'GraduationCap',
  },
  MENTOR: {
    title: 'Expert Mentor',
    description: 'Share your industry expertise, conduct 1-on-1 coaching sessions, create courses, and earn revenue.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    defaultDashboard: '/mentor/dashboard',
    icon: 'Sparkles',
  },
  PROFESSIONAL: {
    title: 'Verified Professional',
    description: 'Showcase your verified portfolio, discover project contracts, and submit AI-enhanced proposals.',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    defaultDashboard: '/professional/dashboard',
    icon: 'Briefcase',
  },
  FREELANCER: {
    title: 'Verified Professional',
    description: 'Showcase your verified portfolio, discover project contracts, and submit AI-enhanced proposals.',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    defaultDashboard: '/professional/dashboard',
    icon: 'Briefcase',
  },
  EMPLOYER: {
    title: 'Company',
    description: 'Post full-time or contract roles, utilize AI candidate matching, and hire verified top-tier talent.',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    defaultDashboard: '/company/dashboard',
    icon: 'Building2',
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

export const DEMO_USERS = [
  {
    email: 'student@example.com',
    role: ROLES.LEARNER,
    name: 'Alex Chen',
    title: 'Aspiring Full Stack Engineer',
  },
  {
    email: 'mentor@example.com',
    role: ROLES.MENTOR,
    name: 'Dr. Marcus Vance',
    title: 'Principal Distributed Systems Architect (10+ yrs)',
  },
  {
    email: 'professional@example.com',
    role: ROLES.PROFESSIONAL,
    name: 'Elena Rostova',
    title: 'Senior Next.js & AI Application Specialist',
  },
  {
    email: 'company@example.com',
    role: ROLES.EMPLOYER,
    name: 'TechCorp Dynamics Inc.',
    title: 'Hiring Manager & Engineering Director',
  },
];
