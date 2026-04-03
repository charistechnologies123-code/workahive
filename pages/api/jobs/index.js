// pages/api/jobs/index.js
import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

const ALLOWED_STATUSES = new Set(["OPEN", "CLOSED", "ALL"]);
const ALLOWED_WORK_MODES = new Set(["REMOTE", "HYBRID", "ONSITE"]);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = getUserFromRequest(req);

  const q = (req.query.q || "").toString().trim();
  const location = (req.query.location || "").toString().trim();
  const category = (req.query.category || "").toString().trim();
  const type = (req.query.type || "").toString().trim();
  const workMode = (req.query.workMode || "").toString().trim().toUpperCase();
  const statusFilter = (req.query.status || "").toString().trim().toUpperCase();

  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "12", 10), 1), 50);
  const skip = (page - 1) * limit;

  try {
    const andConditions = [];

    // ----------------------------
    // Role-based visibility
    // ----------------------------
    if (user?.role === "ADMIN") {
      if (ALLOWED_STATUSES.has(statusFilter) && statusFilter !== "ALL") {
        andConditions.push({ status: statusFilter });
      }
    } else if (user?.role === "EMPLOYER") {
      andConditions.push({ postedById: user.id });

      if (ALLOWED_STATUSES.has(statusFilter) && statusFilter !== "ALL") {
        andConditions.push({ status: statusFilter });
      }
    } else {
      // Guests + job seekers: only live jobs
      andConditions.push({ status: "OPEN" });
    }

    // ----------------------------
    // Structured filters
    // ----------------------------
    if (location) {
      andConditions.push({
        location: {
          contains: location,
          mode: "insensitive",
        },
      });
    }

    if (category) {
      andConditions.push({
        category: {
          contains: category,
          mode: "insensitive",
        },
      });
    }

    if (type) {
      andConditions.push({
        type: {
          contains: type,
          mode: "insensitive",
        },
      });
    }

    if (workMode && ALLOWED_WORK_MODES.has(workMode)) {
      andConditions.push({ workMode });
    }

    // ----------------------------
    // Keyword search across words
    // Each word must match somewhere
    // ----------------------------
    if (q) {
      const searchWords = q.split(/\s+/).filter(Boolean);

      for (const word of searchWords) {
        const lowerWord = word.toLowerCase();

        andConditions.push({
          OR: [
            { title: { contains: word, mode: "insensitive" } },
            { description: { contains: word, mode: "insensitive" } },
            { category: { contains: word, mode: "insensitive" } },
            { type: { contains: word, mode: "insensitive" } },
            { location: { contains: word, mode: "insensitive" } },
            { company: { name: { contains: word, mode: "insensitive" } } },
            { company: { industry: { contains: word, mode: "insensitive" } } },

            ...(lowerWord === "remote" ? [{ workMode: "REMOTE" }] : []),
            ...(lowerWord === "hybrid" ? [{ workMode: "HYBRID" }] : []),
            ...(lowerWord === "onsite" || lowerWord === "on-site"
              ? [{ workMode: "ONSITE" }]
              : []),
          ],
        });
      }
    }

    const where = andConditions.length ? { AND: andConditions } : {};

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          company: true,
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    const formattedJobs = jobs.map((job) => ({
      ...job,
      applicantsCount: job._count?.applications || 0,
    }));

    return res.status(200).json({
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/jobs error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
