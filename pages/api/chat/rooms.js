import prisma from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";

const roomInclude = {
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
  messages: {
    take: 1,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
};

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function loadRooms(userId) {
  const rooms = await prisma.chatRoom.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: roomInclude,
    orderBy: [
      { lastMessageAt: "desc" },
      { updatedAt: "desc" },
    ],
  });

  const summaries = await Promise.all(
    rooms.map(async (room) => {
      const selfMembership = room.members.find((member) => member.userId === userId);
      const unreadWhere = {
        roomId: room.id,
        senderId: { not: userId },
      };

      if (selfMembership?.lastReadAt) {
        unreadWhere.createdAt = { gt: selfMembership.lastReadAt };
      }

      const unreadCount = await prisma.chatMessage.count({ where: unreadWhere });

      return {
        ...room,
        unreadCount,
      };
    })
  );

  return summaries;
}

export default requireAuth(async function handler(req, res) {
  if (req.method === "GET") {
    const rooms = await loadRooms(req.user.id);
    return res.status(200).json({ rooms });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const type = String(req.body?.type || "DIRECT").toUpperCase();

  if (type === "DIRECT") {
    const participantId = parseId(req.body?.participantId);
    if (!participantId) {
      return res.status(400).json({ error: "Please choose a person to chat with." });
    }

    if (participantId === req.user.id) {
      return res.status(400).json({ error: "You cannot chat with yourself." });
    }

    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        type: "DIRECT",
        AND: [
          {
            members: {
              some: {
                userId: req.user.id,
              },
            },
          },
          {
            members: {
              some: {
                userId: participantId,
              },
            },
          },
          {
            members: {
              every: {
                userId: {
                  in: [req.user.id, participantId],
                },
              },
            },
          },
        ],
      },
      include: roomInclude,
    });

    if (existingRoom) {
      return res.status(200).json({ room: existingRoom });
    }

    const room = await prisma.chatRoom.create({
      data: {
        type: "DIRECT",
        createdById: req.user.id,
        members: {
          create: [
            { userId: req.user.id },
            { userId: participantId },
          ],
        },
      },
      include: roomInclude,
    });

    return res.status(201).json({ room });
  }

  const rawParticipantIds = Array.isArray(req.body?.participantIds)
    ? req.body.participantIds
    : [];
  const participantIds = [...new Set(rawParticipantIds.map(parseId).filter(Boolean))].filter(
    (id) => id !== req.user.id
  );
  const title = String(req.body?.title || "").trim();

  if (participantIds.length === 0) {
    return res.status(400).json({ error: "Select at least one other member." });
  }

  const room = await prisma.chatRoom.create({
    data: {
      type: "GROUP",
      title: title || null,
      createdById: req.user.id,
      members: {
        create: [
          { userId: req.user.id },
          ...participantIds.map((userId) => ({ userId })),
        ],
      },
    },
    include: roomInclude,
  });

  return res.status(201).json({ room });
});
