import prisma from "../../../../lib/prisma";
import { requireAuth } from "../../../../lib/auth";

const messageInclude = {
  sender: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
};

function parseRoomId(value) {
  const roomId = Number(value);
  return Number.isInteger(roomId) && roomId > 0 ? roomId : null;
}

export default requireAuth(async function handler(req, res) {
  const roomId = parseRoomId(req.query.id);
  if (!roomId) {
    return res.status(400).json({ error: "Invalid room." });
  }

  const room = await prisma.chatRoom.findFirst({
    where: {
      id: roomId,
      members: {
        some: {
          userId: req.user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!room) {
    return res.status(404).json({ error: "Room not found." });
  }

  if (req.method === "GET") {
    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: messageInclude,
    }).then((rows) => rows.reverse());

    await prisma.chatMember.updateMany({
      where: {
        roomId,
        userId: req.user.id,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return res.status(200).json({ room, messages });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = String(req.body?.body || "").trim();
  if (!body) {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  const message = await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.chatMessage.create({
      data: {
        roomId,
        senderId: req.user.id,
        body,
      },
      include: messageInclude,
    });

    await tx.chatRoom.update({
      where: { id: roomId },
      data: {
        lastMessageAt: createdMessage.createdAt,
      },
    });

    await tx.chatMember.updateMany({
      where: {
        roomId,
        userId: req.user.id,
      },
      data: {
        lastReadAt: createdMessage.createdAt,
      },
    });

    return createdMessage;
  });

  return res.status(201).json({ message });
});
