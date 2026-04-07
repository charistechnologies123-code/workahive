import { sendWelcomeEmail } from "../../lib/email";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, name } = req.body;

  try {
    await sendWelcomeEmail(email, name);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Email failed" });
  }
}