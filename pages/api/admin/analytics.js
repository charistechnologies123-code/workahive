import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import { closeExpiredJobs } from "../../../lib/job-expiry";

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

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

    const thirtyDaysAgo = daysAgo(30);

    const [
      totalUsers,
      employers,
      jobseekers,
      admins,
      totalJobs,
      openJobs,
      closedJobs,
      totalApplications,
      shortlistedApplications,
      rejectedApplications,
      totalCompanies,
      verifiedCompanies,
      pendingCompanies,
      recentJobs30Days,
      recentApplications30Days,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "EMPLOYER" } }),
      prisma.user.count({ where: { role: "JOBSEEKER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.job.count({ where: { status: "CLOSED" } }),
      prisma.application.count(),
      prisma.application.count({ where: { status: "SHORTLISTED" } }),
      prisma.application.count({ where: { status: "REJECTED" } }),
      prisma.company.count(),
      prisma.company.count({ where: { verified: true } }),
      prisma.company.count({ where: { verified: false } }),
      prisma.job.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.application.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    return res.status(200).json({
      totalUsers,
      employers,
      jobseekers,
      admins,
      totalJobs,
      openJobs,
      closedJobs,
      totalApplications,
      shortlistedApplications,
      rejectedApplications,
      totalCompanies,
      verifiedCompanies,
      pendingCompanies,
      recentJobs30Days,
      recentApplications30Days,
    });
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
