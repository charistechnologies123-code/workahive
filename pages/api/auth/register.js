import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../../../lib/prisma";

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, password, role } = req.body;

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

    let emailVerified = true;
    let emailVerifiedAt = new Date();
    let emailVerifyToken = null;
    let emailVerifyExpires = null;

    if (finalRole === "JOBSEEKER") {
      emailVerified = false;
      emailVerifiedAt = null;
      emailVerifyToken = crypto.randomBytes(32).toString("hex");
      emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        passwordHash: hashed,
        role: finalRole,
        tokens: finalRole === "EMPLOYER" ? safeFreeTokens : 0,
        emailVerified,
        emailVerifiedAt,
        emailVerifyToken,
        emailVerifyExpires,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tokens: true,
        emailVerified: true,
      },
    });

    return res.status(201).json({
      ...user,
      message:
        finalRole === "JOBSEEKER"
          ? "Account created. Please verify your email."
          : "Account created successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}