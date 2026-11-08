export interface FreelancerJobUI {
  id: string;
  title: string;
  description: string;
  locationType?: string;
  city?: string;
  isLocal?: boolean;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  experienceLevel?: string;
  companyName?: string;
  company?: { name?: string };
  matchScore?: number;
  isPersonalized?: boolean;
  whyMatches?: string;
  skills?: Array<{ id?: string; name?: string; skill?: { name?: string } }>;
  [key: string]: unknown;
}

export interface CourseUI {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  level?: string;
  category?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  rating?: number;
  reviewsCount?: number;
  durationHours?: number;
  skillsCovered?: string;
  instructor?: { name?: string; headline?: string; avatarUrl?: string };
  modules?: Array<{
    id?: string;
    title: string;
    lessons?: Array<{ id?: string; title: string; durationMinutes?: number }>;
  }>;
  reviews?: Array<{
    id?: string;
    rating: number;
    comment: string;
    user?: { name?: string; avatarUrl?: string };
    createdAt?: string | Date;
  }>;
  [key: string]: unknown;
}

export interface MentorUI {
  id: string;
  name: string;
  title?: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  rating?: number;
  reviewsCount?: number;
  hourlyRate?: number;
  yearsExperience?: number;
  expertise?: string;
  studentsCount?: number;
  skills?: Array<{ id?: string; name?: string; skill?: { name?: string } } | string>;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    headline?: string;
    bio?: string;
  };
  experiences?: Array<{
    id?: string;
    title?: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
  }>;
  receivedReviews?: Array<{
    id?: string;
    rating?: number;
    comment?: string;
    createdAt?: string;
    author?: { name?: string; avatarUrl?: string };
  }>;
  [key: string]: unknown;
}

export interface JobUI {
  id: string;
  title: string;
  description?: string;
  companyName?: string;
  companyIndustry?: string;
  companySize?: string;
  company?: { name?: string };
  matchScore?: number;
  isPersonalized?: boolean;
  whyMatches?: string;
  currency?: string;
  matchedSkills?: string[];
  city?: string;
  location?: string;
  locationType?: string;
  jobType?: string;
  minSalary?: number;
  maxSalary?: number;
  skills?: Array<{ id?: string; name?: string; skill?: { id?: string; name?: string } }>;
  isLocal?: boolean;
  [key: string]: unknown;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  grade?: string;
}

export interface ExperienceItem {
  id: string;
  company?: string;
  companyName?: string;
  title?: string;
  jobTitle?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  isCurrentRole?: boolean;
  description?: string;
}

export interface UserProfileUI {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  skills?: Array<{ id?: string; name?: string; skill?: { name?: string }; proficiencyLevel?: string }>;
  profile?: {
    title?: string;
    bio?: string;
    hourlyRate?: number;
    careerGoal?: string;
    location?: string;
    portfolioUrl?: string;
    resumeUrl?: string;
    availability?: string;
    isDiscoverable?: boolean;
    candidateProfile?: {
      isDiscoverable?: boolean;
    };
  };
  [key: string]: unknown;
}

export interface ApplicantUI {
  id: string;
  name?: string;
  email?: string;
  headline?: string;
  bio?: string;
  skills?: Array<{ id?: string; name?: string; skill?: { id?: string; name?: string } }>;
  coverLetter?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface AgenticPhaseUI {
  phase_number?: number;
  duration_weeks?: number;
  title?: string;
  objective?: string;
  skills?: string[];
  topics?: string[];
  projects?: string[];
  milestone?: string;
  capstone_project?: string;
}

export interface AgenticTraceStepUI {
  agent?: string;
  action?: string;
  summary?: string;
}

export interface AgenticRoadmapDataUI {
  role?: string;
  target_role?: string;
  mode?: string;
  estimated_weeks?: number;
  review_status?: string;
  duration_weeks?: number;
  market_summary?: string;
  reviewer_notes?: string;
  phases?: AgenticPhaseUI[];
  agent_trace?: AgenticTraceStepUI[];
  [key: string]: unknown;
}

export interface RAGPhaseUI {
  phaseNumber?: number;
  durationWeeks?: number;
  title?: string;
  objective?: string;
  skills?: string[];
  topics?: string[];
  practiceTasks?: string[];
  projects?: string[];
  milestone?: string;
}

export interface RAGRoadmapDataUI {
  targetRole?: string;
  searchMode?: string;
  ragMetrics?: { searchMode?: string; [key: string]: unknown };
  roadmap?: {
    summary?: string;
    targetRole?: string;
    estimatedDurationWeeks?: number;
    currentLevel?: string;
    phases?: RAGPhaseUI[];
  };
  topCourses?: CourseUI[];
  topMentors?: MentorUI[];
  [key: string]: unknown;
}
