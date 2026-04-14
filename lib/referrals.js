import crypto from "crypto";
import prisma from "./prisma";
import { createNotification } from "./notifications";

export async function generateUniqueReferralCode(name = "workahive") {
  const base = String(name || "workahive")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 6) || "WORKA";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const code = `${base}${suffix}`;
    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }

  return `WH${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

export async function ensureUserReferralCode(userId, name) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (user?.referralCode) return user.referralCode;

  const code = await generateUniqueReferralCode(name);
  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: code },
  });
  return code;
}

export async function logReferralActivity(userId, type, title, description, metadata = null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referredById: true },
  });

  if (!user?.referredById) return null;

  return prisma.referralActivity.create({
    data: {
      userId,
      type,
      title,
      description,
      metadata: metadata || undefined,
    },
  });
}

export async function maybeNotifyReferralMilestone(referrerId) {
  const referrer = await prisma.user.findUnique({
    where: { id: referrerId },
    select: {
      id: true,
      name: true,
      referralMilestone10NotifiedAt: true,
      _count: { select: { referrals: true } },
    },
  });

  if (
    !referrer ||
    referrer.referralMilestone10NotifiedAt ||
    Number(referrer._count?.referrals || 0) < 10
  ) {
    return;
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  await prisma.user.update({
    where: { id: referrer.id },
    data: { referralMilestone10NotifiedAt: new Date() },
  });

  await Promise.all(
    admins.map((admin) =>
      createNotification(admin.id, "REFERRAL_MILESTONE", {
        referrerName: referrer.name || `User ${referrer.id}`,
        count: 10,
      })
    )
  );
}
