import prisma from "../../../lib/prisma";
import jwt from "jsonwebtoken";
import { createNotification } from "../../../lib/notifications";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

function getTokenFromCookie(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const VALID_STATUSES = ["APPLIED", "SHORTLISTED", "REJECTED"];

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
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

    const { applicationId, status } = req.body;

    if (!applicationId) {
      return res.status(400).json({ error: "Application ID required" });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: { select: { postedById: true, title: true } },
        applicant: { select: { id: true, name: true } },
      },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (application.job.postedById !== payload.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });

    // --- CREATE NOTIFICATION FOR APPLICANT ---
    try {
      if (status === "SHORTLISTED") {
        await createNotification(application.applicant.id, "APPLICATION_SHORTLISTED", {
          jobTitle: application.job.title,
        });
      } else if (status === "REJECTED") {
        await createNotification(application.applicant.id, "APPLICATION_REJECTED", {
          jobTitle: application.job.title,
        });
      }
    } catch (notificationError) {
      console.error("Notification creation failed:", notificationError);
    }

    return res.status(200).json({ application: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}