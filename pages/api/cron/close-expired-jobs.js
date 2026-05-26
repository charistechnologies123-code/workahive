import { closeExpiredJobs } from "../../../lib/job-expiry";

const isAuthorizedCronRequest = (req) => {
  const cronHeader = String(req.headers["x-vercel-cron"] || "").toLowerCase();
  if (cronHeader === "1" || cronHeader === "true") return true;

  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const provided = String(req.headers["x-cron-secret"] || "");
  return provided && provided === secret;
};

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorizedCronRequest(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const closedCount = await closeExpiredJobs();
  return res.status(200).json({ ok: true, closedCount });
}
