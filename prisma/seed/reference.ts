// Idempotent Production-Safe Reference Data Seed
// Contains strictly taxonomy, skills, roles, and static system configurations.
// Safe to run repeatedly in production environments. Zero mock users, zero mock ratings.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const REFERENCE_SKILLS = [
  { name: 'TypeScript', category: 'Frontend' },
  { name: 'React', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Vue.js', category: 'Frontend' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express.js', category: 'Backend' },
  { name: 'Java', category: 'Backend' },
  { name: 'Spring Boot', category: 'Backend' },
  { name: 'Python', category: 'Backend' },
  { name: 'Django', category: 'Backend' },
  { name: 'FastAPI', category: 'Backend' },
  { name: 'Go (Golang)', category: 'Backend' },
  { name: 'PostgreSQL', category: 'Database & Architecture' },
  { name: 'MongoDB', category: 'Database & Architecture' },
  { name: 'Redis', category: 'Database & Architecture' },
  { name: 'System Design', category: 'Database & Architecture' },
  { name: 'Docker', category: 'DevOps & Cloud' },
  { name: 'Kubernetes', category: 'DevOps & Cloud' },
  { name: 'AWS', category: 'DevOps & Cloud' },
  { name: 'Google Cloud Platform', category: 'DevOps & Cloud' },
  { name: 'CI/CD Pipelines', category: 'DevOps & Cloud' },
  { name: 'Machine Learning', category: 'AI / Machine Learning' },
  { name: 'Deep Learning', category: 'AI / Machine Learning' },
  { name: 'LLM Engineering', category: 'AI / Machine Learning' },
  { name: 'LangChain & RAG', category: 'AI / Machine Learning' },
  { name: 'React Native', category: 'Mobile Development' },
  { name: 'Flutter', category: 'Mobile Development' },
  { name: 'UI/UX Design (Figma)', category: 'UI/UX Design' },
  { name: 'GraphQL', category: 'Backend' },
];

export async function seedReferenceData() {
  console.log('📦 Seeding production reference data (skills taxonomy)...');
  for (const skill of REFERENCE_SKILLS) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: { category: skill.category },
      create: skill,
    });
  }
  console.log(`✅ Seeded ${REFERENCE_SKILLS.length} reference skills safely and idempotently.`);
}

if (require.main === module) {
  seedReferenceData()
    .catch((err) => {
      console.error('Failed seeding reference data:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
