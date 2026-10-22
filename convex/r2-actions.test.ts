/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
const io = vi.hoisted(() => ({ promote: vi.fn(), remove: vi.fn(), uploadUrl: vi.fn(), readUrl: vi.fn() }));
vi.mock("./lib/r2Storage", () => ({ r2Storage: () => io }));
const modules = import.meta.glob("./**/*.ts");
beforeEach(() => { vi.resetAllMocks(); io.uploadUrl.mockResolvedValue("https://r2.example.test/staging"); });
async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const userId = await ctx.db.insert("users", {});
    const businessId = await ctx.db.insert("businesses", { name: "A", slug: "a" });
    const membershipId = await ctx.db.insert("memberships", { userId, businessId, role: "owner", isActive: true });
    const vehicleId = await ctx.db.insert("vehicles", { businessId, make: "A", model: "A", plateNumber: "DR1", status: "available" });
    const inspectionId = await ctx.db.insert("inspections", { businessId, vehicleId, inspectionType: "PreRental", photoUrls: [], status: "Pending" });
    return { userId, businessId, membershipId, inspectionId };
  });
  const owner = t.withIdentity({ subject: String(ids.userId) });
  const upload = await owner.action(api.r2.createUpload, { businessId: ids.businessId, contentType: "image/png", size: 8 });
  const record = (await t.run(ctx => ctx.db.get(upload.id)))!;
  return { t, owner, upload, record, ...ids };
}

test("failed promotion releases verification lock and retry is idempotent after success", async () => {
  const { t, owner, upload, record } = await setup();
  io.promote.mockRejectedValueOnce(new Error("R2 unavailable"));
  await expect(owner.action(api.r2.finalizeUpload, { id: upload.id })).rejects.toThrow("R2 unavailable");
  expect((await t.run(ctx => ctx.db.get(upload.id)))?.status).toBe("uploading");
  expect(io.remove).toHaveBeenCalledWith(record.objectKey);
  io.promote.mockResolvedValue(undefined);
  expect(await owner.action(api.r2.finalizeUpload, { id: upload.id })).toBe(`r2:${upload.id}`);
  expect(await owner.action(api.r2.finalizeUpload, { id: upload.id })).toBe(`r2:${upload.id}`);
  expect(io.promote).toHaveBeenCalledTimes(2);
});

test("membership revocation during promotion cannot leave an authorized ready file", async () => {
  const { t, owner, upload, membershipId, record } = await setup();
  io.promote.mockImplementationOnce(async () => { await t.run(ctx => ctx.db.patch(membershipId, { isActive: false })); });
  await expect(owner.action(api.r2.finalizeUpload, { id: upload.id })).rejects.toThrow("Forbidden");
  expect((await t.run(ctx => ctx.db.get(upload.id)))?.status).toBe("uploading");
  expect(io.remove).toHaveBeenCalledWith(record.objectKey);
});

test("failed removal leaves a deletion record for cleanup retry", async () => {
  const { t, owner, upload } = await setup();
  io.remove.mockRejectedValueOnce(new Error("R2 unavailable"));
  await expect(owner.action(api.r2.removeImage, { id: upload.id })).rejects.toThrow("R2 unavailable");
  expect((await t.run(ctx => ctx.db.get(upload.id)))?.status).toBe("deleting");
  io.remove.mockResolvedValue(undefined);
  await t.action(internal.r2.cleanup, {});
  await t.action(internal.r2.cleanup, {});
  expect(await t.run(ctx => ctx.db.get(upload.id))).toBeNull();
});

test("cleanup never removes attached evidence, even after pending expiry", async () => {
  const { t, owner, upload, inspectionId } = await setup();
  await owner.action(api.r2.finalizeUpload, { id: upload.id });
  await owner.mutation(api.inspections.complete, { id: inspectionId, photoUrls: [`r2:${upload.id}`] });
  await t.run(ctx => ctx.db.patch(upload.id, { expiresAt: Date.now() - 1 }));
  io.remove.mockClear();
  await t.action(internal.r2.cleanup, {});
  expect(io.remove).not.toHaveBeenCalled();
  expect((await t.run(ctx => ctx.db.get(upload.id)))?.status).toBe("attached");
});
