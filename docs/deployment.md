# Deployment & DevOps Guide

## 1. Production Architecture Prerequisites
- **Database**: PostgreSQL 15+ with `pgvector` extension enabled.
- **Node.js**: v20.x or v22.x LTS.
- **Migrations**: Standard SQL migrations via `prisma migrate deploy`. (Do not use `prisma db push` in production).

---

## 2. Environment Configuration
Create a secure `.env` file based on the following template:

```env
# Database Connection (Neon / AWS RDS / Supabase PostgreSQL with pgvector)
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Strict JWT Secret (Minimum 32 characters required; no fallback)
JWT_SECRET="your-ultra-secure-random-32-plus-character-secret-key"

# OpenAI Real Embedding Credentials (text-embedding-3-small)
OPENAI_API_KEY="sk-..."

# Razorpay Payments Configuration
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_..."

# Cloud Storage (S3 / Cloudflare R2 / Google Cloud Storage)
STORAGE_BUCKET="growearn-production-assets"
STORAGE_REGION="auto"
STORAGE_ACCESS_KEY_ID="your_storage_access_key"
STORAGE_SECRET_ACCESS_KEY="your_storage_secret_key"
STORAGE_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"

# Demo Mode Guard (false in production)
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false
NODE_ENV=production
```

---

## 3. Production Deployment Commands

### Step 1: Install Dependencies
```bash
npm ci
```

### Step 2: Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma migrate deploy
```

### Step 3: Compile Next.js Production Bundle
```bash
npm run build
```

### Step 4: Start Production Server
```bash
npm run start
```

---

## 4. Continuous Integration Pipeline (GitHub Actions)
The CI pipeline in `.github/workflows/ci.yml` validates:
1. `npm ci`
2. `npx prisma generate`
3. PostgreSQL + pgvector spin-up & `npx prisma migrate deploy`
4. Typecheck (`npm run typecheck`)
5. Linting (`npm run lint`)
6. Master Unit, Integration & Security Tests (`npm test`)
7. Production Build (`npm run build`)
8. Playwright E2E Verification (`npm run test:e2e`)
