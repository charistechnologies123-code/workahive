import prisma from "../../../lib/prisma";
import { getAuthenticatedUser } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const auth = await getAuthenticatedUser(req, { allowedRoles: ["EMPLOYER"] });
    if (auth.error) {
      return res.status(auth.error.status).json(auth.error.body);
    }

    const user = auth.user;
    const rawJobId = req.query.jobId;
    let parsedJobId = null;

    if (rawJobId && !Array.isArray(rawJobId)) {
      const n = parseInt(rawJobId, 10);
      if (Number.isNaN(n)) {
        return res.status(400).json({ error: "Invalid jobId" });
      }
      parsedJobId = n;
    }

    const applications = await prisma.application.findMany({
      where: {
        job: {
          postedById: user.id,
          ...(parsedJobId ? { id: parsedJobId } : {}),
        },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
            location: true,
            type: true,
            category: true,
            workMode: true,
            applicationFields: true,
          },
        },
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      applications,
      total: applications.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
