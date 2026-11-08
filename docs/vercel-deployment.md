# Vercel Deployment & Production Runbook

This guide documents the production deployment architecture for GrowEarn on Vercel paired with managed PostgreSQL (Neon / Supabase / AWS RDS).

---

## ⚙️ Vercel Project Settings

### 1. Build & Development Settings
- **Framework Preset**: Next.js
- **Build Command**: `prisma generate && prisma migrate deploy && next build`
- **Output Directory**: `.next`
- **Install Command**: `npm ci`
- **Node.js Version**: `20.x` or `22.x`

### 2. Serverless Function Execution Limits
For AI and LangChain RAG endpoints (`/api/learner/roadmap`, `/api/ai/*`), specify route segment configurations:
```typescript
export const maxDuration = 60; // Max execution timeout (seconds) on Vercel Pro
export const dynamic = 'force-dynamic';
```

---

## 📋 Required Environment Variables

Configure the following variables in the Vercel Dashboard under **Project Settings > Environment Variables**:

| Variable | Description | Required | Example / Default |
| :--- | :--- | :---: | :--- |
| `NODE_ENV` | Runtime environment | Yes | `production` |
| `APP_ENV` | Application environment guard | Yes | `production` |
| `DATABASE_URL` | Neon/Supabase pooled connection string (port 5432 or 6543) | Yes | `postgresql://user:pass@ep-pooler.us-east-1.aws.neon.tech/growearn?sslmode=require&pgbouncer=true` |
| `DIRECT_URL` | Direct database connection for Prisma migrations | Yes | `postgresql://user:pass@ep-direct.us-east-1.aws.neon.tech/growearn?sslmode=require` |
| `SESSION_SECRET` | Secret for signed Jose session cookies | Yes | (32+ random characters) |
| `JWT_SECRET` | Secret for stateless tokens | Yes | (32+ random characters) |
| `INTERNAL_SERVICE_KEY` | HMAC shared secret for Python CrewAI microservice | Yes | (32+ random characters) |
| `NEXT_PUBLIC_APP_URL` | Canonical public URL | Yes | `https://growearn.vercel.app` |
| `GROQ_API_KEY` | Groq LLM API Key | Yes | `gsk_...` |
| `GROQ_MODEL` | Default LLM model | No | `llama-3.3-70b-versatile` |
| `CASHFREE_APP_ID` | Cashfree Merchant App ID | Yes | `CF_PROD_...` |
| `CASHFREE_SECRET_KEY` | Cashfree Merchant Secret Key | Yes | (Production Secret) |
| `CASHFREE_ENVIRONMENT` | Gateway environment mode | Yes | `production` |
| `CASHFREE_WEBHOOK_SECRET`| Secret used to sign Cashfree webhooks | Yes | (Webhook Secret) |
| `EMBEDDING_BASE_URL` | HTTP endpoint for BGE-M3 model serving | Yes | `https://embeddings.growearn.internal` |
| `HNSW_EF_SEARCH` | pgvector HNSW search parameter | No | `64` |

---

## 🚀 Pre-Deployment Verification

Before triggering a production build:
```bash
# 1. Run full typecheck and linting
npm run typecheck
npm run lint

# 2. Verify all 97 automated proofs
npm run verify:all

# 3. Verify database migrations status
npx prisma migrate status
```

