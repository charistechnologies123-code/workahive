import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const jwtUser = getUserFromRequest(req);
  if (!jwtUser) return res.status(200).json({ user: null });

  try {
    // Pull full user from DB so UI can see tokens/name/etc
    const user = await prisma.user.findUnique({
      where: { id: Number(jwtUser.id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tokens: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ user: user || null });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Something went wrong" });
  }
}