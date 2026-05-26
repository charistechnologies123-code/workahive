import prisma from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";
import { createNotification } from "../../../lib/notifications";
import { logReferralActivity } from "../../../lib/referrals";
import { sendNewApplicationEmail } from "../../../lib/mailer";
import multer from "multer";
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_LABEL } from "../../../lib/upload-limits";
import {
  deleteApplicationFileFromStorage,
  uploadApplicationFileToStorage,
} from "../../../lib/application-file-storage";
import { deleteCvFromStorage, uploadCvToStorage } from "../../../lib/cv-storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES, files: 25 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "text/plain",
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
    upload.any()(req, res, (err) => {
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

function normalizeAnswerMode(mode) {
  const value = String(mode || "").toUpperCase();
  if (value === "FILE") return "FILE";
  if (value === "TEXT_OR_FILE") return "TEXT_OR_FILE";
  return "TEXT";
}

function getFieldKey(field, index) {
  return String(field?.id ?? field?.name ?? field?.label ?? index);
}

function extractTextValue(value) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    if (typeof value.text === "string") return value.text.trim();
    if (typeof value.answer === "string") return value.answer.trim();
  }
  return "";
}

function validateCustomAnswers(applicationFields, customAnswers, filesByFieldKey) {
  const answers = customAnswers && typeof customAnswers === "object" ? customAnswers : {};
  const fields = Array.isArray(applicationFields) ? applicationFields : [];

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const fieldKey = getFieldKey(field, index);
    const fieldLabel = field?.label || `Question ${index + 1}`;
    const answerMode = normalizeAnswerMode(field?.answerMode || field?.responseMode || field?.mode);
    const value = answers[fieldKey];
    const textValue = extractTextValue(value);
    const file = filesByFieldKey[fieldKey];

    if (answerMode === "FILE") {
      if (!file) {
        return `${fieldLabel} requires a file upload.`;
      }
      continue;
    }

    if (answerMode === "TEXT_OR_FILE") {
      if (textValue === "" && !file) {
        return `${fieldLabel} requires a typed response or a file upload.`;
      }
      continue;
    }

    if (file) {
      return `${fieldLabel} accepts typed responses only.`;
    }

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
  const uploadedCustomFiles = [];
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
      hasFiles: Array.isArray(req.files) && req.files.length > 0,
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

    const allFiles = Array.isArray(req.files) ? req.files : [];
    const cvFile = allFiles.find((file) => file.fieldname === "cv");
    const customFilesByFieldKey = Object.fromEntries(
      allFiles
        .filter((file) => String(file.fieldname || "").startsWith("customFile_"))
        .map((file) => [String(file.fieldname).replace(/^customFile_/, ""), file])
    );

    if (!cvFile) {
      return res.status(400).json({ error: "CV file is required" });
    }

    if (cvFile.size > MAX_UPLOAD_SIZE_BYTES) {
      return res.status(400).json({
        error: `CV file must be ${MAX_UPLOAD_SIZE_LABEL} or smaller.`,
      });
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

    let parsedCustomAnswers = {};
    try {
      parsedCustomAnswers = parseCustomAnswers(customAnswers) || {};
    } catch (err) {
      console.error("[applications/apply] custom answers parse failed", {
        requestId,
        error: serializeError(err),
      });
      return res.status(400).json({ error: err.message || "Invalid custom answers" });
    }

    const customAnswerError = validateCustomAnswers(
      job.applicationFields,
      parsedCustomAnswers,
      customFilesByFieldKey
    );
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

    const normalizedCustomAnswers = {};
    const applicationFields = Array.isArray(job.applicationFields) ? job.applicationFields : [];

    for (let index = 0; index < applicationFields.length; index += 1) {
      const field = applicationFields[index];
      const fieldKey = getFieldKey(field, index);
      const fieldLabel = field?.label || `Question ${index + 1}`;
      const fieldType = String(field?.type || "TEXT").toUpperCase();
      const answerMode = normalizeAnswerMode(field?.answerMode || field?.responseMode || field?.mode);
      const rawValue = parsedCustomAnswers?.[fieldKey];
      const textValue = extractTextValue(rawValue);
      const file = customFilesByFieldKey[fieldKey];

      if (answerMode === "FILE" || answerMode === "TEXT_OR_FILE") {
        if (file) {
          if (file.size > MAX_UPLOAD_SIZE_BYTES) {
            throw new Error(
              `${fieldLabel} file must be ${MAX_UPLOAD_SIZE_LABEL} or smaller.`
            );
          }

          console.log("[applications/apply] uploading custom file", {
            requestId,
            fieldKey,
            fieldLabel,
            fileName: file.originalname,
            contentType: file.mimetype,
            fileSize: file.size,
          });

          const uploadedFile = await uploadApplicationFileToStorage({
            buffer: file.buffer,
            contentType: file.mimetype,
            originalName: file.originalname,
            jobId: job.id,
            applicantId: applicant.id,
            fieldKey,
          });

          uploadedCustomFiles.push(uploadedFile.path);

          normalizedCustomAnswers[fieldKey] = {
            label: fieldLabel,
            type: fieldType,
            answerMode,
            text: textValue || "",
            file: {
              path: uploadedFile.path,
              url: uploadedFile.publicUrl,
              name: file.originalname,
              type: file.mimetype,
              size: file.size,
            },
          };
          continue;
        }

        normalizedCustomAnswers[fieldKey] = {
          label: fieldLabel,
          type: fieldType,
          answerMode,
          text: textValue || "",
          file: null,
        };
        continue;
      }

      if (fieldType === "CHECKBOX") {
        normalizedCustomAnswers[fieldKey] = Boolean(rawValue);
      } else if (fieldType === "RADIO" || fieldType === "SELECT" || fieldType === "TEXTAREA") {
        normalizedCustomAnswers[fieldKey] = textValue;
      } else {
        normalizedCustomAnswers[fieldKey] = textValue;
      }
    }

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        applicantId: applicant.id,
        cvPath: uploadedCv.publicUrl,
        coverLetter: null,
        customAnswers: normalizedCustomAnswers,
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

    for (const objectPath of uploadedCustomFiles) {
      try {
        await deleteApplicationFileFromStorage(objectPath);
      } catch (deleteError) {
        console.error("[applications/apply] failed to delete orphaned custom file", {
          requestId,
          objectPath,
          error: serializeError(deleteError),
        });
      }
    }

    if (uploadedCv?.path) {
      await deleteCvFromStorage(uploadedCv.path);
    }

    if (error?.code === "P2002") {
      return res.status(400).json({ error: "You have already applied for this job." });
    }

    if (error?.message?.includes("File too large")) {
      return res.status(400).json({
        error: `Uploaded files must be ${MAX_UPLOAD_SIZE_LABEL} or smaller.`,
      });
    }

    const msg = error?.message || "Something went wrong";
    return res.status(500).json({ error: msg });
  }
}

export default requireAuth(handler, ["JOBSEEKER"]);
