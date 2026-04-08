import "dotenv/config";
import prisma from "./lib/prisma.js";

async function seedTokenPlans() {
  try {
    console.log("Checking for existing token plans...");

    const existingPlans = await prisma.tokenPlan.findMany();
    console.log(`Found ${existingPlans.length} existing plans`);

    if (existingPlans.length === 0) {
      console.log("Seeding token plans...");

      const plans = [
        { tokens: 5, price: 2500 },
        { tokens: 10, price: 4500 },
        { tokens: 25, price: 10000 },
        { tokens: 50, price: 18000 },
        { tokens: 100, price: 32000 },
      ];

      for (const plan of plans) {
        await prisma.tokenPlan.create({
          data: {
            tokens: plan.tokens,
            price: plan.price,
            isActive: true,
          },
        });
      }

      console.log("✅ Token plans seeded successfully!");
    } else {
      console.log("Token plans already exist:");
      existingPlans.forEach(plan => {
        console.log(`  - ${plan.tokens} tokens: ₦${plan.price}`);
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedTokenPlans();
