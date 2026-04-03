import prisma from "../../../../../lib/prisma";
import { getUserFromRequest } from "../../../../../lib/auth";

export default async function handler(req, res) {
  const admin = getUserFromRequest(req);
  if (!admin || admin.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = Number(req.query.id);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const { tokens } = req.body;

  // Accept "10" from inputs too (since frontend inputs often send strings)
  const tokensNum = Number(tokens);

  if (!Number.isFinite(tokensNum) || tokensNum < 0) {
    return res.status(400).json({ error: "tokens must be a number >= 0" });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { tokens: tokensNum },
      select: { id: true, email: true, role: true, tokens: true },
    });

    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update tokens" });
  }
}