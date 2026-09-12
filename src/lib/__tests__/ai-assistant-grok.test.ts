import { AIAssistantService } from '../ai/ai-assistant.service';
import { GrokLLMClient } from '../ai/grok-client';
import { prisma } from '../prisma';

async function runTests() {
  console.log('==============================================');
  console.log('🧪 TESTING GROEARN AI ASSISTANT (BUG FIX VERIFICATION)');
  console.log('==============================================\n');

  const q1 = "hat is python";
  const res1 = await AIAssistantService.answer(q1, null);
  console.log(`Query: "${q1}"`);
  console.log('AI Answer Output:');
  console.log(res1.directAnswer.slice(0, 300) + '...\n');

  if (res1.directAnswer.includes('Python') && !res1.directAnswer.includes('Groearn is an all-in-one AI career ecosystem')) {
    console.log('✅ PASS: "hat is python" correctly returns Python technical breakdown instead of Groearn description.\n');
  } else {
    console.error('❌ FAIL: "hat is python" still returning Groearn platform description!\n');
    process.exit(1);
  }

  const q2 = "what is python";
  const res2 = await AIAssistantService.answer(q2, null);
  if (res2.directAnswer.includes('FastAPI') && res2.directAnswer.includes('GIL')) {
    console.log('✅ PASS: "what is python" returns complete Python architecture with code example.\n');
  } else {
    console.error('❌ FAIL: "what is python" failed.\n');
    process.exit(1);
  }

  const q3 = "what is typescript";
  const res3 = await AIAssistantService.answer(q3, null);
  if (res3.directAnswer.includes('TypeScript & JavaScript') && res3.directAnswer.includes('Event Loop')) {
    console.log('✅ PASS: "what is typescript" returns TypeScript & JS breakdown.\n');
  } else {
    console.error('❌ FAIL: "what is typescript" failed.\n');
    process.exit(1);
  }

  const q4 = "are these guys available in the application growearn";
  const res4 = await AIAssistantService.answer(q4, null);
  if (res4.directAnswer.includes('Marcus Vance') || res4.directAnswer.includes('Mentors')) {
    console.log('✅ PASS: Mentor availability query returns live mentor records.\n');
  } else {
    console.error('❌ FAIL: Mentor availability query failed.\n');
    process.exit(1);
  }

  const q5 = "what is groearn";
  const res5 = await AIAssistantService.answer(q5, null);
  if (res5.directAnswer.includes('all-in-one AI career ecosystem')) {
    console.log('✅ PASS: Platform query correctly describes Groearn.\n');
  } else {
    console.error('❌ FAIL: Platform query failed. Received: ' + res5.directAnswer + '\n');
    process.exit(1);
  }

  await prisma.$disconnect();
  console.log('==============================================');
  console.log('🎉 ALL AI ASSISTANT BUG FIX TESTS PASSED 100%!');
  console.log('==============================================');
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
