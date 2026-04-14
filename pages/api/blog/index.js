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
  if (req.method === "GET") {
    const includeDrafts = String(req.query.includeDrafts || "") === "true";
    const user = getUserFromRequest(req);

    const where = includeDrafts && user?.role === "ADMIN" ? {} : { published: true };
    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });

    return res.status(200).json({ posts });
  }

  if (req.method === "POST") {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const title = String(req.body?.title || "").trim();
    const excerpt = String(req.body?.excerpt || "").trim();
    const content = sanitizeBlogContent(req.body?.content);
    const published = Boolean(req.body?.published);

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    let slug = slugify(req.body?.slug || title);
    if (!slug) slug = `post-${Date.now()}`;

    let uniqueSlug = slug;
    let counter = 2;
    while (await prisma.blogPost.findUnique({ where: { slug: uniqueSlug }, select: { id: true } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter += 1;
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: uniqueSlug,
        excerpt: excerpt || null,
        content,
        published,
        publishedAt: published ? new Date() : null,
        authorId: user.id,
      },
    });

    return res.status(201).json({ post });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
