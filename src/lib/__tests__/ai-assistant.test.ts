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

  console.log('--- 1. Testing AIAssistantService.answer (Technical Q&A) ---');
  try {
    const q1 = await AIAssistantService.answer('What is a REST API?', null);
    assert(q1.intent === 'GENERAL_QUESTION', 'Classifies "What is a REST API?" as GENERAL_QUESTION');
    assert(Boolean(q1.directAnswer && (q1.directAnswer.includes('REST') || q1.directAnswer.includes('API'))), 'Direct answer contains REST API explanation');
    assert(Boolean(q1.directAnswer.toLowerCase().includes('http') || q1.directAnswer.toLowerCase().includes('get') || q1.directAnswer.toLowerCase().includes('endpoint')), 'Contains HTTP / API methods breakdown');

    const qJava = await AIAssistantService.answer('What is polymorphism in Java?', null);
    assert(Boolean(qJava.directAnswer.toLowerCase().includes('polymorphism') && (qJava.directAnswer.toLowerCase().includes('java') || qJava.directAnswer.toLowerCase().includes('method') || qJava.directAnswer.toLowerCase().includes('overriding') || qJava.directAnswer.toLowerCase().includes('overload'))), 'Direct answer contains Java Polymorphism explanation');
  } catch (err: any) {
    assert(false, 'AIAssistantService general question', err.message);
  }

  console.log('\n--- 2. Testing AIAssistantService.answer (Roadmap Flow) ---');
  try {
    const userContext: any = {
      id: 'test-user',
      name: 'Alex Chen',
      email: 'alex@example.com',
      role: 'LEARNER',
      skills: ['Java', 'SQL'],
      profile: { targetRole: 'Backend Developer', experienceLevel: 'Intermediate' },
    };

    const qRoadmap = await AIAssistantService.answer('Give me a roadmap for Backend Developer', userContext);
    assert(qRoadmap.intent === 'ROADMAP', 'Classifies "Give me a roadmap for Backend Developer" as ROADMAP');
    assert(qRoadmap.directAnswer.includes('Phase 1'), 'Contains Phase 1 breakdown');
    assert(qRoadmap.directAnswer.includes('Phase 2'), 'Contains Phase 2 breakdown');
    assert(qRoadmap.directAnswer.includes('Phase 3'), 'Contains Phase 3 breakdown');
    assert(qRoadmap.directAnswer.includes('Phase 4'), 'Contains Phase 4 breakdown');
    assert(qRoadmap.directAnswer.includes('┌───'), 'Contains visual ASCII learning flow diagram');
    assert(qRoadmap.directAnswer.includes('Milestone Project'), 'Contains milestone projects');

    const qClick = await AIAssistantService.answer('View Career Roadmap', userContext);
    assert(qClick.intent === 'ROADMAP', 'Classifies "View Career Roadmap" as ROADMAP');
    assert(qClick.directAnswer.includes('Step-by-Step Learning & Career Roadmap'), 'Delivers full roadmap directly without looping');
  } catch (err: any) {
    assert(false, 'AIAssistantService roadmap generation', err.message);
  }

  console.log('\n--- 3. Testing AIAssistantService.answer (Skill Gap Analysis) ---');
  try {
    const contextMock: any = {
      id: 'test-user',
      name: 'Alex Chen',
      email: 'alex@example.com',
      role: 'LEARNER',
      skills: ['React', 'TypeScript', 'Node.js'],
      hasSkills: true,
      profile: { targetRole: 'Full Stack Engineer', experienceLevel: 'Intermediate' },
    };
    const q2 = await AIAssistantService.answer('What should I learn next?', contextMock);
    assert(q2.intent === 'SKILL_ANALYSIS', 'Classifies "What should I learn next?" as SKILL_ANALYSIS');
    assert(q2.directAnswer.includes('React'), 'Answer is grounded in user skills');
  } catch (err: any) {
    assert(false, 'AIAssistantService skill analysis', err.message);
  }

  console.log('\n--- 4. Testing AIService.improveMessage ---');
  try {
    const res = await AIService.improveMessage('hi can u tell me about this job', 'professional');
    assert(Boolean(res.improved && res.improved.length > 10), 'Returns polished message');
    assert(res.tone === 'professional', 'Tone is preserved');
  } catch (err: any) {
    assert(false, 'AIService improveMessage', err.message);
  }

  console.log('\n--- 5. Testing CareerRoadmapService.generate ---');
  try {
    const roadmap = CareerRoadmapService.generate(['React', 'TypeScript'], 'Frontend Engineer', 'Beginner');
    assert(Boolean(roadmap.targetRole === 'Frontend Engineer'), 'Target role matches input');
    assert(Array.isArray(roadmap.phases) && roadmap.phases.length > 0, 'Phases generated successfully');
  } catch (err: any) {
    assert(false, 'CareerRoadmapService generate', err.message);
  }

  console.log('\n--- 6. Testing AIService.extractResumeSkills ---');
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
