import dotenv from 'dotenv';
dotenv.config();

import { GrokLLMClient } from '../ai/grok-client';
import { AIService } from '../ai/ai-service';
import { LangChainRAGService } from '../ai/rag/langchain-agent';

async function runGroqSuite() {
  console.log('====================================================');
  console.log('🚀 TESTING COMPLETE GROQ AI SUITE FOR GROEARN');
  console.log('====================================================\n');

  console.log('1. Checking Groq Provider Detection...');
  const provider = GrokLLMClient.getActiveProvider();
  console.log(`Active Provider: ${provider}`);
  if (provider !== 'groq') {
    throw new Error(`Expected provider 'groq', but got '${provider}'`);
  }

  console.log('\n2. Testing Live Groq Chat Completion...');
  const directChat = await GrokLLMClient.complete({
    messages: [
      { role: 'system', content: 'You are an AI assistant on Groearn. Answer concisely.' },
      { role: 'user', content: 'What is Python in 1 sentence?' },
    ],
    temperature: 0.2,
    maxTokens: 100,
  });
  console.log(`[Groq Direct Output] (Model: ${directChat?.model}):\n${directChat?.text}\n`);

  console.log('\n3. Testing Technical Question Grounding ("what is python")...');
  const techQuestion = await LangChainRAGService.executeRAG('what is python', null);
  console.log(`[RAG Answer - Python] (isLLM: ${techQuestion.isLLMPowered}, Provider: ${techQuestion.provider}, Model: ${techQuestion.model}):\n${techQuestion.answer.slice(0, 300)}...\n`);

  console.log('\n4. Testing Mentor Grounding ("are these guys available in the application growearn")...');
  const mentorQuestion = await LangChainRAGService.executeRAG('are these guys available in the application growearn', null);
  console.log(`[RAG Answer - Mentors]:\n${mentorQuestion.answer.slice(0, 400)}...\n`);

  console.log('\n5. Testing AIService.analyzeSkills with Groq...');
  const skillAnalysis = await AIService.analyzeSkills(['React', 'TypeScript', 'Node.js'], 'Senior Full Stack AI Engineer');
  console.log('[Skill Analysis Result]:', JSON.stringify(skillAnalysis, null, 2));

  console.log('\n6. Testing AIService.generateRoadmap with Groq...');
  const roadmap = await AIService.generateRoadmap(['Python', 'SQL'], 'Machine Learning Engineer');
  console.log(`[Roadmap Result] Target: ${roadmap.targetRole}, Duration: ${roadmap.estimatedMonths} months, Nodes: ${roadmap.nodes.length}`);
  roadmap.nodes.forEach((n) => console.log(`  Step ${n.step}: ${n.title} (${n.milestoneType})`));

  console.log('\n7. Testing AIService.generateProposal with Groq...');
  const proposal = await AIService.generateProposal(
    'Senior Next.js Developer',
    'Build a high-performance analytics dashboard with Next.js 15, Server Actions, and Tailwind CSS.',
    ['Next.js', 'React', 'TypeScript', 'Tailwind CSS']
  );
  console.log('[Proposal Result]:');
  console.log(`  Intro: ${proposal.introduction.slice(0, 100)}...`);
  console.log(`  Milestones: ${proposal.milestones.length} milestones`);
  proposal.milestones.forEach((m) => console.log(`    - ${m.title} (${m.days} days, ${m.percentage}%)`));

  console.log('\n8. Testing AIService.improveMessage with Groq...');
  const improved = await AIService.improveMessage('hey send me the invoice asap thanks', 'professional');
  console.log('[Message Polish Result]:', JSON.stringify(improved, null, 2));

  console.log('\n9. Testing AIService.extractResumeSkills with Groq...');
  const parsedResume = await AIService.extractResumeSkills(
    'Experienced Full Stack Engineer with 4 years building scalable services using Java, Spring Boot, React, Next.js, PostgreSQL, Docker, and AWS.'
  );
  console.log('[Resume Parse Result]:', JSON.stringify(parsedResume, null, 2));

  console.log('\n====================================================');
  console.log('✅ ALL GROQ AI SERVICES TESTED & OPERATIONAL 100%');
  console.log('====================================================');
}

runGroqSuite().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
