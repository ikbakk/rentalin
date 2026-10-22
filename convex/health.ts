import { query } from "./_generated/server";
// Lightweight public readiness probe. Returns no configuration values or data.
export const ping = query({ args: {}, handler: () => ({
  ok: ["JWT_PRIVATE_KEY", "JWKS", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "AUTH_RESEND_KEY", "AUTH_EMAIL_FROM", "TURNSTILE_SECRET_KEY", "TURNSTILE_EXPECTED_HOSTNAME", "SITE_URL"].every(name => Boolean(process.env[name]?.trim())),
}) });
