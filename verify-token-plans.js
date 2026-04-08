import "dotenv/config";
import prisma from "./lib/prisma.js";

async function verifyPlans() {
  try {
    const plans = await prisma.tokenPlan.findMany({
      orderBy: { tokens: "asc" },
    });
    console.log("✅ Token Plans in Database:");
    plans.forEach((plan) => {
      console.log(`   - ${plan.tokens} tokens: ₦${plan.price} (Active: ${plan.isActive})`);
    });
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPlans();
