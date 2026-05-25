import prisma from "../../../lib/prisma";
import { getAuthenticatedUser } from "../../../lib/auth";

export default async function handler(req, res) {
  const auth = await getAuthenticatedUser(req);
  if (auth.error) {
    return res.status(auth.error.status).json(auth.error.body);
  }

  const user = auth.user;

  try {
    if (req.method === "GET") {
      const { limit = 50, skip = 0 } = req.query;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: parseInt(limit, 10),
          skip: parseInt(skip, 10),
        }),
        prisma.notification.count({
          where: { userId: user.id },
        }),
        prisma.notification.count({
          where: { userId: user.id, read: false },
        }),
      ]);

      return res.status(200).json({
        notifications,
        total,
        unreadCount,
      });
    }

    if (req.method === "PUT") {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: "Invalid request" });
      }

      await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          userId: user.id,
        },
        data: { read: true },
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: user.id, read: false },
      });

      return res.status(200).json({ success: true, unreadCount });
    }

    if (req.method === "DELETE") {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Notification ID required" });
      }

      await prisma.notification.deleteMany({
        where: {
          id: parseInt(id, 10),
          userId: user.id,
        },
      });

      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Notification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
