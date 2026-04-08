import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const jwtUser = getUserFromRequest(req);
  if (!jwtUser || jwtUser.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    if (req.method === "GET") {
      // Admins can see ALL plans (active and inactive)
      const plans = await prisma.tokenPlan.findMany({
        orderBy: { tokens: "asc" },
      });
      return res.status(200).json(plans);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Admin token plans error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
