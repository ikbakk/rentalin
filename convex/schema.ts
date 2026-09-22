import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  businesses: defineTable({
    externalId: v.optional(v.string()),
    name: v.string(),
    slug: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
  }).index("by_slug", ["slug"]).index("by_external_id", ["externalId"]),

  customers: defineTable({
    businessId: v.id("businesses"),
    externalId: v.optional(v.string()),
    name: v.string(),
    phoneNumber: v.string(),
    email: v.string(),
    notes: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_external_id", ["externalId"]),

  inquiries: defineTable({
    businessId: v.id("businesses"),
    vehicleId: v.id("vehicles"),
    customerName: v.string(),
    customerPhone: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    notes: v.optional(v.string()),
    status: v.union(v.literal("new"), v.literal("contacted"), v.literal("converted"), v.literal("cancelled")),
  })
    .index("by_business", ["businessId"]),

  vehicles: defineTable({
    businessId: v.id("businesses"),
    make: v.string(),
    model: v.string(),
    year: v.optional(v.number()),
    plateNumber: v.string(),
    color: v.optional(v.string()),
    seatingCapacity: v.optional(v.number()),
    status: v.union(
      v.literal("available"),
      v.literal("reserved"),
      v.literal("rented"),
      v.literal("maintenance"),
      v.literal("inactive"),
    ),
    dailyRate: v.optional(v.number()),
    currency: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_status", ["businessId", "status"]),
});
