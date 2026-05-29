export function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getBlogExcerpt(post, maxLength = 180) {
  const explicitExcerpt = String(post?.excerpt || "").trim();
  if (explicitExcerpt) return explicitExcerpt;

  const fallback = stripHtml(post?.content || "");
  if (!fallback) return "";
  return fallback.length > maxLength ? `${fallback.slice(0, maxLength).trim()}...` : fallback;
}

export function getBlogPreviewImage(post) {
  const content = String(post?.content || "");
  const match = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  return match ? match[1] : "";
}
