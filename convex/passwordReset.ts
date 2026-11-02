import { Email } from "@convex-dev/auth/providers/Email";

export function createResetCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
}

export async function sendResetEmail(email: string, code: string) {
  const apiKey = process.env.AUTH_RESEND_KEY?.trim();
  const from = process.env.AUTH_EMAIL_FROM?.trim();
  if (!apiKey || !from) throw new Error("Password recovery email is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [email], subject: "Reset your Rentalin password",
      text: `Your Rentalin password reset code is ${code}. It expires in 15 minutes. If you did not request this, ignore this email.`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Password recovery email could not be sent; try again later");
}

export const PasswordReset = Email({
  id: "password-reset",
  maxAge: 15 * 60,
  generateVerificationToken: createResetCode,
  sendVerificationRequest: async ({ identifier, token }) => { await sendResetEmail(identifier, token); },
});
