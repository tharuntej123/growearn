import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { RAGSyncService } from '@/lib/ai/rag-sync.service';

export class UserRepository {
  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true,
        mentorProfile: true,
        skills: {
          include: { skill: true },
        },
      },
    });
  }

  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        mentorProfile: true,
        skills: {
          include: { skill: true },
        },
        experiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { startDate: 'desc' } },
        certifications: { orderBy: { issueDate: 'desc' } },
        projects: { orderBy: { createdAt: 'desc' } },
        achievements: { orderBy: { unlockedAt: 'desc' } },
        aiProfile: true,
        careerRoadmap: {
          include: { items: { orderBy: { orderIndex: 'asc' } } },
        },
      },
    });
  }

  static async create(data: {
    email: string;
    passwordHash: string;
    name: string;
    role: string;
  }) {
    const isMentor = data.role === 'MENTOR';
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role,
        profile: {
          create: {
            title: (data.role === 'STUDENT' || data.role === 'LEARNER') ? 'Learner / Student' : isMentor ? 'Expert Mentor' : (data.role === 'FREELANCER' || data.role === 'PROFESSIONAL') ? 'Verified Professional' : 'Organization Leader',
            availability: 'FULL_TIME',
            aiScore: 75,
          },
        },
        mentorProfile: isMentor
          ? {
              create: {
                bio: `${data.name} is an expert mentor available for guidance on GroEarn.`,
                expertise: 'Software Engineering, Web Development',
                hourlyRate: 50,
                yearsExperience: 5,
                title: 'Expert Mentor',
              },
            }
          : undefined,
      },
      include: {
        profile: true,
        mentorProfile: true,
      },
    });

    if (isMentor && user.mentorProfile) {
      RAGSyncService.triggerSyncMentor(user.mentorProfile.id);
    } else {
      RAGSyncService.triggerSyncCandidate(user.id);
    }

    return user;
  }

  static async updateRole(userId: string, role: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      include: { profile: true, mentorProfile: true },
    });

    if (role === 'MENTOR') {
      if (!user.mentorProfile) {
        const mp = await prisma.mentorProfile.create({
          data: {
            userId,
            bio: `${user.name} is an expert mentor on GroEarn.`,
            expertise: 'Software Engineering, Web Development',
            hourlyRate: 50,
            yearsExperience: 5,
            title: 'Expert Mentor',
          },
        });
        RAGSyncService.triggerSyncMentor(mp.id);
      } else {
        RAGSyncService.triggerSyncMentor(user.mentorProfile.id);
      }
    } else {
      RAGSyncService.triggerSyncCandidate(userId);
    }

    return user;
  }

  static async updateProfile(userId: string, data: Prisma.ProfileUpdateInput, userData?: Prisma.UserUpdateInput) {
    if (userData && Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userData,
      });
    }

    return prisma.profile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...((data as unknown) as Prisma.ProfileCreateWithoutUserInput),
      },
    });
  }

  static async addSkill(userId: string, skillName: string, proficiencyLevel = 'INTERMEDIATE') {
    const skill = await prisma.skill.upsert({
      where: { name: skillName.trim() },
      update: {},
      create: { name: skillName.trim() },
    });

    return prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId,
          skillId: skill.id,
        },
      },
      update: { proficiencyLevel },
      create: {
        userId,
        skillId: skill.id,
        proficiencyLevel,
      },
      include: { skill: true },
    });
  }

  static async removeSkill(userId: string, userSkillId: string) {
    return prisma.userSkill.delete({
      where: { id: userSkillId },
    });
  }

  static async getAllCandidates(params?: {
    skill?: string;
    location?: string;
    minExp?: number;
    search?: string;
  }) {
    const where: Prisma.UserWhereInput = {
      role: { in: ['PROFESSIONAL', 'FREELANCER', 'STUDENT', 'LEARNER', 'MENTOR'] },
    };

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search } },
        { headline: { contains: params.search } },
        { bio: { contains: params.search } },
      ];
    }

    if (params?.location) {
      where.location = { contains: params.location };
    }

    if (params?.skill) {
      where.skills = {
        some: {
          skill: {
            name: { contains: params.skill },
          },
        },
      };
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        role: true,
        headline: true,
        bio: true,
        location: true,
        city: true,
        state: true,
        country: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            title: true,
            hourlyRate: true,
            yearsOfExperience: true,
            availability: true,
            aiScore: true,
            careerGoal: true,
            experienceLevel: true,
            githubUrl: true,
            linkedinUrl: true,
            portfolioUrl: true,
            resumeUrl: true,
            resumeName: true,
          },
        },
        skills: {
          select: {
            id: true,
            proficiencyLevel: true,
            isVerified: true,
            skill: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        experiences: {
          select: {
            id: true,
            title: true,
            company: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
            description: true,
          },
        },
        receivedReviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
          },
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
  }
}
