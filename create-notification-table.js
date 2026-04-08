import "dotenv/config";
import prisma from "./lib/prisma.js";

async function createNotificationTable() {
  try {
    console.log("Creating Notification table...");

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "read" BOOLEAN NOT NULL DEFAULT false,
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `;

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId")
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read")
    `;

    console.log("✅ Notification table created successfully!");

    // Verify
    const count = await prisma.notification.count();
    console.log(`✓ Table verified! Found ${count} notifications`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createNotificationTable();
