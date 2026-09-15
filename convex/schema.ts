import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  businesses: defineTable({
    name: v.string(),
    slug: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

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
    imageStorageId: v.optional(v.id("_storage")),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_status", ["businessId", "status"]),
});
