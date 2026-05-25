import prisma from "../../../lib/prisma";
import { getAuthenticatedUser } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const auth = await getAuthenticatedUser(req, { allowedRoles: ["JOBSEEKER"] });
    if (auth.error) {
      return res.status(auth.error.status).json(auth.error.body);
    }

    const user = auth.user;
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
