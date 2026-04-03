import prisma from "../../../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

function getTokenFromCookie(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = getTokenFromCookie(req);
    if (!token) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.role !== "EMPLOYER") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const employerId = payload.id;

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
          postedById: employerId,
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
  } catch (err) {
    console.error(err);

    if (
      err?.name === "JsonWebTokenError" ||
      err?.name === "TokenExpiredError"
    ) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    return res.status(500).json({ error: "Something went wrong" });
  }
}