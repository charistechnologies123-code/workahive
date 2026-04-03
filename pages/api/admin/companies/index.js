import prisma from "../../../../lib/prisma";
import { requireAuth } from "../../../../lib/auth";

export default requireAuth(async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const companies = await prisma.company.findMany({
      orderBy: { id: "desc" },
      include: {
        owner: { select: { id: true, email: true, name: true } },
      },
    });
    return res.status(200).json({ companies });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Something went wrong" });
  }
}, ["ADMIN"]);