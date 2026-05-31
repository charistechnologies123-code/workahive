import prisma from "../../../lib/prisma";
import { getAuthenticatedUser } from "../../../lib/auth";
import { ensureUserReferralCode } from "../../../lib/referrals";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await getAuthenticatedUser(req);
  if (auth.error) {
    return res.status(auth.error.status).json(auth.error.body);
  }

  const user = auth.user;

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
          tokens: true,
          company: {
            select: {
              name: true,
              verified: true,
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
  const referrals = await Promise.all(
    (me.referrals || []).map(async (referral) => {
      if (referral.role === "EMPLOYER") {
        const jobsPosted = await prisma.job.count({
          where: { postedById: referral.id },
        });

        return {
          ...referral,
          jobsPosted,
        };
      }

      if (referral.role === "JOBSEEKER") {
        const [totalApplications, shortlistedApplications] = await Promise.all([
          prisma.application.count({
            where: { applicantId: referral.id },
          }),
          prisma.application.count({
            where: { applicantId: referral.id, status: "SHORTLISTED" },
          }),
        ]);

        return {
          ...referral,
          totalApplications,
          shortlistedApplications,
        };
      }

      return referral;
    })
  );

  return res.status(200).json({
    referralCode,
    referrals,
  });
}
