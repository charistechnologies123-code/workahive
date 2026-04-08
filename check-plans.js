import "dotenv/config";
import prisma from "./lib/prisma.js";

async function checkPlans() {
  try {
    const plans = await prisma.tokenPlan.findMany();
    console.log('Token plans in database:', plans.length);
    plans.forEach(plan => {
      console.log(`  ${plan.tokens} tokens - ₦${plan.price} (${plan.isActive ? 'active' : 'inactive'})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();