/**
 * @file check-bgem3.ts
 * @description Standalone diagnostic tool to check BGE-M3 local embedding service setup and health.
 */

import { getEmbeddingProvider, EMBEDDING_DIMENSION } from '../src/lib/ai/embeddings';

async function main() {
  console.log('================================================================================');
  console.log('🧠 GROEARN BGE-M3 LOCAL EMBEDDING SERVICE DIAGNOSTIC');
  console.log('================================================================================\n');

  const provider = getEmbeddingProvider();
  console.log(`📡 Service Base URL: ${provider.getBaseUrl()}`);
  console.log(`🤖 Target Model:     ${provider.getModelName()}`);
  console.log(`📐 Target Dimension: ${EMBEDDING_DIMENSION}\n`);

  console.log('1. Checking connection to Ollama / Embedding service...');
  const health = await provider.checkHealth();

  if (!health.healthy) {
    console.error(`\n❌ Ollama service not reachable or degraded: ${health.error}`);
    console.log('\n💡 HOW TO START / SETUP:');
    console.log('   Option A (Local Ollama):');
    console.log('     1. Download and start Ollama (https://ollama.ai)');
    console.log('     2. Run: ollama pull bge-m3');
    console.log('     3. Run: ollama serve');
    console.log('\n   Option B (Docker Compose):');
    console.log('     Run: docker compose up -d embedding-service model-init');
    console.log('     This automatically pulls and runs BGE-M3 in an internal container.');
    process.exit(1);
  }

  if (health.error) {
    console.warn(`\n⚠️ Service is reachable, but model status: ${health.error}`);
    console.log('\n💡 Run: ollama pull bge-m3');
    process.exit(1);
  }

  console.log(`✅ Embedding service is ONLINE and model "${health.model}" is available!\n`);

  console.log('2. Testing real model inference (1024-dimension float vector generation)...');
  const sampleText = 'Full-Stack Next.js Developer with PostgreSQL and AI Semantic Search skills';
  const start = Date.now();
  const vector = await provider.generateEmbedding(sampleText);
  const latency = Date.now() - start;

  console.log(`✅ Vector successfully generated in ${latency}ms!`);
  console.log(`   Dimensions: ${vector.length} (Expected: ${EMBEDDING_DIMENSION})`);
  console.log(`   Sample slice: [${vector.slice(0, 5).map((n) => n.toFixed(5)).join(', ')}...]`);

  console.log('\n================================================================================');
  console.log('🎉 BGE-M3 EMBEDDING SERVICE IS FULLY CONFIGURED AND OPERATIONAL!');
  console.log('================================================================================');
}

main().catch((err) => {
  console.error('\n❌ Unexpected error running BGE-M3 diagnostic:', err.message);
  process.exit(1);
});
