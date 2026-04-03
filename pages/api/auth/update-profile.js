import prisma from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";

export default requireAuth(async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email } = req.body || {};

  if (email !== undefined) {
    return res.status(403).json({
      error: "Email cannot be changed. Contact admin for formal update requests.",
    });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name ?? undefined,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.status(200).json({ user: updated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Something went wrong" });
  }
});