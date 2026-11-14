import { query } from "./_generated/server";
import { v } from "convex/values";
// Lightweight public readiness probe. Returns no configuration values or data.
export const ping = query({
  args: {},
  returns: v.object({ ok: v.boolean(), emailReady: v.boolean() }),
  handler: () => ({
    ok: ["JWT_PRIVATE_KEY", "JWKS", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "TURNSTILE_SECRET_KEY", "TURNSTILE_EXPECTED_HOSTNAME", "SITE_URL"].every(name => Boolean(process.env[name]?.trim())),
    emailReady: Boolean(process.env.AUTH_RESEND_KEY?.trim() && process.env.AUTH_EMAIL_FROM?.trim()),
  }),
});
