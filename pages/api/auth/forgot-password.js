export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // ✅ Placeholder response (no SMTP yet)
  // Intentionally generic to prevent email enumeration
  return res.status(200).json({
    message: "If an account exists for that email, we’ll send a reset link.",
  });
}