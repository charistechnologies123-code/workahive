const MAINTENANCE_COOKIE = "workahive_maintenance_bypass";
const BYPASS_DURATION_SECONDS = 60 * 60 * 8;

function buildCookie(value) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${MAINTENANCE_COOKIE}=${encodeURIComponent(
    value
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${BYPASS_DURATION_SECONDS}${secure}`;
}

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const expectedKey = process.env.MAINTENANCE_BYPASS_KEY;

  if (!expectedKey) {
    return res.status(404).json({ error: "Bypass is not configured" });
  }

  const key = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;
  const nextPath = Array.isArray(req.query.next) ? req.query.next[0] : req.query.next;

  if (key !== expectedKey) {
    return res.status(401).json({ error: "Invalid bypass key" });
  }

  const redirectTarget =
    typeof nextPath === "string" && nextPath.startsWith("/") ? nextPath : "/";

  res.setHeader("Set-Cookie", buildCookie(expectedKey));
  res.redirect(302, redirectTarget);
}
