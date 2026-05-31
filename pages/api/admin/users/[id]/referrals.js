import prisma from "../../../../../lib/prisma";
import { getUserFromRequest } from "../../../../../lib/auth";
import { formatWorkaHiveDate } from "../../../../../lib/date-format";

function getJobseekerStats(applications = []) {
  const shortlisted = applications.filter((application) => application.status === "SHORTLISTED").length;
  return {
    totalApplications: applications.length,
    shortlisted,
  };
}

export default async function handler(req, res) {
  const admin = getUserFromRequest(req);
  if (!admin || admin.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = Number(req.query.id);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      tokens: true,
      referralCode: true,
      company: {
        select: {
          name: true,
          verified: true,
        },
      },
      referrals: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          tokens: true,
          company: {
            select: {
              name: true,
              verified: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const referrals = await Promise.all(
    (user.referrals || []).map(async (referral) => {
      const base = {
        id: referral.id,
        name: referral.name,
        email: referral.email,
        role: referral.role,
        createdAt: referral.createdAt,
        joinedAt: formatWorkaHiveDate(referral.createdAt),
        tokens: referral.tokens ?? 0,
        company: referral.company || null,
      };

      if (referral.role === "EMPLOYER") {
        const [jobsPosted, recentJobs] = await Promise.all([
          prisma.job.count({
            where: { postedById: referral.id },
          }),
          prisma.job.findMany({
            where: { postedById: referral.id },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
              _count: {
                select: {
                  applications: true,
                },
              },
            },
          }),
        ]);

        return {
          ...base,
          jobsPosted,
          recentJobs,
          tokensUsedNote: "Tokens bought are tracked manually, so usage cannot be verified automatically yet.",
        };
      }

      if (referral.role === "JOBSEEKER") {
        const [applications, recentApplications] = await Promise.all([
          prisma.application.findMany({
            where: { applicantId: referral.id },
            select: { status: true },
          }),
          prisma.application.findMany({
            where: { applicantId: referral.id },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              status: true,
              createdAt: true,
              job: {
                select: {
                  id: true,
                  title: true,
                  company: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          }),
        ]);

        const stats = getJobseekerStats(applications);

        return {
          ...base,
          ...stats,
          recentApplications,
        };
      }

      return base;
    })
  );

  return res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      joinedAt: formatWorkaHiveDate(user.createdAt),
      tokens: user.tokens ?? 0,
      referralCode: user.referralCode || null,
      company: user.company || null,
    },
    referrals,
    referralCount: referrals.length,
  });
}
