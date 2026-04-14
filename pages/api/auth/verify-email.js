import prisma from "../../../lib/prisma";
import { createNotification } from "../../../lib/notifications";
import { sendWelcomeEmail } from "../../../lib/mailer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = String(req.query.token || "").trim();
  if (!token) {
    return res.status(400).json({ error: "Verification token is required" });
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ error: "This verification link is invalid or has expired." });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  try {
    await createNotification(updated.id, "WELCOME", {
      userName: updated.name,
      role: updated.role,
    });
    await sendWelcomeEmail({
      email: updated.email,
      name: updated.name,
      role: updated.role,
    });
  } catch (error) {
    console.error("Post-verification welcome flow failed:", error);
  }

  return res.status(200).json({ message: "Email verified successfully." });
}
