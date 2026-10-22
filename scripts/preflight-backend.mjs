import { pathToFileURL } from "node:url";
export function validateBackendEnvironment(env) {
  const required = ["SITE_URL", "JWT_PRIVATE_KEY", "JWKS", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "AUTH_RESEND_KEY", "AUTH_EMAIL_FROM", "TURNSTILE_SECRET_KEY", "TURNSTILE_EXPECTED_HOSTNAME"];
  const missing = required.filter(name => !env[name]?.trim());
  if (missing.length) throw new Error(`Missing backend environment variables: ${missing.join(", ")}`);
  const url = new URL(env.SITE_URL);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("SITE_URL must be an HTTPS origin");
  if (url.hostname !== env.TURNSTILE_EXPECTED_HOSTNAME.trim()) throw new Error("Turnstile hostname must match SITE_URL");
  if (!/^[a-f0-9]{32}$/.test(env.R2_ACCOUNT_ID)) throw new Error("R2_ACCOUNT_ID must be the 32-character account ID");
  if (!env.JWT_PRIVATE_KEY.startsWith("-----BEGIN PRIVATE KEY-----")) throw new Error("Generate a valid Convex Auth signing key pair");
  const jwks = JSON.parse(env.JWKS);
  if (!Array.isArray(jwks.keys) || !jwks.keys.some(key => key.kty === "RSA" && key.n && key.e && !key.d)) throw new Error("JWKS must contain the public RSA key, without private material");
  return true;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.env.RENTALIN_ENV_FILE) process.loadEnvFile(process.env.RENTALIN_ENV_FILE);
    validateBackendEnvironment(process.env);
    console.log("Backend environment preflight passed (values only; remote services not contacted).");
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
