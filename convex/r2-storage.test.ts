// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Storage } from "./lib/r2Storage";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
function configured() {
  vi.stubEnv("R2_ACCOUNT_ID", "a".repeat(32));
  vi.stubEnv("R2_BUCKET_NAME", "rentalin-test");
  vi.stubEnv("R2_ACCESS_KEY_ID", "test-key");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret");
  return r2Storage();
}

test("missing credentials fail explicitly without a public storage fallback", () => {
  vi.stubEnv("R2_ACCOUNT_ID", "");
  expect(() => r2Storage()).toThrow("R2_ACCOUNT_ID");
});

test("upload URLs expire and only authorize the staging key and expected headers", async () => {
  const storage = configured();
  const upload = new URL(await storage.uploadUrl("staging/tenant/user/random", "image/png", 8));
  expect(upload.hostname).toBe(`${"a".repeat(32)}.r2.cloudflarestorage.com`);
  expect(upload.pathname).toBe("/rentalin-test/staging/tenant/user/random");
  expect(upload.searchParams.get("X-Amz-Expires")).toBe("300");
  expect(upload.searchParams.get("X-Amz-SignedHeaders")).toContain("content-type");
  expect(upload.searchParams.get("X-Amz-SignedHeaders")).toContain("content-length");
});

test("promotion pins the read to its ETag and writes exactly the validated bytes", async () => {
  const storage = configured();
  const bytes = new Uint8Array([137,80,78,71,13,10,26,10]);
  const calls: unknown[] = [];
  vi.spyOn(S3Client.prototype, "send").mockImplementation((async (command: { input: unknown }) => {
    calls.push(command);
    if (command instanceof GetObjectCommand) return { Body: { transformToByteArray: async () => bytes } };
    if (command instanceof PutObjectCommand) return {};
    return { ContentLength: 8, ContentType: "image/png", ETag: '"version-one"' };
  }) as never);
  await storage.promote("staging/a", "inspections/a", "image/png", 8);
  expect(calls[1]).toMatchObject({ input: { Key: "staging/a", IfMatch: '"version-one"' } });
  expect(calls[2]).toMatchObject({ input: { Key: "inspections/a", Body: bytes, CacheControl: "private, no-store" } });
});

test("mismatched upload metadata cannot be promoted", async () => {
  const storage = configured();
  vi.spyOn(S3Client.prototype, "send").mockResolvedValue({ ContentLength: 5242881, ContentType: "image/png", ETag: '"bad"' } as never);
  await expect(storage.promote("staging/a", "inspections/a", "image/png", 8)).rejects.toThrow("size or type");
});
