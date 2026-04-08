import prisma from "../../lib/prisma";
import { getUserFromRequest, requireAuth } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Anyone can see active plans for purchasing
    const plans = await prisma.tokenPlan.findMany({
      where: { isActive: true },
      orderBy: { tokens: "asc" },
    });
    return res.status(200).json(plans);
  }

  // Only admin can POST, PUT, DELETE
  const jwtUser = getUserFromRequest(req);
  if (!jwtUser || jwtUser.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    if (req.method === "POST") {
      const { tokens, price } = req.body;

      if (!tokens || !price) {
        return res.status(400).json({ error: "Tokens and price are required" });
      }

      const newPlan = await prisma.tokenPlan.create({
        data: {
          tokens: parseInt(tokens),
          price: parseInt(price),
          isActive: true,
        },
      });
      return res.status(201).json(newPlan);
    }

    if (req.method === "PUT") {
      const { id, tokens, price, isActive } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      const updatedPlan = await prisma.tokenPlan.update({
        where: { id },
        data: {
          tokens: tokens ? parseInt(tokens) : undefined,
          price: price ? parseInt(price) : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
        },
      });
      return res.status(200).json(updatedPlan);
    }

    if (req.method === "DELETE") {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      await prisma.tokenPlan.delete({
        where: { id },
      });
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Token plan error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}