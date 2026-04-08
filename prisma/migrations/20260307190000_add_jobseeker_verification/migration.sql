-- CreateEnum for VerificationStatus if not exists
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" 
ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN "verificationDocumentType" TEXT,
ADD COLUMN "verificationDocumentUrl" TEXT,
ADD COLUMN "verificationExplanation" TEXT,
ADD COLUMN "verificationRequestedAt" TIMESTAMP(3),
ADD COLUMN "verificationReviewedAt" TIMESTAMP(3),
ADD COLUMN "verificationReviewNote" TEXT;
