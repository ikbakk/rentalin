/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const firstInterval = {
  startDate: "2026-11-01T00:00:00.000Z",
  endDate: "2026-11-03T00:00:00.000Z",
};

async function setup(status: "available" | "maintenance" | "inactive" = "available") {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {});
    const businessId = await ctx.db.insert("businesses", { name: "Rental A", slug: `rent-${status}` });
    await ctx.db.insert("memberships", { userId, businessId, role: "admin", isActive: true });
    const vehicleId = await ctx.db.insert("vehicles", {
      businessId,
      make: "Toyota",
      model: "Avanza",
      plateNumber: "DR 1234 AB",
      status,
    });
    return { userId, businessId, vehicleId };
  });
  return { t, ...ids, asUser: t.withIdentity({ subject: String(ids.userId) }) };
}

function request(businessId: string, vehicleId: string, dates = firstInterval) {
  return {
    businessId: businessId as Id<"businesses">,
    vehicleId: vehicleId as Id<"vehicles">,
    ...dates,
    estimatedCost: 800000,
    currency: "IDR",
  };
}

test("confirmed reservations conflict on overlapping half-open intervals", async () => {
  const { asUser, businessId, vehicleId } = await setup();
  await asUser.mutation(api.reservations.create, request(businessId, vehicleId));
  await expect(asUser.mutation(api.reservations.create, request(businessId, vehicleId, {
    startDate: "2026-11-02T12:00:00.000Z",
    endDate: "2026-11-04T00:00:00.000Z",
  }))).rejects.toThrow("already has a reservation");
});

test("back-to-back reservations are allowed and cancelled reservations release capacity", async () => {
  const { t, asUser, businessId, vehicleId } = await setup();
  const firstId = await asUser.mutation(api.reservations.create, request(businessId, vehicleId));
  await expect(asUser.mutation(api.reservations.create, request(businessId, vehicleId, {
    startDate: firstInterval.endDate,
    endDate: "2026-11-05T00:00:00.000Z",
  }))).resolves.toBeTruthy();

  await t.run((ctx) => ctx.db.patch(firstId, { status: "cancelled" }));
  await expect(asUser.mutation(api.reservations.create, request(businessId, vehicleId))).resolves.toBeTruthy();
});

test("maintenance vehicles and malformed money values are rejected", async () => {
  const { asUser, businessId, vehicleId } = await setup("maintenance");
  await expect(asUser.mutation(api.reservations.create, request(businessId, vehicleId))).rejects.toThrow("not available");

  const available = await setup();
  await expect(available.asUser.mutation(api.reservations.create, {
    ...request(available.businessId, available.vehicleId),
    estimatedCost: 12.5,
  })).rejects.toThrow("whole amount");
});

test("reservation status changes follow the allowed lifecycle", async () => {
  const { asUser, businessId, vehicleId } = await setup();
  const reservationId = await asUser.mutation(api.reservations.create, request(businessId, vehicleId));
  await expect(asUser.mutation(api.reservations.setStatus, { id: reservationId, status: "ready" })).rejects.toThrow("Cannot change reservation");
  await expect(asUser.mutation(api.reservations.setStatus, { id: reservationId, status: "preRental" })).resolves.toBeTruthy();
  const inspectionId = await asUser.mutation(api.inspections.create, { businessId, reservationId, inspectionType: "PreRental" });
  await asUser.mutation(api.inspections.complete, { id: inspectionId, photoUrls: [], notes: "Vehicle checked" });
  await expect(asUser.mutation(api.reservations.setStatus, { id: reservationId, status: "ready" })).resolves.toBeTruthy();
  await expect(asUser.mutation(api.reservations.setStatus, { id: reservationId, status: "confirmed" })).rejects.toThrow("Cannot change reservation");
});

test("concurrent overlapping confirmations allow only one winner", async () => {
  const { asUser, businessId, vehicleId } = await setup();
  const results = await Promise.allSettled([
    asUser.mutation(api.reservations.create, request(businessId, vehicleId)),
    asUser.mutation(api.reservations.create, request(businessId, vehicleId)),
  ]);
  expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
});

test("an active rental blocks dates even if its reservation was cancelled", async () => {
  const { t, asUser, businessId, vehicleId } = await setup();
  await t.run(async (ctx) => {
    const reservationId = await ctx.db.insert("reservations", {
      businessId,
      vehicleId,
      ...firstInterval,
      estimatedCost: 800000,
      currency: "IDR",
      status: "cancelled",
    });
    await ctx.db.insert("rentals", {
      businessId,
      reservationId,
      vehicleId,
      status: "active",
      actualStart: "2026-11-01T00:00:00.000Z",
    });
  });
  await expect(asUser.mutation(api.reservations.create, request(businessId, vehicleId))).rejects.toThrow("active rental");
});

test("reservation creation from an inquiry is repeat-safe", async () => {
  const { t, asUser, businessId, vehicleId } = await setup();
  const inquiryId = await t.run((ctx) => ctx.db.insert("inquiries", {
    businessId,
    vehicleId,
    customerName: "Ayu",
    customerPhone: "6281234567890",
    startDate: firstInterval.startDate,
    endDate: firstInterval.endDate,
    status: "new",
  }));
  const args = { ...request(businessId, vehicleId), inquiryId };
  const firstId = await asUser.mutation(api.reservations.create, args);
  const retriedId = await asUser.mutation(api.reservations.create, args);
  expect(retriedId).toBe(firstId);
  expect(await t.run((ctx) => ctx.db.query("reservations").withIndex("by_inquiry", q => q.eq("inquiryId", inquiryId)).collect())).toHaveLength(1);
});
