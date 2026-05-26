import prisma from "./prisma";

export async function closeExpiredJobs(now = new Date(), prismaClient = prisma) {
  try {
    const result = await prismaClient.job.updateMany({
      where: {
        status: "OPEN",
        applicationDeadline: {
          not: null,
          lte: now,
        },
      },
      data: {
        status: "CLOSED",
      },
    });

    return result.count || 0;
  } catch (error) {
    console.error("closeExpiredJobs failed:", error);
    return 0;
  }
}
