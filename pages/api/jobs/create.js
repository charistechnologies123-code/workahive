import prisma from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";
import sanitizeHtml from "sanitize-html";
import { logReferralActivity } from "../../../lib/referrals";

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

const CANONICAL_CATEGORIES = [
  "Software/IT",
  "Data",
  "Design",
  "Marketing",
  "Sales",
  "Customer Support",
  "Finance/Accounting",
  "Operations/Admin",
  "HR/People Ops",
  "Product/Project",
  "Education",
  "Healthcare",
  "Engineering (Non-Software)",
  "Logistics",
  "Legal",
  "Hospitality",
  "Skilled Trades",
  "Other",
];

const CANONICAL_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Temporary",
  "Volunteer",
  "Other",
];

const ALLOWED_APPLICATION_FIELD_TYPES = ["TEXT", "TEXTAREA", "URL", "NUMBER"];
const ALLOWED_APPLICATION_ANSWER_MODES = ["TEXT", "FILE", "TEXT_OR_FILE"];

const normalizeSpaces = (v) => {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s+/g, " ");
  return s.length ? s : null;
};

// Keeps acronyms like LAUTECH; title-cases normal words
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

const canonicalFromList = (input, list) => {
  const val = normalizeSpaces(input);
  if (!val) return null;

  const hit = list.find((x) => x.toLowerCase() === val.toLowerCase());
  if (hit) return hit;

  return smartCase(val);
};

// Accepts flexible input and returns Prisma enum string: REMOTE | HYBRID | ONSITE | null
const canonicalWorkMode = (input) => {
  const v = normalizeSpaces(input);
  if (!v) return null;

  const x = v.toLowerCase();

  if (["remote", "wfh", "work from home", "work-from-home"].includes(x)) return "REMOTE";
  if (["hybrid"].includes(x)) return "HYBRID";
  if (["onsite", "on-site", "on site", "in-office", "in office"].includes(x)) return "ONSITE";

  // If employer UI already sends REMOTE/HYBRID/ONSITE
  if (["remote", "hybrid", "onsite"].includes(x)) return x.toUpperCase();

  return null;
};

const sanitizeApplicationFields = (input) => {
  if (input == null) return [];

  if (!Array.isArray(input)) {
    throw new Error("Application fields must be an array.");
  }

  return input
  .map((field, index) => {
    const label = normalizeSpaces(field?.label);
    const placeholder = normalizeSpaces(field?.placeholder);
    const type = normalizeSpaces(field?.type)?.toUpperCase() || "TEXT";
    const answerMode = normalizeSpaces(field?.answerMode || field?.responseMode || field?.mode)?.toUpperCase() || "TEXT";
    const hasAnyContent = Boolean(label || placeholder);

    if (!hasAnyContent) {
      return null;
    }

    if (!label) {
      throw new Error(`Application field ${index + 1} must have a question label.`);
    }

    if (!ALLOWED_APPLICATION_FIELD_TYPES.includes(type)) {
      throw new Error(
        `Application field ${index + 1} has invalid type. Allowed types: ${ALLOWED_APPLICATION_FIELD_TYPES.join(", ")}`
      );
    }

    if (!ALLOWED_APPLICATION_ANSWER_MODES.includes(answerMode)) {
      throw new Error(
        `Application field ${index + 1} has invalid answer mode. Allowed modes: ${ALLOWED_APPLICATION_ANSWER_MODES.join(", ")}`
      );
    }

    return {
      label,
      type,
      answerMode,
      required: true,
      placeholder: placeholder || "",
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

const isMissingSalaryOrDeadlineColumnError = (err) => {
  const msg = String(err?.message || "").toLowerCase();
  return msg.includes("salary") || msg.includes("applicationdeadline");
};

export default requireAuth(
  async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const user = req.user;
    if (user.role !== "EMPLOYER") {
      return res.status(403).json({ error: "Employers only" });
    }

    const raw = req.body || {};

    const title = normalizeSpaces(raw.title);

const description = sanitizeRichText(raw.description);

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const category = canonicalFromList(raw.category, CANONICAL_CATEGORIES);
    const type = canonicalFromList(raw.type, CANONICAL_TYPES);
    const workMode = canonicalWorkMode(raw.workMode);
    const locationInput = normalizeSpaces(raw.location);
    const salary = normalizeSpaces(raw.salary);
    let applicationDeadline = null;

    let applicationFields = [];
    try {
      applicationFields = sanitizeApplicationFields(raw.applicationFields);
      applicationDeadline = parseApplicationDeadline(raw.applicationDeadline);
    } catch (err) {
      return res.status(400).json({ error: err.message || "Invalid application fields" });
    }
    const deadlineAlreadyPassed =
      applicationDeadline && applicationDeadline.getTime() <= Date.now();

    try {
      const employer = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          tokens: true,
          company: { select: { id: true, verified: true } },
        },
      });

      if (!employer) return res.status(401).json({ error: "Unauthorized" });

      if (!employer.company) {
        return res.status(400).json({
          error: "You must create your company profile before posting a job.",
        });
      }

      if (!employer.company.verified) {
        return res.status(403).json({
          error: "Your company must be verified before you can post jobs.",
        });
      }

      const costSetting = await prisma.appSetting.findUnique({
        where: { key: "TOKENS_PER_JOB_POST" },
        select: { valueInt: true },
      });

      const cost = Number(costSetting?.valueInt ?? 1);
      if (!Number.isFinite(cost) || cost < 1) {
        return res.status(500).json({ error: "Invalid TOKENS_PER_JOB_POST setting" });
      }

      if (employer.tokens < cost) {
        return res.status(402).json({
          error: `Insufficient tokens. You need ${cost} token(s) to post a job.`,
          needed: cost,
          balance: employer.tokens,
        });
      }

      let canonicalLocation = locationInput ? smartCase(locationInput) : null;

      if (locationInput) {
        const curated = await prisma.locationOption.findFirst({
          where: {
            isActive: true,
            name: { equals: locationInput, mode: "insensitive" },
          },
          select: { name: true },
        });

        if (curated?.name) canonicalLocation = curated.name;
      }

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.updateMany({
          where: { id: employer.id, tokens: { gte: cost } },
          data: { tokens: { decrement: cost } },
        });

        if (updated.count !== 1) return { ok: false };

        const baseData = {
          title,
          description,
          category,
          type,
          location: canonicalLocation,
          workMode,
          status: deadlineAlreadyPassed ? "CLOSED" : "OPEN",
          companyId: employer.company.id,
          postedById: employer.id,
          applicationFields,
        };
        const withOptionalData = {
          ...baseData,
          ...(salary ? { salary } : {}),
          ...(applicationDeadline ? { applicationDeadline } : {}),
        };

        let job;
        try {
          job = await tx.job.create({ data: withOptionalData });
        } catch (err) {
          if (!isMissingSalaryOrDeadlineColumnError(err)) throw err;
          job = await tx.job.create({ data: baseData });
        }

        return { ok: true, job };
      });

      if (!result.ok) {
        return res.status(402).json({
          error: `Insufficient tokens. You need ${cost} token(s) to post a job.`,
          needed: cost,
        });
      }

      try {
        await logReferralActivity(
          employer.id,
          "JOB_POSTED",
          `Posted job: ${result.job.title}`,
          `${result.job.title} was posted with location ${result.job.location || "unspecified"}.`,
          { jobId: result.job.id }
        );
      } catch (activityError) {
        console.error("Referral activity logging failed:", activityError);
      }

      return res.status(201).json({ job: result.job });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Something went wrong" });
    }
  },
  ["EMPLOYER"]
);
