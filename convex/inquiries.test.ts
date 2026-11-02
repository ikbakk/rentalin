/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function createBusinessAndVehicle(businessSlug: string) {
  const t = convexTest(schema, modules);
  const { businessId, vehicleId } = await t.run(async (ctx) => {
    const businessId = await ctx.db.insert("businesses", {
      name: "Test Rental",
      slug: businessSlug,
    });
    const vehicleId = await ctx.db.insert("vehicles", {
      businessId,
      make: "Toyota",
      model: "Avanza",
      plateNumber: "DR 1234 AB",
      status: "available",
    });
    return { businessId, vehicleId };
  });

  return { t, businessId, vehicleId };
}

test("public booking creates an inquiry for an available vehicle in the selected business", async () => {
  const { t, businessId, vehicleId } = await createBusinessAndVehicle("test-rental");

  const inquiryId = await t.mutation(internal.inquiries.createVerified, {
    slug: "test-rental",
    customerName: "Ayu",
    customerPhone: "+6281234567890",
    vehicleId,
    startDate: "2026-11-01T00:00:00.000Z",
    endDate: "2026-11-03T00:00:00.000Z",
  });

  const inquiry = await t.run((ctx) => ctx.db.get(inquiryId));
  expect(inquiry).toMatchObject({
    businessId,
    vehicleId,
    customerName: "Ayu",
    status: "new",
  });
});

test("public booking rejects a vehicle owned by another business", async () => {
  const { t, vehicleId } = await createBusinessAndVehicle("vehicle-owner");

  await t.run((ctx) =>
    ctx.db.insert("businesses", {
      name: "Different Rental",
      slug: "different-rental",
    }),
  );

  await expect(
    t.mutation(internal.inquiries.createVerified, {
      slug: "different-rental",
      customerName: "Budi",
      customerPhone: "+6281234567891",
      vehicleId,
      startDate: "2026-11-01T00:00:00.000Z",
      endDate: "2026-11-03T00:00:00.000Z",
    }),
  ).rejects.toThrow("Vehicle not found");
});

test("public booking rejects malformed date ranges and inactive vehicles", async () => {
  const { t, vehicleId } = await createBusinessAndVehicle("validation-rental");
  await expect(t.mutation(internal.inquiries.createVerified, {
    slug: "validation-rental",
    customerName: "Ayu",
    customerPhone: "+6281234567890",
    vehicleId,
    startDate: "not-a-date",
    endDate: "2026-11-03T00:00:00.000Z",
  })).rejects.toThrow("valid rental date range");

  await t.run((ctx) => ctx.db.patch(vehicleId, { status: "maintenance" }));
  await expect(t.mutation(internal.inquiries.createVerified, {
    slug: "validation-rental",
    customerName: "Ayu",
    customerPhone: "+6281234567890",
    vehicleId,
    startDate: "2026-11-01T00:00:00.000Z",
    endDate: "2026-11-03T00:00:00.000Z",
  })).rejects.toThrow("Vehicle not found");
});

test("public inquiry submission throttles repeated requests from the same phone", async () => {
  const { t, vehicleId } = await createBusinessAndVehicle("rate-limit-rental");
  const request = {
    slug: "rate-limit-rental",
    customerName: "Ayu",
    customerPhone: "+6281234567890",
    vehicleId,
    startDate: "2026-11-01T00:00:00.000Z",
    endDate: "2026-11-03T00:00:00.000Z",
  };
  await t.mutation(internal.inquiries.createVerified, request);
  await t.mutation(internal.inquiries.createVerified, request);
  await t.mutation(internal.inquiries.createVerified, request);
  await expect(t.mutation(internal.inquiries.createVerified, request)).rejects.toThrow("Too many booking requests");
});


test("changing phone numbers does not bypass the hourly business limit", async () => {
  const { t, businessId, vehicleId } = await createBusinessAndVehicle("distributed-limit");
  await t.run(ctx => ctx.db.insert("inquiryLimits", { businessId, windowStart: Math.floor(Date.now() / 3600000) * 3600000, count: 60 }));
  await expect(t.mutation(internal.inquiries.createVerified, { slug: "distributed-limit", vehicleId, customerName: "Different", customerPhone: "628999999999", startDate: "2026-11-01T00:00:00.000Z", endDate: "2026-11-03T00:00:00.000Z" })).rejects.toThrow("Too many booking requests");
  expect(await t.run(ctx => ctx.db.query("inquiries").collect())).toHaveLength(0);
});
