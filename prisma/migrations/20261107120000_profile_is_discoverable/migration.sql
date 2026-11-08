-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "isDiscoverable" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Profile_isDiscoverable_idx" ON "Profile"("isDiscoverable");
