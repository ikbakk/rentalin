/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function seedTenant(role: "owner" | "admin" | "staff" = "owner", isActive = true) {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {});
    const businessId = await ctx.db.insert("businesses", { name: "Tenant A", slug: `tenant-a-${role}-${isActive}` });
    const otherBusinessId = await ctx.db.insert("businesses", { name: "Tenant B", slug: `tenant-b-${role}-${isActive}` });
    await ctx.db.insert("memberships", { userId, businessId, role, isActive });
    const vehicleId = await ctx.db.insert("vehicles", {
      businessId,
      make: "Toyota",
      model: "Avanza",
      plateNumber: "DR 1234 AB",
      status: "available",
    });
    const otherCustomerId = await ctx.db.insert("customers", {
      businessId: otherBusinessId,
      name: "Other tenant customer",
      phoneNumber: "0812000000",
      email: "other@example.test",
    });
    return { userId, businessId, otherBusinessId, vehicleId, otherCustomerId };
  });
  return { t, ...ids, asUser: t.withIdentity({ subject: String(ids.userId) }) };
}

test("protected vehicle query rejects anonymous users", async () => {
  const { t, businessId } = await seedTenant();
  await expect(t.query(api.vehicles.listByBusiness, { businessId })).rejects.toThrow("Unauthorized");
});

test("staff can read their tenant but cannot edit fleet or business settings", async () => {
  const { asUser, businessId, vehicleId } = await seedTenant("staff");
  await expect(asUser.query(api.vehicles.listByBusiness, { businessId })).resolves.toHaveLength(1);
  await expect(asUser.mutation(api.fleet.update, {
    id: vehicleId,
    licensePlate: "DR 1234 AB",
    make: "Toyota",
    model: "Avanza",
    year: 2024,
    color: "Black",
    seatingCapacity: 7,
    dailyRate: 400000,
    currency: "IDR",
  })).rejects.toThrow("Forbidden");
  await expect(asUser.mutation(api.businesses.updateSettings, {
    businessId,
    name: "Changed",
    address: "Street",
    phone: "0812",
    email: "owner@example.test",
    timeZone: "Asia/Jakarta",
  })).rejects.toThrow("Forbidden");
});

test("owner business settings accept supported zones and reject unlisted zones", async () => {
  const { asUser, businessId } = await seedTenant("owner");
  const settings = {
    businessId,
    name: "Tenant A",
    address: "Bandung",
    phone: "+628123456789",
    email: "owner@example.test",
  };
  await expect(asUser.mutation(api.businesses.updateSettings, { ...settings, timeZone: "Asia/Makassar" })).resolves.toMatchObject({ timeZone: "Asia/Makassar" });
  await expect(asUser.mutation(api.businesses.updateSettings, { ...settings, timeZone: "Europe/London" })).rejects.toThrow("supported Indonesian time zone");
});

test("cross-tenant related IDs are rejected", async () => {
  const { asUser, businessId, vehicleId, otherCustomerId } = await seedTenant("admin");
  await expect(asUser.mutation(api.reservations.create, {
    businessId,
    customerId: otherCustomerId,
    vehicleId,
    startDate: "2026-11-01T00:00:00.000Z",
    endDate: "2026-11-02T00:00:00.000Z",
    estimatedCost: 400000,
    currency: "IDR",
  })).rejects.toThrow("Customer not found");
});

test("inactive membership is rejected", async () => {
  const { asUser, businessId } = await seedTenant("admin", false);
  await expect(asUser.query(api.vehicles.listByBusiness, { businessId })).rejects.toThrow("Forbidden");
});

test("active business ignores a revoked membership and chooses no inaccessible tenant", async () => {
  const { asUser } = await seedTenant("owner", false);
  await expect(asUser.query(api.tenancy.activeBusiness, {})).resolves.toBeNull();
});
