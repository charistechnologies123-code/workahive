import prisma from "../../../../../lib/prisma";
import { getUserFromRequest } from "../../../../../lib/auth";

export default async function handler(req, res) {
  const admin = getUserFromRequest(req);

  if (!admin || admin.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = Number(req.query.id);

  if (!Number.isFinite(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  if (userId === Number(admin.id)) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    if (target.role === "ADMIN") {
      return res.status(400).json({ error: "You cannot delete another admin account." });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete user." });
  }
}