CREATE TYPE "ChatRoomType" AS ENUM ('DIRECT', 'GROUP');

CREATE TABLE "ChatRoom" (
    "id" SERIAL NOT NULL,
    "type" "ChatRoomType" NOT NULL DEFAULT 'DIRECT',
    "title" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(6),

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMember" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(6),

    CONSTRAINT "ChatMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMessage" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChatMember_roomId_userId_key" ON "ChatMember"("roomId", "userId");
CREATE INDEX "ChatMember_userId_roomId_idx" ON "ChatMember"("userId", "roomId");
CREATE INDEX "ChatRoom_type_lastMessageAt_idx" ON "ChatRoom"("type", "lastMessageAt");
CREATE INDEX "ChatRoom_createdById_createdAt_idx" ON "ChatRoom"("createdById", "createdAt");
CREATE INDEX "ChatMessage_roomId_createdAt_idx" ON "ChatMessage"("roomId", "createdAt");
CREATE INDEX "ChatMessage_senderId_createdAt_idx" ON "ChatMessage"("senderId", "createdAt");

ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_roomId_fkey"
FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey"
FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
