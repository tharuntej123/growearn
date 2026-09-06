import { AIAssistantService } from '../ai/ai-assistant.service';
import { GrokLLMClient } from '../ai/grok-client';
import { prisma } from '../prisma';

async function testLiveGroq() {
  console.log('==============================================');
  console.log('🚀 TESTING LIVE GROQ AI LLM INTEGRATION');
  console.log('==============================================\n');

  console.log('Provider detected:', GrokLLMClient.getActiveProvider());
  console.log('Is LLM Available:', GrokLLMClient.isAvailable());

  // Test 1: Direct Groq LLM Call
  console.log('\n--- 1. Testing Direct Groq API Completion ---');
  const directResult = await GrokLLMClient.complete({
    messages: [
      { role: 'system', content: 'You are Groearn AI Assistant.' },
      { role: 'user', content: 'In 2 sentences, explain what Python is.' },
    ],
    temperature: 0.3,
  });

  console.log('Provider:', directResult?.provider);
  console.log('Model:', directResult?.model);
  console.log('Groq Response:', directResult?.text);

  // Test 2: Full AIAssistantService with RAG context
  console.log('\n--- 2. Testing AIAssistantService with live Groq ---');
  const answerResult = await AIAssistantService.answer('What are the best practices for building scalable backend APIs?', null);
  console.log('Answer Intent:', answerResult.intent);
  console.log('Answer Output:');
  console.log(answerResult.directAnswer);

  await prisma.$disconnect();
  console.log('\n==============================================');
  console.log('🎉 LIVE GROQ AI TEST COMPLETED SUCCESSFULLY!');
  console.log('==============================================');
}

testLiveGroq().catch((err) => {
  console.error('Live Groq test error:', err);
  process.exit(1);
});
