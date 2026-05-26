CREATE TABLE "BlogComment" (
  "id" SERIAL NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "postId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "parentId" INTEGER,
  CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BlogComment_postId_createdAt_idx" ON "BlogComment"("postId", "createdAt");
CREATE INDEX "BlogComment_userId_createdAt_idx" ON "BlogComment"("userId", "createdAt");
CREATE INDEX "BlogComment_parentId_idx" ON "BlogComment"("parentId");

ALTER TABLE "BlogComment"
  ADD CONSTRAINT "BlogComment_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "BlogPost"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "BlogComment"
  ADD CONSTRAINT "BlogComment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "BlogComment"
  ADD CONSTRAINT "BlogComment_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "BlogComment"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;