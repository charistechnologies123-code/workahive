import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const user = getUserFromRequest(req);

  const postId = Number(req.method === "GET" ? req.query.postId : req.body?.postId);
  if (!Number.isFinite(postId)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  if (req.method === "GET") {
    const [likesCount, likedByMe] = await Promise.all([
      prisma.blogLike.count({ where: { postId } }),
      user?.id
        ? prisma.blogLike.findFirst({
            where: { postId, userId: Number(user.id) },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    return res.status(200).json({ likesCount, likedByMe: Boolean(likedByMe) });
  }

  if (req.method === "POST") {
    if (!user) {
      return res.status(401).json({ error: "Login required" });
    }

    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, published: true },
    });
    if (!post || !post.published) {
      return res.status(404).json({ error: "Post not found" });
    }

    const existing = await prisma.blogLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: Number(user.id),
        },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.blogLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.blogLike.create({
        data: {
          postId,
          userId: Number(user.id),
        },
      });
    }

    const likesCount = await prisma.blogLike.count({ where: { postId } });
    return res.status(200).json({ likesCount, likedByMe: !existing });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
