import prisma from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";

export default requireAuth(async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: req.user.id },
    },
    orderBy: [
      { name: "asc" },
      { email: "asc" },
    ],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return res.status(200).json({ users });
});
