import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface JobFilterParams {
  query?: string;
  skill?: string;
  country?: string;
  state?: string;
  city?: string;
  locationType?: string;
  jobType?: string;
  experienceLevel?: string;
  isLocal?: boolean;
  minSalary?: number;
  companyId?: string;
}

// JobProvider abstraction to allow plugging in external job APIs in the future
export interface IJobProvider {
  getJobs(filters: JobFilterParams): Promise<unknown[]>;
  getJobById(id: string): Promise<unknown | null>;
}

export class JobRepository implements IJobProvider {
  async getJobs(filters: JobFilterParams) {
    const where: Prisma.JobWhereInput = {
      status: 'OPEN',
    };

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query } },
        { description: { contains: filters.query } },
      ];
    }

    if (filters.locationType) {
      where.locationType = filters.locationType;
    }

    if (filters.jobType) {
      where.jobType = filters.jobType;
    }

    if (filters.experienceLevel) {
      where.experienceLevel = filters.experienceLevel;
    }

    if (filters.isLocal !== undefined) {
      where.isLocal = filters.isLocal;
    }

    if (filters.country) {
      where.country = { contains: filters.country };
    }

    if (filters.state) {
      where.state = { contains: filters.state };
    }

    if (filters.city) {
      where.city = { contains: filters.city };
    }

    if (filters.minSalary) {
      where.maxSalary = { gte: filters.minSalary };
    }

    if (filters.skill) {
      where.skills = {
        some: {
          skill: {
            name: { contains: filters.skill },
          },
        },
      };
    }

    return prisma.job.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            location: true,
            profile: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
        _count: {
          select: {
            applications: true,
            proposals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJobById(id: string) {
    return prisma.job.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            profile: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
        applications: {
          include: {
            applicant: {
              include: {
                profile: true,
                skills: { include: { skill: true } },
              },
            },
          },
        },
        proposals: {
          include: {
            professional: {
              include: {
                profile: true,
                skills: { include: { skill: true } },
              },
            },
          },
        },
      },
    });
  }

  static async createJob(companyId: string, data: {
    title: string;
    description: string;
    country?: string;
    state?: string;
    city?: string;
    locationType: string;
    jobType: string;
    minSalary: number;
    maxSalary: number;
    currency: string;
    experienceLevel: string;
    isLocal: boolean;
    deadline?: Date;
    skillNames: string[];
  }) {
    // Upsert skills and build job creation
    return prisma.job.create({
      data: {
        companyId,
        title: data.title,
        description: data.description,
        country: data.country || 'India',
        state: data.state || 'Tamil Nadu',
        city: data.city || 'Chennai',
        locationType: data.locationType,
        jobType: data.jobType,
        minSalary: data.minSalary,
        maxSalary: data.maxSalary,
        currency: data.currency,
        experienceLevel: data.experienceLevel,
        isLocal: data.isLocal,
        deadline: data.deadline,
        skills: {
          create: await Promise.all(
            data.skillNames.map(async (name) => {
              const skill = await prisma.skill.upsert({
                where: { name: name.trim() },
                update: {},
                create: { name: name.trim() },
              });
              return {
                skillId: skill.id,
                isRequired: true,
              };
            })
          ),
        },
      },
      include: {
        skills: { include: { skill: true } },
      },
    });
  }

  static async applyForJob(jobId: string, applicantId: string, data: {
    coverLetter?: string;
    resumeUrl?: string;
    matchScore: number;
    matchExplanation?: string;
  }) {
    return prisma.application.upsert({
      where: {
        jobId_applicantId: {
          jobId,
          applicantId,
        },
      },
      update: {
        coverLetter: data.coverLetter,
        resumeUrl: data.resumeUrl,
        matchScore: data.matchScore,
        matchExplanation: data.matchExplanation,
        status: 'APPLIED',
      },
      create: {
        jobId,
        applicantId,
        coverLetter: data.coverLetter,
        resumeUrl: data.resumeUrl,
        matchScore: data.matchScore,
        matchExplanation: data.matchExplanation,
        status: 'APPLIED',
      },
    });
  }

  static async createProposal(jobId: string, professionalId: string, data: {
    coverLetter: string;
    proposedRate: number;
    estimatedDays: number;
    milestonesJson?: string;
  }) {
    return prisma.proposal.upsert({
      where: {
        jobId_professionalId: {
          jobId,
          professionalId,
        },
      },
      update: {
        coverLetter: data.coverLetter,
        proposedRate: data.proposedRate,
        estimatedDays: data.estimatedDays,
        milestonesJson: data.milestonesJson,
      },
      create: {
        jobId,
        professionalId,
        coverLetter: data.coverLetter,
        proposedRate: data.proposedRate,
        estimatedDays: data.estimatedDays,
        milestonesJson: data.milestonesJson,
      },
    });
  }

  static async updateApplicationStatus(applicationId: string, status: string) {
    return prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });
  }
}
