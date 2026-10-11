/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function setup(reservationStatus: "confirmed" | "ready" = "ready") {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {});
    const businessId = await ctx.db.insert("businesses", { name: "Rental A", slug: `rental-${reservationStatus}` });
    await ctx.db.insert("memberships", { userId, businessId, role: "staff", isActive: true });
    const vehicleId = await ctx.db.insert("vehicles", {
      businessId,
      make: "Toyota",
      model: "Avanza",
      plateNumber: "DR 1234 AB",
      status: "available",
    });
    const reservationId = await ctx.db.insert("reservations", {
      businessId,
      vehicleId,
      startDate: "2026-11-01T00:00:00.000Z",
      endDate: "2026-11-03T00:00:00.000Z",
      estimatedCost: 800000,
      currency: "IDR",
      status: reservationStatus,
    });
    return { userId, businessId, vehicleId, reservationId };
  });
  return { t, ...ids, asUser: t.withIdentity({ subject: String(ids.userId) }) };
}

test("rental start requires a ready reservation and valid odometer", async () => {
  const confirmed = await setup("confirmed");
  await expect(confirmed.asUser.mutation(api.rentals.start, {
    reservationId: confirmed.reservationId,
    odometerStart: 1000,
  })).rejects.toThrow("ready reservation");

  const ready = await setup();
  await expect(ready.asUser.mutation(api.rentals.start, {
    reservationId: ready.reservationId,
    odometerStart: -1,
  })).rejects.toThrow("valid starting odometer");
});

test("starting a reservation twice returns one rental and writes one event", async () => {
  const { t, asUser, reservationId, vehicleId } = await setup();
  const args = { reservationId, odometerStart: 1000 };
  const [first, retry] = await Promise.all([
    asUser.mutation(api.rentals.start, args),
    asUser.mutation(api.rentals.start, args),
  ]);
  expect(retry?._id).toBe(first?._id);

  const snapshot = await t.run(async (ctx) => ({
    rentals: await ctx.db.query("rentals").collect(),
    reservation: await ctx.db.get(reservationId),
    vehicle: await ctx.db.get(vehicleId),
    events: await ctx.db.query("timeline").collect(),
  }));
  expect(snapshot.rentals).toHaveLength(1);
  expect(snapshot.reservation?.status).toBe("active");
  expect(snapshot.vehicle?.status).toBe("rented");
  expect(snapshot.events.filter((event) => event.eventType === "rental_started")).toHaveLength(1);
});

test("return is repeat-safe, validates odometer, closes the reservation, and records history", async () => {
  const { t, asUser, reservationId, vehicleId } = await setup();
  const rental = await asUser.mutation(api.rentals.start, { reservationId, odometerStart: 1000 });
  await expect(asUser.mutation(api.rentals.complete, { rentalId: rental!._id, odometerEnd: 999 })).rejects.toThrow("no lower than the starting");

  const firstReturn = await asUser.mutation(api.rentals.complete, { rentalId: rental!._id, odometerEnd: 1200 });
  const retry = await asUser.mutation(api.rentals.complete, { rentalId: rental!._id, odometerEnd: 1200 });
  expect(retry?.actualEnd).toBe(firstReturn?.actualEnd);
  await expect(asUser.mutation(api.rentals.complete, { rentalId: rental!._id, odometerEnd: 1300 })).rejects.toThrow("different odometer");

  const snapshot = await t.run(async (ctx) => ({
    reservation: await ctx.db.get(reservationId),
    vehicle: await ctx.db.get(vehicleId),
    events: await ctx.db.query("timeline").collect(),
  }));
  expect(snapshot.reservation?.status).toBe("completed");
  expect(snapshot.vehicle?.status).toBe("available");
  expect(snapshot.events.filter((event) => event.eventType === "rental_completed")).toHaveLength(1);
  expect(snapshot.events[0]).toMatchObject({ actor: expect.any(String), referenceType: "rental" });
});

test("return does not clear maintenance state", async () => {
  const { t, asUser, reservationId, vehicleId } = await setup();
  const rental = await asUser.mutation(api.rentals.start, { reservationId, odometerStart: 1000 });
  await t.run((ctx) => ctx.db.patch(vehicleId, { status: "maintenance" }));
  await asUser.mutation(api.rentals.complete, { rentalId: rental!._id, odometerEnd: 1200 });
  await expect(t.run((ctx) => ctx.db.get(vehicleId))).resolves.toMatchObject({ status: "maintenance" });
});

test("pre-rental inspections can be created from a reservation before a rental exists", async () => {
  const { t, asUser, businessId, reservationId } = await setup();
  const inspectionId = await asUser.mutation(api.inspections.create, {
    businessId,
    reservationId,
    inspectionType: "PreRental",
  });
  const inspection = await t.run((ctx) => ctx.db.get(inspectionId));
  expect(inspection).toMatchObject({ reservationId, status: "Pending", inspectionType: "PreRental" });
  await expect(asUser.mutation(api.rentals.start, { reservationId, odometerStart: 1000 })).resolves.toBeTruthy();
});
