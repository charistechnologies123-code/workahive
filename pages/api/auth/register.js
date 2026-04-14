// pages/api/auth/register.js
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../../../lib/prisma";
import { generateUniqueReferralCode, maybeNotifyReferralMilestone } from "../../../lib/referrals";
import { sendVerificationEmail } from "../../../lib/mailer";

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, password, role, referralCode } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  const finalRole = role || "JOBSEEKER";

  if (!["EMPLOYER", "JOBSEEKER"].includes(finalRole)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  if (!strongPasswordRegex.test(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
    });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const trimmedName = String(name).trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const freeSetting = await prisma.appSetting.findUnique({
      where: { key: "FREE_TOKENS_NEW_EMPLOYER" },
      select: { valueInt: true },
    });

    const freeTokens = Number(freeSetting?.valueInt ?? 0);
    const safeFreeTokens =
      Number.isFinite(freeTokens) && freeTokens >= 0 ? freeTokens : 0;

    const trimmedReferralCode = String(referralCode || "").trim().toUpperCase();
    let referrer = null;
    if (trimmedReferralCode) {
      referrer = await prisma.user.findUnique({
        where: { referralCode: trimmedReferralCode },
        select: { id: true },
      });

      if (!referrer) {
        return res.status(400).json({ error: "Invalid referral code" });
      }
    }

    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    const emailVerifyExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const generatedReferralCode = await generateUniqueReferralCode(trimmedName);

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        passwordHash: hashed,
        role: finalRole,
        tokens: finalRole === "EMPLOYER" ? safeFreeTokens : 0,
        referralCode: generatedReferralCode,
        referredById: referrer?.id ?? null,
        emailVerified: false,
        emailVerifiedAt: null,
        emailVerifyToken,
        emailVerifyExpires,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tokens: true,
        referralCode: true,
        emailVerified: true,
      },
    });

    let emailStatus = { sent: false, skipped: false, error: null };
    try {
      const result = await sendVerificationEmail({
        email: normalizedEmail,
        name: trimmedName,
        role: finalRole,
        token: emailVerifyToken,
      });
      emailStatus = {
        sent: !result?.skipped,
        skipped: Boolean(result?.skipped),
        error: result?.reason || null,
      };
    } catch (emailError) {
      console.error("Verification email failed:", emailError);
      emailStatus = {
        sent: false,
        skipped: false,
        error: emailError?.message || "Failed to send verification email",
      };
    }

    if (referrer?.id) {
      await maybeNotifyReferralMilestone(referrer.id);
    }

    return res.status(201).json({
      ...user,
      message: "Account created. Please verify your email before logging in.",
      verificationEmailSent: emailStatus.sent,
      verificationEmailSkipped: emailStatus.skipped,
      verificationEmailError: emailStatus.error,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
