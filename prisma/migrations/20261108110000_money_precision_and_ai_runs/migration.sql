-- AlterTable Profile
ALTER TABLE "Profile" ALTER COLUMN "hourlyRate" TYPE DECIMAL(10,2) USING "hourlyRate"::DECIMAL(10,2);

-- AlterTable Course
ALTER TABLE "Course" ALTER COLUMN "price" TYPE DECIMAL(10,2) USING "price"::DECIMAL(10,2);

-- AlterTable MentorProfile
ALTER TABLE "MentorProfile" ALTER COLUMN "hourlyRate" TYPE DECIMAL(10,2) USING "hourlyRate"::DECIMAL(10,2);

-- AlterTable MentorshipBooking
ALTER TABLE "MentorshipBooking" ALTER COLUMN "price" TYPE DECIMAL(10,2) USING "price"::DECIMAL(10,2);

-- AlterTable Job
ALTER TABLE "Job" ALTER COLUMN "minSalary" TYPE DECIMAL(10,2) USING "minSalary"::DECIMAL(10,2);
ALTER TABLE "Job" ALTER COLUMN "maxSalary" TYPE DECIMAL(10,2) USING "maxSalary"::DECIMAL(10,2);
ALTER TABLE "Job" ALTER COLUMN "currency" SET DEFAULT 'INR';

-- AlterTable Proposal
ALTER TABLE "Proposal" ALTER COLUMN "proposedRate" TYPE DECIMAL(10,2) USING "proposedRate"::DECIMAL(10,2);

-- AlterTable PaymentOrder
ALTER TABLE "PaymentOrder" ALTER COLUMN "amount" TYPE DECIMAL(10,2) USING "amount"::DECIMAL(10,2);

-- AlterTable Payment
ALTER TABLE "Payment" ALTER COLUMN "amount" TYPE DECIMAL(10,2) USING "amount"::DECIMAL(10,2);
ALTER TABLE "Payment" ALTER COLUMN "refundAmount" TYPE DECIMAL(10,2) USING "refundAmount"::DECIMAL(10,2);

-- AlterTable CoursePurchase
ALTER TABLE "CoursePurchase" ALTER COLUMN "amountPaid" TYPE DECIMAL(10,2) USING "amountPaid"::DECIMAL(10,2);

-- AlterTable document_chunks
ALTER TABLE "document_chunks" ADD COLUMN IF NOT EXISTS "embedding_model" TEXT DEFAULT 'bge-m3';
ALTER TABLE "document_chunks" ADD COLUMN IF NOT EXISTS "embedding_dim" INTEGER DEFAULT 1024;
ALTER TABLE "document_chunks" ADD COLUMN IF NOT EXISTS "content_hash" TEXT;

-- CreateTable ai_runs
CREATE TABLE IF NOT EXISTS "ai_runs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "runType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_runs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey and Indexes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_runs_userId_fkey') THEN
    ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ai_runs_userId_idx" ON "ai_runs"("userId");
CREATE INDEX IF NOT EXISTS "ai_runs_runType_idx" ON "ai_runs"("runType");
CREATE INDEX IF NOT EXISTS "ai_runs_createdAt_idx" ON "ai_runs"("createdAt");

