import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (user.role !== "JOBSEEKER") {
      return res.status(403).json({ error: "Only job seekers can save jobs" });
    }

    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: "Job ID is required" });
    }

    const existing = await prisma.savedJob.findFirst({
      where: {
        userId: user.id,
        jobId: Number(jobId),
      },
    });

    if (existing) {
      await prisma.savedJob.delete({
        where: { id: existing.id },
      });

      return res.status(200).json({ saved: false });
    }

    await prisma.savedJob.create({
      data: {
        userId: user.id,
        jobId: Number(jobId),
      },
    });

    return res.status(200).json({ saved: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update saved job" });
  }
}