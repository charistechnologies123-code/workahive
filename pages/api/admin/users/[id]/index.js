import prisma from "../../../../../lib/prisma";
import { getUserFromRequest } from "../../../../../lib/auth";

export default async function handler(req, res) {
  const admin = getUserFromRequest(req);

  if (!admin || admin.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = Number(req.query.id);

  if (!Number.isFinite(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, emailVerified: true },
    });

    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.method === "PATCH") {
      const { emailVerified } = req.body || {};

      if (typeof emailVerified !== "boolean") {
        return res.status(400).json({ error: "Invalid email verification value" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified,
          emailVerifiedAt: emailVerified ? new Date() : null,
          emailVerifyToken: null,
          emailVerifyExpires: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          role: true,
          tokens: true,
          createdAt: true,
        },
      });

      return res.json({ user: updatedUser });
    }

    if (req.method !== "DELETE") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (userId === Number(admin.id)) {
      return res.status(400).json({ error: "You cannot delete your own account." });
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
    return res.status(500).json({
      error: req.method === "PATCH" ? "Failed to update user." : "Failed to delete user.",
    });
  }
}
