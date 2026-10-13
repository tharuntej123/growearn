-- Migration: 20261012180000_canonical_roles_check_constraint
-- Normalizes legacy role strings to canonical roles and adds database-level CHECK constraint

-- Step 1: Normalize any existing legacy roles to canonical values
UPDATE "User" SET "role" = 'FREELANCER' WHERE "role" = 'PROFESSIONAL';
UPDATE "User" SET "role" = 'COMPANY' WHERE "role" = 'EMPLOYER';
UPDATE "User" SET "role" = 'LEARNER' WHERE "role" = 'STUDENT';

-- Step 2: Enforce strict CHECK constraint on User role column
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_role_check";
ALTER TABLE "User" ADD CONSTRAINT "User_role_check" CHECK ("role" IN ('LEARNER', 'FREELANCER', 'MENTOR', 'COMPANY', 'ADMIN'));
