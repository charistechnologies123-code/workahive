import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";
import { closeExpiredJobs } from "../../../../lib/job-expiry";

export default async function handler(req, res) {
  const admin = getUserFromRequest(req);
  if (!admin || admin.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await closeExpiredJobs();

    const [totalJobs, openJobs, closedJobs] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.job.count({ where: { status: "CLOSED" } }),
    ]);

    return res.status(200).json({ totalJobs, openJobs, closedJobs });
  } catch (error) {
    console.error("GET /api/admin/jobs/summary error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
