DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PaymentOrder' AND column_name = 'razorpayOrderId'
    ) THEN
        ALTER TABLE "PaymentOrder" RENAME COLUMN "razorpayOrderId" TO "providerOrderId";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Payment' AND column_name = 'razorpayOrderId'
    ) THEN
        ALTER TABLE "Payment" RENAME COLUMN "razorpayOrderId" TO "providerOrderId";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Payment' AND column_name = 'razorpayPaymentId'
    ) THEN
        ALTER TABLE "Payment" RENAME COLUMN "razorpayPaymentId" TO "providerPaymentId";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Payment' AND column_name = 'razorpaySignature'
    ) THEN
        ALTER TABLE "Payment" RENAME COLUMN "razorpaySignature" TO "providerSignature";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Payment' AND column_name = 'provider'
    ) THEN
        ALTER TABLE "Payment" ALTER COLUMN "provider" SET DEFAULT 'CASHFREE';
    END IF;

END $$;

ALTER INDEX IF EXISTS "PaymentOrder_razorpayOrderId_key" RENAME TO "PaymentOrder_providerOrderId_key";
ALTER INDEX IF EXISTS "PaymentOrder_razorpayOrderId_idx" RENAME TO "PaymentOrder_providerOrderId_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentOrder_providerOrderId_key" ON "PaymentOrder"("providerOrderId");
CREATE INDEX IF NOT EXISTS "PaymentOrder_providerOrderId_idx" ON "PaymentOrder"("providerOrderId");

ALTER INDEX IF EXISTS "Payment_razorpayOrderId_key" RENAME TO "Payment_providerOrderId_key";
ALTER INDEX IF EXISTS "Payment_razorpayPaymentId_key" RENAME TO "Payment_providerPaymentId_key";
ALTER INDEX IF EXISTS "Payment_razorpayOrderId_idx" RENAME TO "Payment_providerOrderId_idx";
ALTER INDEX IF EXISTS "Payment_razorpayPaymentId_idx" RENAME TO "Payment_providerPaymentId_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_providerOrderId_key" ON "Payment"("providerOrderId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");
CREATE INDEX IF NOT EXISTS "Payment_providerOrderId_idx" ON "Payment"("providerOrderId");
CREATE INDEX IF NOT EXISTS "Payment_providerPaymentId_idx" ON "Payment"("providerPaymentId");
