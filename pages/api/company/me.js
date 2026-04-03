import prisma from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";

export default requireAuth(
  async function handler(req, res) {
    if (req.method !== "GET")
      return res.status(405).json({ error: "Method not allowed" });

    try {
      const company = await prisma.company.findUnique({
        where: { ownerId: req.user.id },
      });

      return res.status(200).json({ company });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Something went wrong" });
    }
  },
  ["EMPLOYER"]
);