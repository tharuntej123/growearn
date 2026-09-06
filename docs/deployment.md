# Deployment & DevOps Guide

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Initialize database and Prisma client:
   ```bash
   npx prisma db push
   ```
3. Seed mock database with demo accounts:
   ```bash
   npm run seed
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

## Production Build & Run
```bash
npm run build
npm run start
```

## Continuous Integration
A GitHub Actions workflow is located at `.github/workflows/ci.yml`. It runs:
1. Linting (`npm run lint`)
2. TypeScript static type checking (`npx tsc --noEmit`)
3. Prisma generation & validation (`npx prisma generate && npx prisma db push`)
4. Production Next.js build compilation (`npm run build`)
