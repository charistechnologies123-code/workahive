import prisma from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Verification token is required" });
  }

  try {
    // Find user with this token and check expiry
    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerified: false,
        emailVerifyExpires: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}