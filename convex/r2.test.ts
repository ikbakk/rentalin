/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { validateImage, validateImageBytes } from "./r2Rules";
const modules = import.meta.glob("./**/*.ts");

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const userId = await ctx.db.insert("users", {});
    const strangerId = await ctx.db.insert("users", {});
    const businessId = await ctx.db.insert("businesses", { name: "A", slug: "a" });
    const otherId = await ctx.db.insert("businesses", { name: "B", slug: "b" });
    await ctx.db.insert("memberships", { userId, businessId, role: "owner", isActive: true });
    await ctx.db.insert("memberships", { userId: strangerId, businessId, role: "staff", isActive: true });
    const vehicleId = await ctx.db.insert("vehicles", { businessId, make: "A", model: "A", plateNumber: "DR1", status: "available" });
    const inspectionId = await ctx.db.insert("inspections", { businessId, vehicleId, inspectionType: "PreRental", photoUrls: [], status: "Pending" });
    return { userId, strangerId, businessId, otherId, inspectionId };
  });
  return { t, ...ids, owner: t.withIdentity({ subject: String(ids.userId) }), stranger: t.withIdentity({ subject: String(ids.strangerId) }) };
}

const image = { contentType: "image/png", size: 8 };

test("rejects unsupported, empty and oversized images, including disguised bytes", () => {
  expect(() => validateImage("image/svg+xml", 10)).toThrow();
  expect(() => validateImage("image/png", 0)).toThrow();
  expect(() => validateImage("image/png", 5242881)).toThrow();
  expect(() => validateImageBytes("image/png", new TextEncoder().encode("<script>"))).toThrow();
  expect(() => validateImageBytes("image/png", new Uint8Array([137,80,78,71,13,10,26,10]))).not.toThrow();
});

test("upload is owned before signing and cannot be finalized or removed by another user", async () => {
  const { t, owner, stranger, businessId, otherId } = await setup();
  await expect(t.mutation(internal.fileRecords.reserve, { businessId, ...image })).rejects.toThrow("Unauthorized");
  await expect(owner.mutation(internal.fileRecords.reserve, { businessId: otherId, ...image })).rejects.toThrow("Forbidden");
  const file = await owner.mutation(internal.fileRecords.reserve, { businessId, ...image });
  expect(file.stagingKey).toContain(String(businessId));
  expect(file.objectKey).not.toBe(file.stagingKey);
  await expect(stranger.mutation(internal.fileRecords.beginFinalize, { id: file._id })).rejects.toThrow("File not found");
  await expect(stranger.mutation(internal.fileRecords.claimDelete, { id: file._id })).rejects.toThrow("File not found");
});

test("inspection only attaches verified own-tenant uploads once and blocks deletion after attachment", async () => {
  const { owner, stranger, businessId, inspectionId, t } = await setup();
  const file = await owner.mutation(internal.fileRecords.reserve, { businessId, ...image });
  const args = { id: inspectionId, photoUrls: [`r2:${file._id}`] };
  await expect(owner.mutation(api.inspections.complete, args)).rejects.toThrow("Photo is not ready");
  await owner.mutation(internal.fileRecords.beginFinalize, { id: file._id });
  await expect(owner.mutation(internal.fileRecords.beginFinalize, { id: file._id })).rejects.toThrow("already being verified");
  await owner.mutation(internal.fileRecords.markReady, { id: file._id });
  await expect(stranger.mutation(api.inspections.complete, args)).rejects.toThrow("Photo is not ready");
  await owner.mutation(api.inspections.complete, args);
  await owner.mutation(api.inspections.complete, args);
  await expect(owner.mutation(internal.fileRecords.claimDelete, { id: file._id })).rejects.toThrow("attached");
  const second = await t.run(async ctx => { const first = await ctx.db.get(inspectionId); return ctx.db.insert("inspections", { businessId, vehicleId: first!.vehicleId, inspectionType: "PreRental", photoUrls: [], status: "Pending" }); });
  await expect(owner.mutation(api.inspections.complete, { id: second, photoUrls: args.photoUrls })).rejects.toThrow("Photo is not ready");
});

test("cleanup locks expired uploads, never attached files, and retries deletion records", async () => {
  const { t, owner, businessId, inspectionId } = await setup();
  const file = await owner.mutation(internal.fileRecords.reserve, { businessId, ...image });
  expect(await t.mutation(internal.fileRecords.claimExpired, { id: file._id })).toBeNull();
  await t.run(ctx => ctx.db.patch(file._id, { expiresAt: Date.now() - 1 }));
  expect(await t.mutation(internal.fileRecords.claimExpired, { id: file._id })).toMatchObject({ status: "deleting" });
  expect(await t.mutation(internal.fileRecords.claimExpired, { id: file._id })).not.toBeNull();
  await expect(owner.mutation(api.inspections.complete, { id: inspectionId, photoUrls: [`r2:${file._id}`] })).rejects.toThrow("Photo is not ready");
  await t.mutation(internal.fileRecords.finishDelete, { id: file._id });
  expect(await t.run(ctx => ctx.db.get(file._id))).toBeNull();
});

test("signed read authorization follows revoked membership and pending file ownership", async () => {
  const { t, owner, stranger, businessId, userId } = await setup();
  const file = await owner.mutation(internal.fileRecords.reserve, { businessId, ...image });
  await expect(owner.query(internal.fileRecords.forRead, { id: file._id })).rejects.toThrow();
  await owner.mutation(internal.fileRecords.beginFinalize, { id: file._id });
  await owner.mutation(internal.fileRecords.markReady, { id: file._id });
  await expect(stranger.query(internal.fileRecords.forRead, { id: file._id })).rejects.toThrow();
  expect(await owner.query(internal.fileRecords.forRead, { id: file._id })).toMatchObject({ objectKey: file.objectKey });
  await t.run(async ctx => { const m = await ctx.db.query("memberships").withIndex("by_user_and_business", q=>q.eq("userId", userId).eq("businessId", businessId)).unique(); await ctx.db.patch(m!._id, { isActive: false }); });
  await expect(owner.query(internal.fileRecords.forRead, { id: file._id })).rejects.toThrow("Forbidden");
});
