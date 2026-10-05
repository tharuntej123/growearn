import { prisma } from '@/lib/prisma';
import { PRODUCTION_ROADMAPS_CATALOG } from '@/lib/ai/roadmaps-catalog';

let isRoadmapsSeededInMemory = false;

export class RoadmapRepository {
  /**
   * Seed / Ensure all 10 production roadmaps exist in PostgreSQL database.
   */
  static async ensureRoadmapsSeeded() {
    if (isRoadmapsSeededInMemory) return;

    const count = await prisma.careerRoadmap.count({ where: { userId: null } });
    if (count >= PRODUCTION_ROADMAPS_CATALOG.length) {
      isRoadmapsSeededInMemory = true;
      return;
    }

    for (const catalogItem of PRODUCTION_ROADMAPS_CATALOG) {
      const existing = await prisma.careerRoadmap.findUnique({
        where: { slug: catalogItem.slug },
      });

      if (!existing) {
        const roadmap = await prisma.careerRoadmap.create({
          data: {
            slug: catalogItem.slug,
            title: catalogItem.title,
            category: catalogItem.category,
            targetRole: catalogItem.targetRole,
            currentLevel: catalogItem.level,
            summary: catalogItem.summary,
            estimatedDurationWeeks: catalogItem.estimatedDurationWeeks,
            primarySkills: catalogItem.primarySkills.join(', '),
            finalMilestone: catalogItem.finalMilestone,
            phasesJson: JSON.stringify(catalogItem.phases),
          },
        });

        // Create roadmap items for each phase
        let order = 0;
        for (const phase of catalogItem.phases) {
          await prisma.roadmapItem.create({
            data: {
              roadmapId: roadmap.id,
              orderIndex: order++,
              phaseNumber: phase.phaseNumber,
              title: phase.title,
              description: phase.objective,
              milestoneType: 'SKILL',
              difficulty: phase.phaseNumber === 1 ? 'BEGINNER' : phase.phaseNumber === 2 ? 'INTERMEDIATE' : 'ADVANCED',
              estimatedHours: phase.durationWeeks * 10,
              skills: phase.skills.join(', '),
              recommendedCourses: phase.topics.slice(0, 3).join(', '),
            },
          });
        }
      }
    }
    isRoadmapsSeededInMemory = true;
  }

  /**
   * Find a database roadmap matching a skill query.
   */
  static async findRoadmapBySkill(skillQuery: string) {
    await this.ensureRoadmapsSeeded();

    const normalized = skillQuery.toLowerCase().trim();
    const words = normalized.split(/\s+/).filter(Boolean);

    const allRoadmaps = await prisma.careerRoadmap.findMany({
      where: { userId: null }, // Template catalog roadmaps
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    let bestRoadmap = allRoadmaps[0];
    let highestScore = -1;

    for (const r of allRoadmaps) {
      let score = 0;
      const titleLower = (r.title || '').toLowerCase();
      const roleLower = (r.targetRole || '').toLowerCase();
      const skillsLower = (r.primarySkills || '').toLowerCase();
      const slugLower = (r.slug || '').toLowerCase();

      if (titleLower.includes(normalized) || normalized.includes(titleLower)) score += 50;
      if (roleLower.includes(normalized) || normalized.includes(roleLower)) score += 40;
      if (skillsLower.includes(normalized)) score += 45;
      if (slugLower.includes(normalized)) score += 40;

      words.forEach((w) => {
        if (titleLower.includes(w)) score += 15;
        if (roleLower.includes(w)) score += 15;
        if (skillsLower.includes(w)) score += 20;
      });

      if (score > highestScore) {
        highestScore = score;
        bestRoadmap = r;
      }
    }

    return bestRoadmap;
  }

  /**
   * Get a roadmap by slug.
   */
  static async getRoadmapBySlug(slug: string) {
    await this.ensureRoadmapsSeeded();
    return prisma.careerRoadmap.findUnique({
      where: { slug },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  /**
   * Get or create a personalized roadmap for a user.
   */
  static async getUserRoadmap(userId: string) {
    return prisma.careerRoadmap.findUnique({
      where: { userId },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }
}
