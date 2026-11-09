// Centralized Environment Variable Validation via Zod
// Validates all required database, payment, authentication, and AI microservice configurations.

import { z } from 'zod';

const isProd = process.env.APP_ENV === 'production';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['development', 'test', 'demo', 'staging', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  
  // Authentication & Security: strictly enforced without hardcoded fallback secrets in production
  AUTH_SECRET: isProd
    ? z.string().min(32, 'AUTH_SECRET must be at least 32 characters in production')
    : z.string().min(32).optional(),
  JWT_SECRET: z.string().min(16).optional().default(process.env.AUTH_SECRET || 'development-jwt-secret-minimum-16-characters-long'),
  SESSION_SECRET: z.string().min(16).optional().default(process.env.AUTH_SECRET || 'development-session-secret-at-least-16-chars'),
  INTERNAL_SERVICE_KEY: isProd
    ? z.string().min(32, 'INTERNAL_SERVICE_KEY must be at least 32 characters in production')
    : z.string().min(16).default('development-internal-key-32-characters-minimum'),
  PREVIOUS_INTERNAL_SERVICE_KEY: z.string().optional(),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Cashfree Payment Gateway
  CASHFREE_APP_ID: z.string().optional(),
  CASHFREE_SECRET_KEY: z.string().optional(),
  CASHFREE_ENVIRONMENT: z.enum(['TEST', 'PRODUCTION', 'sandbox', 'production']).default('sandbox'),
  CASHFREE_WEBHOOK_SECRET: z.string().optional(),

  // AI & RAG Infrastructure
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
  EMBEDDING_BASE_URL: z.string().default('http://127.0.0.1:11434'),
  BGE_M3_MODEL: z.string().default('bge-m3'),
  HNSW_EF_SEARCH: z.coerce.number().default(64),
  TAVILY_API_KEY: z.string().optional(),
  AGENTS_SERVICE_URL: z.string().url().default('http://127.0.0.1:8000'),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (_e) { const err = _e as Error; 
  if (process.env.APP_ENV === 'production') {
    const errorsList = _e instanceof z.ZodError ? _e.errors : err.message;
    process.stderr.write(`FATAL: Environment variable validation failed in production:\n${JSON.stringify(errorsList, null, 2)}\n`);
    throw new Error('Environment validation failed.');
  } else {
    // In development or test, fall back gracefully to parsed defaults
    parsedEnv = envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/growearn',
      ...process.env,
    });
  }
}

export const env = parsedEnv;
