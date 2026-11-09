import { prisma } from '@/lib/prisma';

export interface ApplicantFilterOptions {
  jobId: string;
}

export class JobApplicationService {
  static async getApplicationsForJob(jobId: string) {
    return prisma.application.findMany({
      where: { jobId },
      select: {
        id: true,
        jobId: true,
        applicantId: true,
        status: true,
        coverLetter: true,
        resumeUrl: true,
        matchScore: true,
        matchExplanation: true,
        appliedAt: true,
        updatedAt: true,
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            headline: true,
            location: true,
            city: true,
            state: true,
            country: true,
            isVerified: true,
            profile: {
              select: {
                id: true,
                title: true,
                portfolioUrl: true,
                githubUrl: true,
                linkedinUrl: true,
                yearsOfExperience: true,
                availability: true,
                aiScore: true,
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
              orderBy: { startDate: 'desc' },
            },
            educations: {
              select: {
                id: true,
                degree: true,
                school: true,
                startDate: true,
                endDate: true,
                fieldOfStudy: true,
              },
            },
          },
        },
      },
      orderBy: [{ matchScore: 'desc' }, { appliedAt: 'desc' }],
    });
  }

  static async updateStatus(applicationId: string, status: string, targetApplicantId: string, jobTitle: string) {
    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });

    await prisma.notification.create({
      data: {
        userId: targetApplicantId,
        title: `Application Status Update: ${status}`,
        message: `Your application for "${jobTitle}" has been updated to "${status}".`,
        link: '/freelancer/applications',
        notificationType: 'JOB_APPLICATION',
      },
    }).catch(() => {});

    return updated;
  }
}
