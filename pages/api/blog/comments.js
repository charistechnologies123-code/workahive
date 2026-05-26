import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

const normalizeBody = (value) => {
  if (typeof value !== "string") return null;
  const clean = value.trim().replace(/\s+/g, " ");
  if (!clean) return null;
  return clean.slice(0, 2000);
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const postId = Number(req.query.postId);
    if (!Number.isFinite(postId)) {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const comments = await prisma.blogComment.findMany({
      where: { postId, parentId: null },
      include: {
        user: { select: { id: true, name: true, role: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ comments });
  }

  if (req.method === "POST") {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: "Login required" });

    const postId = Number(req.body?.postId);
    const parentId = req.body?.parentId == null ? null : Number(req.body.parentId);
    const body = normalizeBody(req.body?.body);

    if (!Number.isFinite(postId) || !body) {
      return res.status(400).json({ error: "Post id and comment are required" });
    }

    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, published: true },
    });
    if (!post || !post.published) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (parentId != null) {
      if (user.role !== "ADMIN") {
        return res.status(403).json({ error: "Only admins can reply to comments" });
      }
      const parent = await prisma.blogComment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true, parentId: true },
      });
      if (!parent || parent.postId !== postId || parent.parentId != null) {
        return res.status(400).json({ error: "Invalid parent comment" });
      }
    }

    const comment = await prisma.blogComment.create({
      data: {
        postId,
        userId: user.id,
        parentId,
        body,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    return res.status(201).json({ comment });
  }

  if (req.method === "DELETE") {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = Number(req.query.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid comment id" });
    }

    await prisma.blogComment.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
