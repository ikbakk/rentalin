/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const adminId = await ctx.db.insert("users", {});
    const staffId = await ctx.db.insert("users", {});
    const businessId = await ctx.db.insert("businesses", { name: "Rental A", slug: "rental-a", timeZone: "Asia/Jakarta" });
    const otherBusinessId = await ctx.db.insert("businesses", { name: "Rental B", slug: "rental-b" });
    await ctx.db.insert("memberships", { userId: adminId, businessId, role: "admin", isActive: true });
    await ctx.db.insert("memberships", { userId: staffId, businessId, role: "staff", isActive: true });
    const vehicleId = await ctx.db.insert("vehicles", { businessId, make: "Toyota", model: "Avanza", plateNumber: "DR 1", status: "available" });
    const reservationId = await ctx.db.insert("reservations", {
      businessId,
      vehicleId,
      startDate: "2026-11-01T00:00:00.000Z",
      endDate: "2026-11-02T00:00:00.000Z",
      estimatedCost: 1000000,
      currency: "IDR",
      status: "confirmed",
    });
    const otherReservationId = await ctx.db.insert("reservations", {
      businessId: otherBusinessId,
      vehicleId: await ctx.db.insert("vehicles", { businessId: otherBusinessId, make: "Honda", model: "Brio", plateNumber: "DR 2", status: "available" }),
      startDate: "2026-11-01T00:00:00.000Z",
      endDate: "2026-11-02T00:00:00.000Z",
      estimatedCost: 500000,
      currency: "IDR",
      status: "confirmed",
    });
    return { adminId, staffId, businessId, reservationId, otherReservationId };
  });
  return {
    t,
    ...ids,
    admin: t.withIdentity({ subject: String(ids.adminId) }),
    staff: t.withIdentity({ subject: String(ids.staffId) }),
  };
}

function entry(reservationId: string, overrides: Record<string, unknown> = {}) {
  return {
    reservationId: reservationId as Id<"reservations">,
    kind: "payment" as const,
    amount: 300000,
    method: "cash" as const,
    requestKey: "request-key-123456",
    ...overrides,
  };
}

test("manual payments are append-only, retry-safe, and update the outstanding balance", async () => {
  const { t, admin, reservationId } = await setup();
  const args = entry(reservationId);
  const [firstId, retryId] = await Promise.all([
    admin.mutation(api.finance.add, args),
    admin.mutation(api.finance.add, args),
  ]);
  expect(retryId).toBe(firstId);
  expect(await t.run((ctx) => ctx.db.query("payments").withIndex("by_reservation", q => q.eq("reservationId", reservationId)).collect())).toHaveLength(1);
  await expect(admin.query(api.finance.summaryByReservation, { reservationId })).resolves.toMatchObject({
    estimatedCost: 1000000,
    received: 300000,
    outstanding: 700000,
    overpaid: 0,
    currency: "IDR",
  });
});

test("staff cannot change payment history and refunds cannot exceed received funds", async () => {
  const { admin, staff, reservationId } = await setup();
  await expect(staff.mutation(api.finance.add, entry(reservationId))).rejects.toThrow("Forbidden");
  await expect(staff.query(api.finance.listByReservation, { reservationId })).rejects.toThrow("Forbidden");
  await admin.mutation(api.finance.add, entry(reservationId));
  await expect(admin.mutation(api.finance.add, entry(reservationId, {
    kind: "refund",
    amount: 300001,
    requestKey: "request-key-refund1",
  }))).rejects.toThrow("cannot exceed");
  await admin.mutation(api.finance.add, entry(reservationId, {
    kind: "refund",
    amount: 100000,
    requestKey: "request-key-refund1",
    method: "bank_transfer",
  }));
  await expect(admin.query(api.finance.summaryByReservation, { reservationId: reservationId as Id<"reservations"> })).resolves.toMatchObject({ received: 200000, outstanding: 800000 });
});

test("cancelled reservations accept refunds but no new payment or deposit", async () => {
  const { t, admin, reservationId } = await setup();
  await t.run((ctx) => ctx.db.patch(reservationId, { status: "cancelled" }));
  await expect(admin.mutation(api.finance.add, entry(reservationId))).rejects.toThrow("only receive refunds");
  await expect(admin.mutation(api.finance.add, entry(reservationId, {
    kind: "refund",
    amount: 100,
    requestKey: "request-key-refund2",
  }))).rejects.toThrow("cannot exceed");
});

test("ledger rejects fractional or zero amounts and cross-tenant records", async () => {
  const { admin, reservationId, otherReservationId } = await setup();
  await expect(admin.mutation(api.finance.add, entry(reservationId, { amount: 12.5 }))).rejects.toThrow("positive whole");
  await expect(admin.mutation(api.finance.add, entry(reservationId, { amount: 0 }))).rejects.toThrow("positive whole");
  await expect(admin.mutation(api.finance.add, entry(otherReservationId))).rejects.toThrow("Forbidden");
});

test("CSV export escapes spreadsheet formulas and limits the export size", async () => {
  const { t, admin, businessId, reservationId } = await setup();
  await admin.mutation(api.finance.add, entry(reservationId, { note: "=HYPERLINK(\"https://bad.test\")" }));
  const exported = await admin.query(api.finance.exportCsv, { businessId });
  expect(exported.csv).toContain("'=HYPERLINK(");
  expect(exported).toMatchObject({ rowCount: 1, truncated: false });
  await expect(t.query(api.finance.exportCsv, { businessId })).rejects.toThrow("Unauthorized");
});

test("daily receipts respect the business timezone boundary", async () => {
  const { admin, businessId, reservationId } = await setup();
  vi.setSystemTime(new Date("2026-10-09T17:30:00.000Z"));
  try {
    await admin.mutation(api.finance.add, entry(reservationId));
    await expect(admin.query(api.finance.summaryByBusiness, { businessId })).resolves.toMatchObject({ todayPayments: 300000, timeZone: "Asia/Jakarta" });
  } finally {
    vi.useRealTimers();
  }
});
