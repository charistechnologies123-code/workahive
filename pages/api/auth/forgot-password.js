import crypto from "crypto";
import prisma from "../../../lib/prisma";
import { sendPasswordResetEmail } from "../../../lib/mailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const successMessage = "If an account exists for that email, we'll send a reset link.";

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(200).json({ message: successMessage });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpires: expires,
      },
    });

    try {
      const result = await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        token,
      });

      if (result?.skipped) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetTokenHash: null,
            resetTokenExpires: null,
          },
        });
        console.warn("Password reset email skipped:", result.reason);
        return res.status(200).json({ message: successMessage });
      }
    } catch (emailError) {
      console.error("Password reset email failed:", emailError);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash: null,
          resetTokenExpires: null,
        },
      });
      return res.status(200).json({ message: successMessage });
    }

    return res.status(200).json({ message: successMessage });
  } catch (error) {
    console.error("Forgot password flow failed:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
