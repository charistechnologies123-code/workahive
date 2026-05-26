import prisma from "../../../lib/prisma";
import { getAuthenticatedUser, getUserFromRequest } from "../../../lib/auth";
import sanitizeHtml from "sanitize-html";
import { closeExpiredJobs } from "../../../lib/job-expiry";

const sanitizeRichText = (value) => {
  if (typeof value !== "string") return null;

  const clean = sanitizeHtml(value, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "a",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  }).trim();

  return clean.length ? clean : null;
};

const VALID_STATUSES = ["OPEN", "CLOSED"];
const VALID_WORKMODES = ["REMOTE", "HYBRID", "ONSITE"];
const VALID_APPLICATION_FIELD_TYPES = ["TEXT", "TEXTAREA", "URL", "NUMBER"];
const VALID_APPLICATION_ANSWER_MODES = ["TEXT", "FILE", "TEXT_OR_FILE"];
const FALLBACK_JOB_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  type: true,
  location: true,
  workMode: true,
  status: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
  applicationFields: true,
  companyId: true,
  postedById: true,
};

const isMissingSalaryOrDeadlineColumnError = (err) => {
  const msg = String(err?.message || "").toLowerCase();
  return msg.includes("salary") || msg.includes("applicationdeadline");
};



const normalizeMultilineText = (v) => {
  if (typeof v !== "string") return null;
  const s = v.replace(/\r\n/g, "\n").trim();
  return s.length ? s : null;
};



const normalizeSpaces = (v) => {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s+/g, " ");
  return s.length ? s : null;
};

const smartCase = (s) => {
  const str = normalizeSpaces(s);
  if (!str) return null;

  return str
    .split(" ")
    .map((w) => {
      if (/\d/.test(w) || (w.length >= 2 && w === w.toUpperCase())) return w;

      const m = w.match(/^([A-Za-z]+)(.*)$/);
      if (!m) return w;

      const word = m[1];
      const tail = m[2] || "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + tail;
    })
    .join(" ");
};

const sanitizeStatus = (status) => {
  const val = normalizeSpaces(status)?.toUpperCase();
  if (!val) return null;
  return VALID_STATUSES.includes(val) ? val : null;
};

const sanitizeWorkMode = (input) => {
  const val = normalizeSpaces(input)?.toUpperCase();
  if (!val) return null;
  return VALID_WORKMODES.includes(val) ? val : null;
};

const sanitizeApplicationFields = (input) => {
  if (input == null) return undefined;

  if (!Array.isArray(input)) {
    throw new Error("Application fields must be an array.");
  }

  return input
  .map((field, index) => {
    const label = normalizeSpaces(field?.label);
    const placeholder = normalizeSpaces(field?.placeholder) || "";
    const type = normalizeSpaces(field?.type)?.toUpperCase() || "TEXT";
    const answerMode = normalizeSpaces(field?.answerMode || field?.responseMode || field?.mode)?.toUpperCase() || "TEXT";
    const hasAnyContent = Boolean(label || placeholder);

    if (!hasAnyContent) {
      return null;
    }

    if (!label) {
      throw new Error(`Application field ${index + 1} must have a question label.`);
    }

    if (!VALID_APPLICATION_FIELD_TYPES.includes(type)) {
      throw new Error(
        `Application field ${index + 1} has invalid type. Allowed types: ${VALID_APPLICATION_FIELD_TYPES.join(", ")}`
      );
    }

    if (!VALID_APPLICATION_ANSWER_MODES.includes(answerMode)) {
      throw new Error(
        `Application field ${index + 1} has invalid answer mode. Allowed modes: ${VALID_APPLICATION_ANSWER_MODES.join(", ")}`
      );
    }

    return {
      label,
      type,
      answerMode,
      required: true,
      placeholder,
    };
  })
  .filter(Boolean);
};

const parseApplicationDeadline = (value) => {
  if (value == null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Application deadline must be a valid date.");
  }
  return date;
};

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid job id" });
  }

  const jobId = parseInt(id, 10);
  if (!Number.isInteger(jobId)) {
    return res.status(400).json({ error: "Invalid job id" });
  }

  try {
    await closeExpiredJobs();

    // ----------------------------
    // GET Job Details
    // ----------------------------
    if (req.method === "GET") {
      let job;
      try {
        job = await prisma.job.findUnique({
          where: { id: jobId },
          include: {
            company: true,
            postedBy: true,
            _count: { select: { applications: true } },
          },
        });
      } catch (err) {
        if (!isMissingSalaryOrDeadlineColumnError(err)) throw err;
        job = await prisma.job.findUnique({
          where: { id: jobId },
          select: {
            ...FALLBACK_JOB_SELECT,
            company: true,
            postedBy: true,
            _count: { select: { applications: true } },
          },
        });
      }

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const user = getUserFromRequest(req);
      const isAdmin = user?.role === "ADMIN";
      const isOwner = user?.role === "EMPLOYER" && user.id === job.postedById;

      // Only OPEN jobs are public.
      // CLOSED jobs can only be viewed by ADMIN or owner employer.
      if (job.status !== "OPEN" && !isAdmin && !isOwner) {
        return res.status(403).json({ error: "Unauthorized to view this job" });
      }

      const isSaved = Boolean(
        user?.role === "JOBSEEKER"
          ? await prisma.savedJob.findFirst({
              where: { userId: user.id, jobId: job.id },
              select: { id: true },
            })
          : null
      );

      return res.status(200).json({
        ...job,
        applicantsCount: job._count?.applications || 0,
        isSaved,
      });
    }

    // ----------------------------
    // PATCH Job (Edit or Change Status)
    // ----------------------------
    if (req.method === "PATCH") {
      const auth = await getAuthenticatedUser(req);
      if (auth.error) {
        return res.status(auth.error.status).json(auth.error.body);
      }
      const user = auth.user;

      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const isAdmin = user.role === "ADMIN";
      const isOwnerEmployer = user.role === "EMPLOYER" && job.postedById === user.id;

      if (!isAdmin && !isOwnerEmployer) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const raw = req.body || {};

      const {
        title,
        description,
        category,
        type,
        salary,
        applicationDeadline,
        location,
        workMode,
        status,
        applicationFields,
      } = raw;

      const data = {};

      if (title !== undefined) {
        const normalizedTitle = normalizeSpaces(title);
        if (!normalizedTitle) {
          return res.status(400).json({ error: "Title cannot be empty" });
        }
        data.title = normalizedTitle;
      }

      if (description !== undefined) {
        const normalizedDescription = sanitizeRichText(description);
        if (!normalizedDescription) {
          return res.status(400).json({ error: "Description cannot be empty" });
        }
        data.description = normalizedDescription;
      }

      if (category !== undefined) {
        const normalizedCategory = normalizeSpaces(category);
        if (!normalizedCategory) {
          return res.status(400).json({ error: "Category cannot be empty" });
        }
        data.category = normalizedCategory;
      }

      if (type !== undefined) {
        const normalizedType = normalizeSpaces(type);
        if (!normalizedType) {
          return res.status(400).json({ error: "Job type cannot be empty" });
        }
        data.type = normalizedType;
      }

      if (salary !== undefined) {
        data.salary = normalizeSpaces(salary);
      }

      if (location !== undefined) {
        const normalizedLocation = normalizeSpaces(location);
        if (!normalizedLocation) {
          return res.status(400).json({ error: "Location cannot be empty" });
        }
        data.location = smartCase(normalizedLocation);
      }

      if (workMode !== undefined) {
        const normalizedWorkMode = workMode ? sanitizeWorkMode(workMode) : null;

        if (!normalizedWorkMode) {
          return res.status(400).json({ error: "Invalid work mode" });
        }

        data.workMode = normalizedWorkMode;
      }

      if (status !== undefined) {
        const normalizedStatus = sanitizeStatus(status);

        if (!normalizedStatus) {
          return res.status(400).json({ error: "Invalid status" });
        }

        data.status = normalizedStatus;
      }

      if (applicationFields !== undefined) {
        try {
          data.applicationFields = sanitizeApplicationFields(applicationFields) ?? [];
        } catch (err) {
          return res.status(400).json({ error: err.message || "Invalid application fields" });
        }
      }

      if (applicationDeadline !== undefined) {
        try {
          const deadline = parseApplicationDeadline(applicationDeadline);
          if (!deadline) {
            return res.status(400).json({ error: "Application deadline cannot be empty" });
          }
          data.applicationDeadline = deadline;
        } catch (err) {
          return res.status(400).json({ error: err.message || "Invalid application deadline" });
        }
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          error:
            "Provide at least one field to update: title, description, category, type, salary, application deadline, location, workMode, applicationFields, or status",
        });
      }

      let updated;
      try {
        updated = await prisma.job.update({
          where: { id: jobId },
          data,
          include: {
            company: true,
            postedBy: true,
            _count: { select: { applications: true } },
          },
        });
      } catch (err) {
        if (!isMissingSalaryOrDeadlineColumnError(err)) throw err;

        const fallbackData = { ...data };
        delete fallbackData.salary;
        delete fallbackData.applicationDeadline;

        updated = await prisma.job.update({
          where: { id: jobId },
          data: fallbackData,
          select: {
            ...FALLBACK_JOB_SELECT,
            company: true,
            postedBy: true,
            _count: { select: { applications: true } },
          },
        });
      }

      if (
        updated?.status === "OPEN" &&
        updated?.applicationDeadline &&
        new Date(updated.applicationDeadline).getTime() <= Date.now()
      ) {
        updated = await prisma.job.update({
          where: { id: jobId },
          data: { status: "CLOSED" },
          include: {
            company: true,
            postedBy: true,
            _count: { select: { applications: true } },
          },
        });
      }

      return res.status(200).json({
        ...updated,
        applicantsCount: updated._count?.applications || 0,
      });
    }

    // ----------------------------
    // Other methods
    // ----------------------------
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
