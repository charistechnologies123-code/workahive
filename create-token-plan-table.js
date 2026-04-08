import "dotenv/config";
import prisma from "./lib/prisma.js";

async function createTokenPlanTable() {
  try {
    console.log("Creating TokenPlan table...");

    // Use raw SQL to create the table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TokenPlan" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "tokens" INTEGER NOT NULL,
        "price" INTEGER NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log("✅ TokenPlan table created successfully!");

    // Verify by trying to fetch
    const count = await prisma.tokenPlan.count();
    console.log(`✓ Table verified! Found ${count} existing plans`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTokenPlanTable();
