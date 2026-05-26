import prisma from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";
import { createNotification } from "../../../lib/notifications";
import { logReferralActivity } from "../../../lib/referrals";
import { sendNewApplicationEmail } from "../../../lib/mailer";
import multer from "multer";
import { deleteCvFromStorage, uploadCvToStorage } from "../../../lib/cv-storage";

const upload = multer({
  storage: multer.memoryStorage(),
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

function serializeError(error) {
  if (!error) return null;

  return {
    name: error.name,
    message: error.message,
    code: error.code,
    status: error.status,
    statusCode: error.statusCode,
    stack: error.stack,
  };
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

function validateCustomAnswers(applicationFields, customAnswers) {
  const answers = customAnswers && typeof customAnswers === "object" ? customAnswers : {};
  const fields = Array.isArray(applicationFields) ? applicationFields : [];

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const fieldKey = String(field?.id ?? field?.name ?? field?.label ?? index);
    const fieldLabel = field?.label || `Question ${index + 1}`;
    const value = answers[fieldKey];

    if (String(value ?? "").trim() === "") {
      return `${fieldLabel} is required.`;
    }
  }

  return null;
}

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const applicant = req.user;
  let uploadedCv = null;
  const requestId =
    req.headers["x-vercel-id"] ||
    req.headers["x-request-id"] ||
    `apply-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  console.log("[applications/apply] start", {
    requestId,
    applicantId: applicant?.id,
    method: req.method,
  });

  try {
    await runMulter(req, res);
    console.log("[applications/apply] multer complete", {
      requestId,
      hasFile: Boolean(req.file),
      bodyKeys: Object.keys(req.body || {}),
    });

    const { jobId, customAnswers } = req.body;

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
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
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
      console.warn("[applications/apply] duplicate application blocked", {
        requestId,
        jobId: parsedJobId,
        applicantId: applicant.id,
      });
      return res.status(400).json({ error: "You have already applied for this job." });
    }

    let parsedCustomAnswers = null;
    try {
      parsedCustomAnswers = parseCustomAnswers(customAnswers);
    } catch (err) {
      console.error("[applications/apply] custom answers parse failed", {
        requestId,
        error: serializeError(err),
      });
      return res.status(400).json({ error: err.message || "Invalid custom answers" });
    }

    const customAnswerError = validateCustomAnswers(job.applicationFields, parsedCustomAnswers);
    if (customAnswerError) {
      console.warn("[applications/apply] custom answers validation failed", {
        requestId,
        jobId: job.id,
        applicantId: applicant.id,
        error: customAnswerError,
      });
      return res.status(400).json({ error: customAnswerError });
    }

    console.log("[applications/apply] uploading cv", {
      requestId,
      jobId: job.id,
      applicantId: applicant.id,
      fileName: cvFile.originalname,
      contentType: cvFile.mimetype,
      fileSize: cvFile.size,
    });

    uploadedCv = await uploadCvToStorage({
      buffer: cvFile.buffer,
      contentType: cvFile.mimetype,
      originalName: cvFile.originalname,
      jobId: job.id,
      applicantId: applicant.id,
    });

    console.log("[applications/apply] cv uploaded", {
      requestId,
      jobId: job.id,
      applicantId: applicant.id,
      storagePath: uploadedCv.path,
      publicUrl: uploadedCv.publicUrl,
    });

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        applicantId: applicant.id,
        cvPath: uploadedCv.publicUrl,
        coverLetter: null,
        customAnswers: parsedCustomAnswers,
        status: "APPLIED",
      },
    });

    console.log("[applications/apply] application saved", {
      requestId,
      applicationId: application.id,
      jobId: job.id,
      applicantId: applicant.id,
    });

    // --- CREATE NOTIFICATION FOR EMPLOYER ---
    try {
      await createNotification(job.company.ownerId, "NEW_APPLICATION", {
        jobTitle: job.title,
      });
    } catch (notificationError) {
      console.error("Notification creation failed:", notificationError);
    }

    if (job.company.owner?.email) {
      try {
        await sendNewApplicationEmail({
          email: job.company.owner.email,
          name: job.company.owner.name,
          applicantName: applicant.name || "A candidate",
          jobTitle: job.title,
        });
      } catch (emailError) {
        console.error("New application email failed:", emailError);
      }
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
    console.error("[applications/apply] failed", {
      requestId,
      applicantId: applicant?.id,
      error: serializeError(error),
    });

    if (uploadedCv?.path) {
      await deleteCvFromStorage(uploadedCv.path);
    }

    if (error?.code === "P2002") {
      return res.status(400).json({ error: "You have already applied for this job." });
    }

    const msg = error?.message || "Something went wrong";
    return res.status(500).json({ error: msg });
  }
}

export default requireAuth(handler, ["JOBSEEKER"]);
