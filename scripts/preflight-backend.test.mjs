import assert from "node:assert/strict";
import { validateBackendEnvironment } from "./preflight-backend.mjs";
assert.throws(() => validateBackendEnvironment({}), /Missing backend environment variables/);
const env = {
  SITE_URL: "https://app.example.test", JWT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----test",
  JWKS: JSON.stringify({ keys: [{ kty: "RSA", n: "test-public", e: "AQAB" }] }),
  R2_ACCOUNT_ID: "a".repeat(32), R2_ACCESS_KEY_ID: "test", R2_SECRET_ACCESS_KEY: "test", R2_BUCKET_NAME: "test",
  AUTH_RESEND_KEY: "test", AUTH_EMAIL_FROM: "accounts@example.test", TURNSTILE_SECRET_KEY: "test", TURNSTILE_EXPECTED_HOSTNAME: "app.example.test",
};
assert.equal(validateBackendEnvironment(env), true);
assert.throws(() => validateBackendEnvironment({ ...env, TURNSTILE_EXPECTED_HOSTNAME: "wrong.test" }));
assert.throws(() => validateBackendEnvironment({ ...env, JWKS: '{}' }));
console.log("Backend environment validation tests passed.");
