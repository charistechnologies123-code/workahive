// lib/email.js
export async function sendWelcomeEmail(to, name) {
  console.info(`Email sending disabled. Would send welcome email to ${to}.`);
  return null;
}

export async function sendVerificationEmail(to, name, verifyUrl) {
  console.info(`Email sending disabled. Would send verification email to ${to} with link ${verifyUrl}.`);
