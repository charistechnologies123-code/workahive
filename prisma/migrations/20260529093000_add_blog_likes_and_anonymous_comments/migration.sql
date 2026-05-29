BEGIN;

ALTER TABLE "BlogComment" DROP CONSTRAINT IF EXISTS "BlogComment_userId_fkey";

ALTER TABLE "BlogComment"
  ADD COLUMN IF NOT EXISTS "displayName" TEXT;

ALTER TABLE "BlogComment"
  ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "BlogComment"
  ADD CONSTRAINT "BlogComment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE TABLE IF NOT EXISTS "BlogLike" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "postId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  CONSTRAINT "BlogLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BlogLike_postId_userId_key"
  ON "BlogLike"("postId", "userId");

CREATE INDEX IF NOT EXISTS "BlogLike_postId_createdAt_idx"
  ON "BlogLike"("postId", "createdAt");

CREATE INDEX IF NOT EXISTS "BlogLike_userId_createdAt_idx"
  ON "BlogLike"("userId", "createdAt");

ALTER TABLE "BlogLike"
  ADD CONSTRAINT "BlogLike_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "BlogPost"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "BlogLike"
  ADD CONSTRAINT "BlogLike_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT;
