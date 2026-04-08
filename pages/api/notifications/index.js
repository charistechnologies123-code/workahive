import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const jwtUser = getUserFromRequest(req);
  if (!jwtUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const { limit = 50, skip = 0 } = req.query;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: jwtUser.id },
          orderBy: { createdAt: "desc" },
          take: parseInt(limit),
          skip: parseInt(skip),
        }),
        prisma.notification.count({
          where: { userId: jwtUser.id },
        }),
        prisma.notification.count({
          where: { userId: jwtUser.id, read: false },
        }),
      ]);

      return res.status(200).json({
        notifications,
        total,
        unreadCount,
      });
    }

    if (req.method === "PUT") {
      const { ids } = req.body; // Mark multiple as read

      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: "Invalid request" });
      }

      await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          userId: jwtUser.id,
        },
        data: { read: true },
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: jwtUser.id, read: false },
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
          id: parseInt(id),
          userId: jwtUser.id,
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
