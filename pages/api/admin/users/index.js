import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";

export default async function handler(req, res) {
  const admin = getUserFromRequest(req);
  if (!admin || admin.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const q = (req.query.q || "").toString().trim();
  const role = (req.query.role || "ALL").toString().toUpperCase();

  const where = {};

  // Optional role filter
  if (role !== "ALL") {
    where.role = role; // ADMIN | EMPLOYER | JOBSEEKER
  }

  // Optional search
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tokens: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return res.json({ users });
}