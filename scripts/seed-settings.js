import prisma from "../lib/prisma.js";

async function main() {
  await prisma.appSetting.upsert({
    where: { key: "FREE_TOKENS_NEW_EMPLOYER" },
    update: {},
    create: { key: "FREE_TOKENS_NEW_EMPLOYER", valueInt: 3 },
  });

  await prisma.appSetting.upsert({
    where: { key: "TOKENS_PER_JOB_POST" },
    update: {},
    create: { key: "TOKENS_PER_JOB_POST", valueInt: 1 },
  });

  console.log("✅ Settings seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });