import { AIAssistantService } from '../ai/ai-assistant.service';
import { AIService } from '../ai/ai-service';
import { SkillAnalysisService } from '../ai/skill-analysis.service';
import { CareerRoadmapService } from '../ai/roadmap.service';

async function runAITests() {
  console.log('==============================================');
  console.log('🚀 RUNNING GROEARN AI ASSISTANT TEST SUITE');
  console.log('==============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (detail) console.error(`   Details: ${detail}`);
      failed++;
    }
  }

  // 1. Test AIAssistantService General Questions
  console.log('--- 1. Testing AIAssistantService.answer (General Questions) ---');
  try {
    const q1 = await AIAssistantService.answer('What is a REST API?', null);
    assert(q1.intent === 'GENERAL_QUESTION', 'Classifies "What is a REST API?" as GENERAL_QUESTION');
    assert(Boolean(q1.directAnswer && q1.directAnswer.includes('REST')), 'Direct answer contains REST API explanation');
    assert(Array.isArray(q1.recommendedActions) && q1.recommendedActions.length > 0, 'Returns recommended action pills');
  } catch (err: any) {
    assert(false, 'AIAssistantService general question', err.message);
  }

  // 2. Test AIAssistantService Skill Analysis
  console.log('\n--- 2. Testing AIAssistantService.answer (Skill Gap Analysis) ---');
  try {
    const contextMock: any = {
      id: 'test-user',
      name: 'Alex Chen',
      email: 'alex@example.com',
      role: 'LEARNER',
      skills: ['React', 'TypeScript', 'Node.js'],
      hasSkills: true,
      profile: { targetRole: 'Full Stack AI Engineer', experienceLevel: 'Intermediate' },
    };
    const q2 = await AIAssistantService.answer('What should I learn next?', contextMock);
    assert(q2.intent === 'SKILL_ANALYSIS', 'Classifies "What should I learn next?" as SKILL_ANALYSIS');
    assert(q2.directAnswer.includes('React'), 'Answer is grounded in user skills');
  } catch (err: any) {
    assert(false, 'AIAssistantService skill analysis', err.message);
  }

  // 3. Test AIService.improveMessage
  console.log('\n--- 3. Testing AIService.improveMessage ---');
  try {
    const res = await AIService.improveMessage('hi can u tell me about this job', 'professional');
    assert(Boolean(res.improved && res.improved.length > 10), 'Returns polished message');
    assert(res.tone === 'professional', 'Tone is preserved');
  } catch (err: any) {
    assert(false, 'AIService improveMessage', err.message);
  }

  // 4. Test Career Roadmap Generation
  console.log('\n--- 4. Testing CareerRoadmapService.generate ---');
  try {
    const roadmap = CareerRoadmapService.generate(['React', 'TypeScript'], 'Frontend Engineer', 'Beginner');
    assert(Boolean(roadmap.targetRole === 'Frontend Engineer'), 'Target role matches input');
    assert(Array.isArray(roadmap.phases) && roadmap.phases.length > 0, 'Phases generated successfully');
  } catch (err: any) {
    assert(false, 'CareerRoadmapService generate', err.message);
  }

  // 5. Test Resume Skill Extractor
  console.log('\n--- 5. Testing AIService.extractResumeSkills ---');
  try {
    const extracted = await AIService.extractResumeSkills('Experienced with Java, Spring Boot, PostgreSQL, Docker, and React.');
    assert(extracted.detectedSkills.includes('Java'), 'Detects Java');
    assert(extracted.detectedSkills.includes('Spring Boot'), 'Detects Spring Boot');
    assert(extracted.detectedSkills.includes('PostgreSQL'), 'Detects PostgreSQL');
  } catch (err: any) {
    assert(false, 'Resume extraction', err.message);
  }

  console.log('\n==============================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==============================================\n');

  if (failed > 0) process.exit(1);
}

runAITests().catch((err) => {
  console.error('Fatal AI test error:', err);
  process.exit(1);
});
