import prisma from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // return only active plans
    const plans = await prisma.tokenPlan.findMany({
      where: { isActive: true },
      orderBy: { tokens: "asc" },
    });
    return res.status(200).json(plans);
  }

  // Only admin can POST, PUT, DELETE
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    const { role } = req.headers; // simple auth header (replace with your auth)
    if (role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });

    if (req.method === "POST") {
      const { tokens, price } = req.body;
      const newPlan = await prisma.tokenPlan.create({ data: { tokens, price } });
      return res.status(201).json(newPlan);
    }

    if (req.method === "PUT") {
      const { id, tokens, price, isActive } = req.body;
      const updatedPlan = await prisma.tokenPlan.update({
        where: { id },
        data: { tokens, price, isActive },
      });
      return res.status(200).json(updatedPlan);
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      await prisma.tokenPlan.delete({ where: { id } });
      return res.status(204).end();
    }
  }

  res.status(405).end();
}