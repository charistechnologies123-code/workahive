import crypto from "crypto";
import prisma from "../../../lib/prisma";
import { sendVerificationEmail } from "../../../lib/mailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "No account found for this email" });
  }

  if (user.emailVerified) {
    return res.status(400).json({ error: "This email is already verified" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifyToken: token,
      emailVerifyExpires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  try {
    const result = await sendVerificationEmail({
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    });

    if (result?.skipped) {
      return res.status(503).json({
        error: result.reason || "Email delivery is not configured yet",
      });
    }
  } catch (error) {
    console.error("Resend verification email failed:", error);
    return res.status(502).json({
      error: error?.message || "Failed to send verification email",
    });
  }

  return res.status(200).json({ message: "Verification email sent." });
}
