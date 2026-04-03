import prisma from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";

export default requireAuth(async function handler(req, res) {
  if (req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });

  const user = req.user;
  if (user.role !== "EMPLOYER") return res.status(403).json({ error: "Employers only" });

  const { name, description, industry, location } = req.body;

  try {
    const existing = await prisma.company.findUnique({ where: { ownerId: user.id } });
    if (!existing) return res.status(404).json({ error: "Company profile not found" });

    const updated = await prisma.company.update({
      where: { ownerId: user.id },
      data: {
        name: name ?? existing.name,
        description: description ?? existing.description,
        industry: industry ?? existing.industry,
        location: location ?? existing.location,
      },
    });

    return res.status(200).json({ company: updated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Something went wrong" });
  }
}, ["EMPLOYER"]);