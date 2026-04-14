import { requireAuth } from "../../../lib/auth";
import { sendEmail } from "../../../lib/mailer";

export default requireAuth(async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const to = String(req.body?.to || "").trim().toLowerCase();
  if (!to) {
    return res.status(400).json({ error: "Recipient email is required" });
  }

  try {
    const result = await sendEmail({
      to,
      subject: "WorkaHive test email",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
          <h2 style="margin-bottom:8px;">WorkaHive email test</h2>
          <p>This is a delivery test from your admin dashboard.</p>
          <p>If you received this, Resend and your sender configuration are working.</p>
        </div>
      `,
    });

    if (result?.skipped) {
      return res.status(503).json({
        error: result.reason || "Email delivery is not configured yet.",
      });
    }

    return res.status(200).json({
      message: `Test email sent to ${to}.`,
    });
  } catch (error) {
    console.error("Admin test email failed:", error);
    return res.status(502).json({
      error: error?.message || "Failed to send test email",
    });
  }
}, ["ADMIN"]);
