/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("public business lookup exposes only the published profile fields", async () => {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {});
    await ctx.db.insert("businesses", {
      name: "Rental A",
      slug: "rental-a",
      createdBy: userId,
      externalId: "legacy-private-id",
      phone: "+628123456789",
      email: "hello@example.test",
      address: "Jakarta",
    });
  });

  const profile = await t.query(api.public.businessBySlug, { slug: "rental-a" });
  expect(profile).toEqual({
    name: "Rental A",
    slug: "rental-a",
    address: "Jakarta",
    phone: "+628123456789",
    email: "hello@example.test",
    logoUrl: null,
  });
});

test("bearer tracking omits renter PII and can be revoked by replacing its token", async () => {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {});
    const businessId = await ctx.db.insert("businesses", { name: "Rental A", slug: "rental-a", phone: "+628123456789" });
    await ctx.db.insert("memberships", { userId, businessId, role: "owner", isActive: true });
    const customerId = await ctx.db.insert("customers", {
      businessId,
      name: "Ayu Sensitive",
      phoneNumber: "+628111111111",
      email: "ayu@example.test",
    });
    const vehicleId = await ctx.db.insert("vehicles", {
      businessId,
      make: "Toyota",
      model: "Avanza",
      plateNumber: "DR 1234 AB",
      status: "available",
    });
    const reservationId = await ctx.db.insert("reservations", {
      businessId,
      customerId,
      vehicleId,
      startDate: "2026-11-01T00:00:00.000Z",
      endDate: "2026-11-03T00:00:00.000Z",
      estimatedCost: 800000,
      currency: "IDR",
      status: "confirmed",
      publicToken: "b22d6e0a-7152-4ace-86fc-75c9c43dd5f1",
    });
    return { userId, reservationId };
  });

  const oldTracking = await t.query(api.public.reservationByToken, { token: "b22d6e0a-7152-4ace-86fc-75c9c43dd5f1" });
  expect(oldTracking).toMatchObject({ status: "Confirmed", supportPhone: "+628123456789" });
  expect(oldTracking).not.toHaveProperty("customerName");
  expect(oldTracking).not.toHaveProperty("customerPhone");

  const owner = t.withIdentity({ subject: String(ids.userId) });
  const replacement = await owner.mutation(api.reservations.rotateTrackingToken, { id: ids.reservationId });
  expect(await t.query(api.public.reservationByToken, { token: "b22d6e0a-7152-4ace-86fc-75c9c43dd5f1" })).toBeNull();
  expect(await t.query(api.public.reservationByToken, { token: replacement })).toMatchObject({ status: "Confirmed" });
});

test("upload URL creation rejects unauthenticated users", async () => {
  const t = convexTest(schema, modules);
  const businessId = await t.run((ctx) => ctx.db.insert("businesses", { name: "Rental A", slug: "rental-a" }));
  await expect(t.mutation(api.files.generateUploadUrl, { businessId })).rejects.toThrow("Unauthorized");
});

test("inspection cannot attach a file already claimed by another business", async () => {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {});
    const businessId = await ctx.db.insert("businesses", { name: "Rental A", slug: "rental-a" });
    const otherBusinessId = await ctx.db.insert("businesses", { name: "Rental B", slug: "rental-b" });
    await ctx.db.insert("memberships", { userId, businessId, role: "owner", isActive: true });
    const rentalId = await ctx.db.insert("rentals", {
      businessId,
      reservationId: await ctx.db.insert("reservations", {
        businessId,
        vehicleId: await ctx.db.insert("vehicles", { businessId, make: "Toyota", model: "Avanza", plateNumber: "DR 1", status: "available" }),
        startDate: "2026-11-01T00:00:00.000Z",
        endDate: "2026-11-02T00:00:00.000Z",
        estimatedCost: 400000,
        currency: "IDR",
        status: "active",
      }),
      vehicleId: await ctx.db.insert("vehicles", { businessId, make: "Honda", model: "Brio", plateNumber: "DR 2", status: "rented" }),
      status: "active",
    });
    const inspectionId = await ctx.db.insert("inspections", {
      businessId,
      rentalId,
      vehicleId: await ctx.db.insert("vehicles", { businessId, make: "Toyota", model: "Calya", plateNumber: "DR 3", status: "available" }),
      inspectionType: "PreRental",
      photoUrls: [],
      status: "Pending",
    });
    const storageId = await ctx.storage.store(new Blob(["image bytes"], { type: "image/png" }));
    await ctx.db.insert("uploadClaims", {
      businessId: otherBusinessId,
      storageId,
      uploadedBy: userId,
      contentType: "image/png",
      size: 11,
      status: "attached",
    });
    return { userId, inspectionId, storageId };
  });

  const owner = t.withIdentity({ subject: String(ids.userId) });
  await expect(owner.mutation(api.inspections.complete, {
    id: ids.inspectionId,
    photoUrls: [String(ids.storageId)],
  })).rejects.toThrow("Photo is not registered to this business");
});
