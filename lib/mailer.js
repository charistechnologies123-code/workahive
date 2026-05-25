const RESEND_API_URL = "https://api.resend.com/emails";
const APP_NAME = "WorkaHive";

function getBaseUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function getAdminNotificationRecipients() {
  const raw = String(process.env.ADMIN_NOTIFICATION_EMAILS || "");

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function wrapEmailHtml(content) {
  return `
    <div style="background:#f3f4f6;padding:24px 12px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;padding:32px 24px;font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
        ${content}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;" />
        <p style="margin:0;font-size:13px;color:#6b7280;">${APP_NAME}</p>
      </div>
    </div>
  `;
}

function buildActionButton(label, url, background = "#2563eb") {
  return `
    <p>
      <a href="${url}" style="display:inline-block;background:${background};color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
        ${label}
      </a>
    </p>
    <p>If the button does not work, open this link:</p>
    <p><a href="${url}">${url}</a></p>
  `;
}

export function buildVerifyEmailHtml({ name, role, verifyUrl }) {
  const intro =
    role === "EMPLOYER"
      ? "Welcome to WorkaHive. Verify your email to activate your employer account and then create your company profile."
      : "Welcome to WorkaHive. Verify your email to activate your job seeker account and start applying.";

  return wrapEmailHtml(`
      <h2 style="margin-bottom:8px;">Welcome to WorkaHive, ${name}</h2>
      <p>${intro}</p>
      ${buildActionButton("Verify Email", verifyUrl)}
  `);
}

export function buildVerifyEmailText({ role, verifyUrl }) {
  const intro =
    role === "EMPLOYER"
      ? "Verify your email to activate your employer account and create your company profile."
      : "Verify your email to activate your job seeker account and start applying.";

  return `Welcome to ${APP_NAME}.

${intro}

Verify your email: ${verifyUrl}`;
}

export function buildWelcomeEmailHtml({ name, role }) {
  const body =
    role === "EMPLOYER"
      ? "Your account is ready. Next step: create your company profile so admin can verify it and you can start posting jobs."
      : "Your account is ready. You can now browse jobs, save openings, and apply with confidence.";

  return wrapEmailHtml(`
      <h2 style="margin-bottom:8px;">Hi ${name}, welcome to WorkaHive</h2>
      <p>${body}</p>
      <p>Thank you for joining us.</p>
  `);
}

export function buildWelcomeEmailText({ role }) {
  const body =
    role === "EMPLOYER"
      ? "Your account is ready. Next step: create your company profile so admin can verify it and you can start posting jobs."
      : "Your account is ready. You can now browse jobs, save openings, and apply with confidence.";

  return `Welcome to ${APP_NAME}.

${body}

Thank you for joining us.`;
}

export function buildPasswordResetEmailHtml({ name, resetUrl }) {
  return wrapEmailHtml(`
      <h2 style="margin-bottom:8px;">Reset your WorkaHive password</h2>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <p>This link expires in 1 hour.</p>
      ${buildActionButton("Reset Password", resetUrl, "#111827")}
      <p>If you did not request a password reset, you can safely ignore this email.</p>
  `);
}

export function buildPasswordResetEmailText({ name, resetUrl }) {
  return `Hi ${name},

We received a request to reset your ${APP_NAME} password.

This link expires in 1 hour:
${resetUrl}

If you did not request this, you can safely ignore this email.`;
}

export function buildCompanyVerifiedEmailHtml({ name, companyName, dashboardUrl }) {
  return wrapEmailHtml(`
      <h2 style="margin-bottom:8px;">Your company is verified</h2>
      <p>Hi ${name}, your company <strong>${companyName}</strong> has been verified successfully.</p>
      <p>You can now post jobs on WorkaHive.</p>
      ${buildActionButton("Open Employer Dashboard", dashboardUrl, "#059669")}
  `);
}

export function buildCompanyVerifiedEmailText({ companyName, dashboardUrl }) {
  return `Your company "${companyName}" has been verified successfully.

You can now post jobs on ${APP_NAME}.

Open your employer dashboard: ${dashboardUrl}`;
}

export function buildNewApplicationEmailHtml({ name, applicantName, jobTitle, applicationsUrl }) {
  return wrapEmailHtml(`
      <h2 style="margin-bottom:8px;">New application received</h2>
      <p>Hi ${name}, <strong>${applicantName}</strong> just applied for <strong>${jobTitle}</strong>.</p>
      <p>Review the application from your employer dashboard.</p>
      ${buildActionButton("Review Applications", applicationsUrl, "#111827")}
  `);
}

export function buildNewApplicationEmailText({ applicantName, jobTitle, applicationsUrl }) {
  return `${applicantName} just applied for "${jobTitle}".

Review applications here: ${applicationsUrl}`;
}

export function buildAdminCompanyPendingEmailHtml({ companyName, ownerName, companiesUrl }) {
  return wrapEmailHtml(`
      <h2 style="margin-bottom:8px;">Company awaiting verification</h2>
      <p>A new company profile has been created on WorkaHive and needs admin review.</p>
      <p><strong>Company:</strong> ${companyName}</p>
      <p><strong>Owner:</strong> ${ownerName}</p>
      ${buildActionButton("Review Companies", companiesUrl, "#7c3aed")}
  `);
}

export function buildAdminCompanyPendingEmailText({ companyName, ownerName, companiesUrl }) {
  return `A new company profile needs verification.

Company: ${companyName}
Owner: ${ownerName}

Review companies: ${companiesUrl}`;
}

export function buildApplicationStatusEmailHtml({ name, jobTitle, status, jobsUrl }) {
  const isShortlisted = status === "SHORTLISTED";
  const heading = isShortlisted ? "You were shortlisted" : "Application update";
  const message = isShortlisted
    ? `Hi ${name}, great news. You have been shortlisted for <strong>${jobTitle}</strong>.`
    : `Hi ${name}, your application for <strong>${jobTitle}</strong> was not selected this time.`;
  const buttonLabel = isShortlisted ? "View Your Job Activity" : "Browse More Jobs";
  const buttonColor = isShortlisted ? "#059669" : "#2563eb";

  return wrapEmailHtml(`
      <h2 style="margin-bottom:8px;">${heading}</h2>
      <p>${message}</p>
      ${buildActionButton(buttonLabel, jobsUrl, buttonColor)}
  `);
}

export function buildApplicationStatusEmailText({ jobTitle, status, jobsUrl }) {
  const isShortlisted = status === "SHORTLISTED";
  const message = isShortlisted
    ? `You have been shortlisted for "${jobTitle}".`
    : `Your application for "${jobTitle}" was not selected this time.`;

  return `${message}

Open WorkaHive: ${jobsUrl}`;
}

export async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const replyTo = process.env.EMAIL_REPLY_TO;

  if (!apiKey || !from) {
    const reason = "Email skipped because RESEND_API_KEY or EMAIL_FROM is not configured.";
    console.log(reason);
    return { skipped: true, reason };
  }

  const recipients = Array.isArray(to) ? to : [to];
  const cleanedRecipients = recipients.map((email) => String(email || "").trim()).filter(Boolean);

  if (cleanedRecipients.length === 0) {
    return { skipped: true, reason: "Email skipped because no recipients were provided." };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: cleanedRecipients,
      subject,
      html,
      text,
      reply_to: replyTo || undefined,
    }),
  });

  if (!response.ok) {
    const textResponse = await response.text();
    throw new Error(textResponse || "Failed to send email");
  }

  return response.json();
}

export async function sendVerificationEmail({ email, name, role, token }) {
  const verifyUrl = `${getBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: email,
    subject: "Verify your WorkaHive email",
    html: buildVerifyEmailHtml({ name, role, verifyUrl }),
    text: buildVerifyEmailText({ role, verifyUrl }),
  });
}

export async function sendWelcomeEmail({ email, name, role }) {
  return sendEmail({
    to: email,
    subject: "Welcome to WorkaHive",
    html: buildWelcomeEmailHtml({ name, role }),
    text: buildWelcomeEmailText({ role }),
  });
}

export async function sendPasswordResetEmail({ email, name, token }) {
  const resetUrl = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: email,
    subject: "Reset your WorkaHive password",
    html: buildPasswordResetEmailHtml({ name, resetUrl }),
    text: buildPasswordResetEmailText({ name, resetUrl }),
  });
}

export async function sendCompanyVerifiedEmail({ email, name, companyName }) {
  const dashboardUrl = `${getBaseUrl()}/employer/dashboard`;
  return sendEmail({
    to: email,
    subject: "Your WorkaHive company is verified",
    html: buildCompanyVerifiedEmailHtml({ name, companyName, dashboardUrl }),
    text: buildCompanyVerifiedEmailText({ companyName, dashboardUrl }),
  });
}

export async function sendNewApplicationEmail({ email, name, applicantName, jobTitle }) {
  const applicationsUrl = `${getBaseUrl()}/employer/applications`;
  return sendEmail({
    to: email,
    subject: `New application for ${jobTitle}`,
    html: buildNewApplicationEmailHtml({ name, applicantName, jobTitle, applicationsUrl }),
    text: buildNewApplicationEmailText({ applicantName, jobTitle, applicationsUrl }),
  });
}

export async function sendAdminCompanyPendingVerificationEmail({ companyName, ownerName }) {
  const recipients = getAdminNotificationRecipients();
  if (recipients.length === 0) {
    return {
      skipped: true,
      reason: "Email skipped because ADMIN_NOTIFICATION_EMAILS is not configured.",
    };
  }

  const companiesUrl = `${getBaseUrl()}/admin/companies`;
  return sendEmail({
    to: recipients,
    subject: `Company awaiting verification: ${companyName}`,
    html: buildAdminCompanyPendingEmailHtml({ companyName, ownerName, companiesUrl }),
    text: buildAdminCompanyPendingEmailText({ companyName, ownerName, companiesUrl }),
  });
}

export async function sendApplicationStatusEmail({ email, name, jobTitle, status }) {
  const jobsUrl = `${getBaseUrl()}/jobseeker/jobs`;
  const subject =
    status === "SHORTLISTED"
      ? `You were shortlisted for ${jobTitle}`
      : `Update on your application for ${jobTitle}`;

  return sendEmail({
    to: email,
    subject,
    html: buildApplicationStatusEmailHtml({ name, jobTitle, status, jobsUrl }),
    text: buildApplicationStatusEmailText({ jobTitle, status, jobsUrl }),
  });
}
