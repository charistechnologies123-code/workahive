import prisma from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import sanitizeHtml from "sanitize-html";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sanitizeBlogContent(value) {
  return sanitizeHtml(String(value || ""), {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "a",
      "img",
      "blockquote",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  }).trim();
}

export default async function handler(req, res) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = Number(req.query.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  if (req.method === "PATCH") {
    const title = String(req.body?.title || "").trim();
    const excerpt = String(req.body?.excerpt || "").trim();
    const content = sanitizeBlogContent(req.body?.content);
    const published = Boolean(req.body?.published);
    const slugInput = String(req.body?.slug || title).trim();

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const baseSlug = slugify(slugInput || title) || `post-${Date.now()}`;
    let uniqueSlug = baseSlug;
    let counter = 2;
    while (
      await prisma.blogPost.findFirst({
        where: {
          slug: uniqueSlug,
          id: { not: id },
        },
        select: { id: true },
      })
    ) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug: uniqueSlug,
        excerpt: excerpt || null,
        content,
        published,
        publishedAt: published ? new Date() : null,
      },
    });

    return res.status(200).json({ post });
  }

  if (req.method === "DELETE") {
    await prisma.blogPost.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
