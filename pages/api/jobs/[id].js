import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import sanitizeHtml from "sanitize-html";

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

  return input.map((field, index) => {
    const label = normalizeSpaces(field?.label);
    const placeholder = normalizeSpaces(field?.placeholder) || "";
    const type = normalizeSpaces(field?.type)?.toUpperCase() || "TEXT";
    const required = Boolean(field?.required);

    if (!label) {
      throw new Error(`Application field ${index + 1} must have a label.`);
    }

    if (!VALID_APPLICATION_FIELD_TYPES.includes(type)) {
      throw new Error(
        `Application field ${index + 1} has invalid type. Allowed types: ${VALID_APPLICATION_FIELD_TYPES.join(", ")}`
      );
    }

    return {
      label,
      type,
      required,
      placeholder,
    };
  });
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
    // ----------------------------
    // GET Job Details
    // ----------------------------
    if (req.method === "GET") {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          company: true,
          postedBy: true,
          _count: { select: { applications: true } },
        },
      });

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
      const user = getUserFromRequest(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

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
        data.category = normalizeSpaces(category);
      }

      if (type !== undefined) {
        data.type = normalizeSpaces(type);
      }

      if (location !== undefined) {
        data.location = location ? smartCase(location) : null;
      }

      if (workMode !== undefined) {
        const normalizedWorkMode = workMode ? sanitizeWorkMode(workMode) : null;

        if (workMode && !normalizedWorkMode) {
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

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          error:
            "Provide at least one field to update: title, description, category, type, location, workMode, applicationFields, or status",
        });
      }

      const updated = await prisma.job.update({
        where: { id: jobId },
        data,
        include: {
          company: true,
          postedBy: true,
          _count: { select: { applications: true } },
        },
      });

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