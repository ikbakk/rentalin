/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function seedInspection(vehicleStatus: "available" | "inactive" = "available") {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {});
    const businessId = await ctx.db.insert("businesses", { name: "Rental shop", slug: `shop-${vehicleStatus}` });
    await ctx.db.insert("memberships", { userId, businessId, role: "staff", isActive: true });
    const vehicleId = await ctx.db.insert("vehicles", {
      businessId,
      make: "Toyota",
      model: "Avanza",
      plateNumber: "DR 1234 AB",
      status: vehicleStatus,
    });
    const reservationId = await ctx.db.insert("reservations", {
      businessId,
      vehicleId,
      startDate: "2026-10-12T00:00:00.000Z",
      endDate: "2026-10-14T00:00:00.000Z",
      estimatedCost: 800000,
      currency: "IDR",
      status: "preRental",
    });
    return { userId, businessId, vehicleId, reservationId };
  });
  return { t, ...ids, asUser: t.withIdentity({ subject: String(ids.userId) }) };
}

test("failed inspection moves an active vehicle into maintenance", async () => {
  const { asUser, businessId, vehicleId, reservationId, t } = await seedInspection();
  const inspectionId = await asUser.mutation(api.inspections.create, {
    businessId,
    reservationId,
    inspectionType: "PreRental",
  });

  await asUser.mutation(api.inspections.fail, { id: inspectionId, reason: "Damaged tire" });

  await t.run(async (ctx) => {
    expect((await ctx.db.get(vehicleId))?.status).toBe("maintenance");
    expect((await ctx.db.get(inspectionId))?.status).toBe("Failed");
  });
});

test("failed inspection preserves an inactive vehicle status", async () => {
  const { asUser, businessId, vehicleId, reservationId, t } = await seedInspection("inactive");
  const inspectionId = await asUser.mutation(api.inspections.create, {
    businessId,
    reservationId,
    inspectionType: "PreRental",
  });

  await asUser.mutation(api.inspections.fail, { id: inspectionId, reason: "Vehicle retired" });

  await t.run(async (ctx) => {
    expect((await ctx.db.get(vehicleId))?.status).toBe("inactive");
  });
});

test("inspection completion rejects unregistered external photo URLs", async () => {
  const { asUser, businessId, reservationId } = await seedInspection();
  const inspectionId = await asUser.mutation(api.inspections.create, {
    businessId,
    reservationId,
    inspectionType: "PreRental",
  });

  await expect(asUser.mutation(api.inspections.complete, {
    id: inspectionId,
    photoUrls: ["https://attacker.example/photo.jpg"],
  })).rejects.toThrow("Inspection photos must be uploaded to this business first");
});

test("uploaded inspection photos can be deleted while their tenant claim is pending", async () => {
  const { t, asUser, userId, businessId } = await seedInspection();
  const storageId = await t.run(async (ctx) => {
    const id = await ctx.storage.store(new Blob(["temporary image"], { type: "image/png" }));
    await ctx.db.insert("uploadClaims", {
      businessId,
      storageId: id,
      uploadedBy: userId,
      contentType: "image/png",
      size: 15,
      status: "pending",
    });
    return id;
  });

  await asUser.mutation(api.files.removePendingInspectionImage, { businessId, storageId });

  await t.run(async (ctx) => {
    expect(await ctx.db.query("uploadClaims").withIndex("by_storage", q => q.eq("storageId", storageId)).unique()).toBeNull();
    expect(await ctx.db.system.get("_storage", storageId)).toBeNull();
  });
});
