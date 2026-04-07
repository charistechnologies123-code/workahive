// lib/email.js
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(to, name) {
  return await resend.emails.send({
    from: "WorkaHive <charistechnologies123@gmail.com>",
    to,
    subject: "Welcome to WorkaHive 🎉",
    html: `
      <h2>Welcome to WorkaHive, ${name}!</h2>
      <p>We're excited to have you onboard.</p>
      <p>You can now explore jobs, connect with employers, and grow your career.</p>
    `,
  });
}

export async function sendVerificationEmail(to, name, verifyUrl) {
  return await resend.emails.send({
    from: "WorkaHive <charistechnologies123@gmail.com>",
    to,
    subject: "Verify your email 🔒",
    html: `
      <h2>Hello ${name},</h2>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
}