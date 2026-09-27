import { SkillRAGService } from '../ai/skill-rag.service';
import { prisma } from '../prisma';

async function testJavaRAG() {
  const res = await SkillRAGService.querySkillRAG('Java');
  console.log('====================================================');
  console.log('ROADMAP TARGET ROLE:', res.roadmap.targetRole);
  console.log('SUMMARY:', res.roadmap.summary);
  console.log('\nPHASES (Basic to Advanced):');
  res.roadmap.phases.forEach((p) => {
    console.log(`  [Phase ${p.phaseNumber}] ${p.title}`);
    console.log(`    Objective: ${p.objective}`);
    console.log(`    Topics: ${p.topics.join(', ')}`);
    console.log(`    Practice: ${p.practiceTasks.join(' | ')}`);
    console.log(`    Project: ${p.projects.join(', ')}`);
    console.log(`    Milestone: ${p.milestone}\n`);
  });

  console.log('TOP 5 COURSES (Sorted Beginner -> Intermediate -> Advanced):');
  res.topCourses.forEach((c, idx) => {
    console.log(`  [${idx + 1}] [${c.level}] ${c.title} (Score: ${c.matchScore}%, Rating: ${c.rating}⭐, Price: $${c.price})`);
  });

  console.log('\nTOP 5 MENTORS:');
  res.topMentors.forEach((m, idx) => {
    console.log(`  [${idx + 1}] ${m.name} (${m.headline}) - Rate: $${m.hourlyRate}/hr, Rating: ${m.rating}⭐, Students: ${m.studentsCount}`);
  });
  console.log('====================================================');
  await prisma.$disconnect();
}

testJavaRAG().catch((err) => {
  console.error(err);
  process.exit(1);
});
