import prisma from "../../../lib/prisma";
import { getAuthenticatedUser } from "../../../lib/auth";
import { createNotification } from "../../../lib/notifications";
import { logReferralActivity } from "../../../lib/referrals";
import { sendApplicationStatusEmail } from "../../../lib/mailer";

const VALID_STATUSES = ["APPLIED", "SHORTLISTED", "REJECTED"];

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const auth = await getAuthenticatedUser(req, { allowedRoles: ["EMPLOYER"] });
    if (auth.error) {
      return res.status(auth.error.status).json(auth.error.body);
    }

    const user = auth.user;
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
        job: { select: { id: true, postedById: true, title: true } },
        applicant: { select: { id: true, name: true, email: true } },
      },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (application.job.postedById !== user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });

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

    if (["SHORTLISTED", "REJECTED"].includes(status) && application.applicant.email) {
      try {
        await sendApplicationStatusEmail({
          email: application.applicant.email,
          name: application.applicant.name,
          jobTitle: application.job.title,
          status,
        });
      } catch (emailError) {
        console.error("Application status email failed:", emailError);
      }
    }

    try {
      await logReferralActivity(
        application.applicant.id,
        `APPLICATION_${status}`,
        `${status === "SHORTLISTED" ? "Shortlisted for" : "Rejected for"} ${application.job.title}`,
        `Application for "${application.job.title}" is now ${status.toLowerCase()}.`,
        { applicationId: application.id, jobId: application.job.id }
      );
    } catch (activityError) {
      console.error("Referral activity logging failed:", activityError);
    }

    return res.status(200).json({ application: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
