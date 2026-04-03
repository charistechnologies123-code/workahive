import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";

export default async function handler(req, res) {
  const admin = getUserFromRequest(req);
  if (!admin || admin.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const locations = await prisma.locationOption.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });
    return res.json({ locations });
  }

  if (req.method === "POST") {
    const name = (req.body?.name || "").toString().trim();
    if (!name) return res.status(400).json({ error: "Name is required" });

    try {
      const location = await prisma.locationOption.upsert({
        where: { name },
        update: { isActive: true },
        create: { name, isActive: true },
      });

      return res.status(201).json({ location });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to create location" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}