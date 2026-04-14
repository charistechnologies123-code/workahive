import prisma from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";
import { createNotification } from "../../../../lib/notifications";
import { logReferralActivity } from "../../../../lib/referrals";

export default async function handler(req, res) {
  const me = getUserFromRequest(req);
  if (!me || me.role !== "ADMIN") return res.status(401).json({ error: "Unauthorized" });

  const id = Number(req.query.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  if (req.method === "GET") {
    try {
      const company = await prisma.company.findUnique({
        where: { id },
        include: {
          owner: { select: { id: true, name: true, email: true, tokens: true } },
          jobs: { select: { id: true, title: true, status: true, createdAt: true }, orderBy: { id: "desc" }, take: 10 },
        },
      });

      if (!company) return res.status(404).json({ error: "Company not found" });
      return res.status(200).json({ company });
    } catch {
      return res.status(500).json({ error: "Failed to load company" });
    }
  }

  if (req.method === "PATCH") {
    const { verified } = req.body || {};
    if (typeof verified !== "boolean") return res.status(400).json({ error: "verified must be boolean" });

    try {
      const company = await prisma.company.update({
        where: { id },
        data: { verified },
        include: { owner: { select: { id: true, name: true } } },
      });

      if (verified && company.owner?.id) {
        await createNotification(company.owner.id, "COMPANY_VERIFIED", {
          companyName: company.name,
        });
        await logReferralActivity(
          company.owner.id,
          "COMPANY_VERIFIED",
          "Company profile verified",
          `${company.name} has been verified by admin.`,
          { companyId: company.id }
        );
      }

      return res.status(200).json({ company });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update company" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
