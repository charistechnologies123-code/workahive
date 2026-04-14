const RESEND_API_URL = "https://api.resend.com/emails";

function getBaseUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function buildVerifyEmailHtml({ name, role, verifyUrl }) {
  const intro =
    role === "EMPLOYER"
      ? "Welcome to WorkaHive. Verify your email to activate your employer account and then create your company profile."
      : "Welcome to WorkaHive. Verify your email to activate your job seeker account and start applying.";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
      <h2 style="margin-bottom:8px;">Welcome to WorkaHive, ${name}</h2>
      <p>${intro}</p>
      <p>
        <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
          Verify Email
        </a>
      </p>
      <p>If the button does not work, open this link:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    </div>
  `;
}

export function buildWelcomeEmailHtml({ name, role }) {
  const body =
    role === "EMPLOYER"
      ? "Your account is ready. Next step: create your company profile so admin can verify it and you can start posting jobs."
      : "Your account is ready. You can now browse jobs, save openings, and apply with confidence.";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
      <h2 style="margin-bottom:8px;">Hi ${name}, welcome to WorkaHive</h2>
      <p>${body}</p>
      <p>Thank you for joining us.</p>
    </div>
  `;
}

export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    const reason = "Email skipped because RESEND_API_KEY or EMAIL_FROM is not configured.";
    console.log(reason);
    return { skipped: true, reason };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to send email");
  }

  return response.json();
}

export async function sendVerificationEmail({ email, name, role, token }) {
  const verifyUrl = `${getBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: email,
    subject: "Verify your WorkaHive email",
    html: buildVerifyEmailHtml({ name, role, verifyUrl }),
  });
}

export async function sendWelcomeEmail({ email, name, role }) {
  return sendEmail({
    to: email,
    subject: "Welcome to WorkaHive",
    html: buildWelcomeEmailHtml({ name, role }),
  });
}
