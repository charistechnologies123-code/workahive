/*
  Warnings:

  - You are about to drop the column `customQuestions` on the `Job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "customQuestions",
ADD COLUMN     "applicationFields" JSONB;
