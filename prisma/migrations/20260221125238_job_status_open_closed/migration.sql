-- 1) Create enum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'CLOSED');

-- 2) Add a new enum column with default OPEN
ALTER TABLE "Job" ADD COLUMN "status_new" "JobStatus" NOT NULL DEFAULT 'OPEN';

-- 3) Map old string statuses to new enum values
-- Treat anything that was visible/approved as OPEN, and CLOSED stays CLOSED.
UPDATE "Job"
SET "status_new" = CASE
  WHEN "status" = 'CLOSED' THEN 'CLOSED'::"JobStatus"
  ELSE 'OPEN'::"JobStatus"
END;

-- 4) Drop old column and rename new column
ALTER TABLE "Job" DROP COLUMN "status";
ALTER TABLE "Job" RENAME COLUMN "status_new" TO "status";

-- 5) (Optional) remove default if you want; but keeping default OPEN is fine
-- ALTER TABLE "Job" ALTER COLUMN "status" DROP DEFAULT;