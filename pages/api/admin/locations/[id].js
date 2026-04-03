import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";

export default async function handler(req, res) {
  const admin = getUserFromRequest(req);
  if (!admin || admin.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = Number(req.query.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  if (req.method === "PATCH") {
    const isActive = Boolean(req.body?.isActive);
    try {
      const location = await prisma.locationOption.update({
        where: { id },
        data: { isActive },
      });
      return res.json({ location });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to update location" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.locationOption.delete({ where: { id } });
      return res.json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to delete location" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}