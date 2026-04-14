import prisma from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";
import { createNotification } from "../../../lib/notifications";
import { logReferralActivity } from "../../../lib/referrals";
import multer from "multer";
import fs from "fs";
import path from "path";

// Create directory for CV uploads if it doesn't exist
const uploadDir = path.join(process.cwd(), "public", "uploads", "cvs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF/DOC/DOCX files are allowed"));
    }

    cb(null, true);
  },
});

export const config = {
  api: { bodyParser: false },
};

function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.single("cv")(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function normalizeText(value) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length ? v : null;
}

function parseCustomAnswers(raw) {
  if (!raw) return null;

  if (typeof raw === "object") {
    return raw;
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error("Invalid custom answers format");
    }
  }

  return null;
}

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const applicant = req.user;

  try {
    await runMulter(req, res);

    const { jobId, coverLetter, customAnswers } = req.body;

    const parsedJobId = parseInt(jobId, 10);
    if (!parsedJobId || Number.isNaN(parsedJobId)) {
      return res.status(400).json({ error: "Valid Job ID is required" });
    }

    const job = await prisma.job.findUnique({
      where: { id: parsedJobId },
      select: {
        id: true,
        status: true,
        title: true,
        applicationFields: true,
        company: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    const applicantRecord = await prisma.user.findUnique({
      where: { id: applicant.id },
      select: { id: true },
    });

    if (!applicantRecord) {
      return res.status(403).json({
        error: "User not found.",
      });
    }

    if (!job || job.status !== "OPEN") {
      return res.status(400).json({ error: "Job not open for applications" });
    }

    const cvFile = req.file;
    if (!cvFile) {
      return res.status(400).json({ error: "CV file is required" });
    }

    const existing = await prisma.application.findFirst({
      where: {
        jobId: job.id,
        applicantId: applicant.id,
      },
      select: { id: true },
    });

    if (existing) {
      try {
        fs.unlinkSync(path.join(uploadDir, cvFile.filename));
      } catch (_) {}

      return res.status(400).json({ error: "You have already applied for this job." });
    }

    let parsedCustomAnswers = null;
    try {
      parsedCustomAnswers = parseCustomAnswers(customAnswers);
    } catch (err) {
      try {
        fs.unlinkSync(path.join(uploadDir, cvFile.filename));
      } catch (_) {}

      return res.status(400).json({ error: err.message || "Invalid custom answers" });
    }

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        applicantId: applicant.id,
        cvPath: `/uploads/cvs/${cvFile.filename}`,
        coverLetter: normalizeText(coverLetter),
        customAnswers: parsedCustomAnswers,
        status: "APPLIED",
      },
    });

    // --- CREATE NOTIFICATION FOR EMPLOYER ---
    try {
      await createNotification(job.company.ownerId, "NEW_APPLICATION", {
        jobTitle: job.title,
      });
    } catch (notificationError) {
      console.error("Notification creation failed:", notificationError);
    }

    try {
      await logReferralActivity(
        applicant.id,
        "JOB_APPLIED",
        `Applied for ${job.title}`,
        `Applied for job "${job.title}".`,
        { jobId: job.id, applicationId: application.id }
      );
    } catch (activityError) {
      console.error("Referral activity logging failed:", activityError);
    }

    return res.status(201).json({
      message: "Application sent successfully",
      application,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(400).json({ error: "You have already applied for this job." });
    }

    const msg = error?.message || "Something went wrong";
    return res.status(500).json({ error: msg });
  }
}

export default requireAuth(handler, ["JOBSEEKER"]);
