-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "customAnswers" JSONB;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "customQuestions" JSONB;
