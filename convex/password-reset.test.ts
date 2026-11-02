import { afterEach, expect, test, vi } from "vitest";
import { createResetCode, sendResetEmail } from "./passwordReset";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

test("reset codes are unpredictable and never fall back to a fixed development code", () => {
  const codes = Array.from({ length: 100 }, createResetCode);
  expect(new Set(codes).size).toBe(100);
  expect(codes.every(code => /^[A-F0-9]{12}$/.test(code))).toBe(true);
});

test("reset email refuses missing delivery configuration", async () => {
  vi.stubEnv("AUTH_RESEND_KEY", "");
  await expect(sendResetEmail("owner@example.test", "ABC123ABC123")).rejects.toThrow("not configured");
});

test("reset email sends only the requested code and checks provider failure", async () => {
  vi.stubEnv("AUTH_RESEND_KEY", "test-api-key"); vi.stubEnv("AUTH_EMAIL_FROM", "Rentalin <account@example.test>");
  const requests: RequestInit[] = [];
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => { requests.push(init); return new Response("{}", { status: 503 }); });
  await expect(sendResetEmail("owner@example.test", "ABC123ABC123")).rejects.toThrow("could not be sent");
  expect(JSON.parse(requests[0].body as string)).toMatchObject({ to: ["owner@example.test"], from: "Rentalin <account@example.test>" });
  expect(JSON.parse(requests[0].body as string).text).toContain("ABC123ABC123");
});
