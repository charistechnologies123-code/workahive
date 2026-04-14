ALTER TABLE "User"
ADD COLUMN "referralCode" TEXT,
ADD COLUMN "referredById" INTEGER,
ADD COLUMN "referralMilestone10NotifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

ALTER TABLE "User"
ADD CONSTRAINT "User_referredById_fkey"
FOREIGN KEY ("referredById")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE TABLE "ReferralActivity" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReferralActivity_userId_createdAt_idx" ON "ReferralActivity"("userId", "createdAt");

ALTER TABLE "ReferralActivity"
ADD CONSTRAINT "ReferralActivity_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE NO ACTION;

CREATE TABLE "BlogPost" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "authorId" INTEGER NOT NULL,
  CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

ALTER TABLE "BlogPost"
ADD CONSTRAINT "BlogPost_authorId_fkey"
FOREIGN KEY ("authorId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE NO ACTION;
