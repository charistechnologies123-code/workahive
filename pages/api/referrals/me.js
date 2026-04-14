import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import { ensureUserReferralCode } from "../../../lib/referrals";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      referralCode: true,
      referrals: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          company: {
            select: {
              name: true,
              verified: true,
            },
          },
          jobs: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              title: true,
              _count: { select: { applications: true } },
            },
          },
          referralActivities: {
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
              id: true,
              title: true,
              description: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!me) {
    return res.status(404).json({ error: "User not found" });
  }

  const referralCode = me.referralCode || (await ensureUserReferralCode(me.id, me.name));

  return res.status(200).json({
    referralCode,
    referrals: me.referrals || [],
  });
}
