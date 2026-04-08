import "dotenv/config";
import prisma from "./lib/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  try {
    console.log("Creating test user for login testing...");
    const testPassword = "TestPass123!";
    const hashed = await bcrypt.hash(testPassword, 10);
    
    // Delete existing test user if they exist
    await prisma.user.deleteMany({
      where: { email: "test@employer.com" },
    });
    
    const testUser = await prisma.user.create({
      data: {
        name: "Test Employer",
        email: "test@employer.com",
        passwordHash: hashed,
        role: "EMPLOYER",
        tokens: 3,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    
    console.log(`✓ Created test user`);
    console.log(`  Email: ${testUser.email}`);
    console.log(`  Password: ${testPassword}`);
    console.log(`\nYou can now login with these credentials at http://localhost:3001/login`);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
