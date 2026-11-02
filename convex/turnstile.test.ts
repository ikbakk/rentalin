import { afterEach, expect, test, vi } from "vitest";
import { verifyTurnstile } from "./turnstile";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function config() { vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret"); vi.stubEnv("TURNSTILE_EXPECTED_HOSTNAME", "app.example.test"); }

test("public submissions fail closed without verification configuration or a token", async () => {
  vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  await expect(verifyTurnstile("token")).rejects.toThrow("unavailable");
  config();
  await expect(verifyTurnstile("")).rejects.toThrow("verification");
});

test.each([
  { success: false, hostname: "app.example.test", action: "rental-inquiry" },
  { success: true, hostname: "attacker.test", action: "rental-inquiry" },
  { success: true, hostname: "app.example.test", action: "different-form" },
])("rejects unsuccessful, foreign-host and wrong-action responses: %j", async result => {
  config(); vi.stubGlobal("fetch", async () => Response.json(result));
  await expect(verifyTurnstile("valid-looking-token")).rejects.toThrow("verification");
});

test("successful verification is checked server-side for the expected hostname and action", async () => {
  config();
  let posted: unknown;
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    posted = JSON.parse(init.body as string);
    return Response.json({ success: true, hostname: "app.example.test", action: "rental-inquiry" });
  });
  await verifyTurnstile("single-use-token");
  expect(posted).toMatchObject({ secret: "test-secret", response: "single-use-token" });
});
