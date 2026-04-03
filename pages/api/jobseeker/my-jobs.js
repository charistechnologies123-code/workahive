import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

function getInteractionPriority(status) {
  const s = String(status || "").toUpperCase();
  if (s === "SHORTLISTED") return 4;
  if (s === "REJECTED") return 3;
  if (s === "APPLIED") return 2;
  if (s === "SAVED") return 1;
  return 0;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (user.role !== "JOBSEEKER") {
      return res.status(403).json({ error: "Only job seekers can access this resource" });
    }

    const [savedJobs, applications] = await Promise.all([
      prisma.savedJob.findMany({
        where: { userId: user.id },
        include: {
          job: {
            include: {
              company: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.application.findMany({
        where: { applicantId: user.id },
        include: {
          job: {
            include: {
              company: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const merged = new Map();

    for (const item of savedJobs) {
      if (!item.job) continue;

      merged.set(item.job.id, {
        jobId: item.job.id,
        title: item.job.title,
        description: item.job.description,
        category: item.job.category,
        type: item.job.type,
        workMode: item.job.workMode,
        location: item.job.location,
        companyName: item.job.company?.name || "",
        interactionStatus: "SAVED",
        interactedAt: item.createdAt,
      });
    }

    for (const app of applications) {
      if (!app.job) continue;

      const appStatus =
        String(app.status || "").toUpperCase() === "SHORTLISTED"
          ? "SHORTLISTED"
          : String(app.status || "").toUpperCase() === "REJECTED"
          ? "REJECTED"
          : "APPLIED";

      const nextItem = {
        jobId: app.job.id,
        title: app.job.title,
        description: app.job.description,
        category: app.job.category,
        type: app.job.type,
        workMode: app.job.workMode,
        location: app.job.location,
        companyName: app.job.company?.name || "",
        interactionStatus: appStatus,
        interactedAt: app.updatedAt || app.createdAt,
      };

      const existing = merged.get(app.job.id);

      if (!existing) {
        merged.set(app.job.id, nextItem);
        continue;
      }

      const existingPriority = getInteractionPriority(existing.interactionStatus);
      const nextPriority = getInteractionPriority(nextItem.interactionStatus);

      if (
        nextPriority > existingPriority ||
        (nextPriority === existingPriority &&
          new Date(nextItem.interactedAt).getTime() >
            new Date(existing.interactedAt).getTime())
      ) {
        merged.set(app.job.id, nextItem);
      }
    }

    const jobs = Array.from(merged.values()).sort(
      (a, b) => new Date(b.interactedAt).getTime() - new Date(a.interactedAt).getTime()
    );

    return res.status(200).json({ jobs });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load your jobs" });
  }
}