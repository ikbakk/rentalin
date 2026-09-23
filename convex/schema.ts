import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  businesses: defineTable({
    externalId: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    name: v.string(),
    slug: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
  }).index("by_slug", ["slug"]).index("by_external_id", ["externalId"]),

  memberships: defineTable({
    userId: v.id("users"),
    businessId: v.id("businesses"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("staff")),
    isActive: v.boolean(),
  }).index("by_user", ["userId"]).index("by_user_and_business", ["userId", "businessId"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    activeBusinessId: v.optional(v.id("businesses")),
  }).index("by_user", ["userId"]),

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
    customerId: v.optional(v.id("customers")),
    customerName: v.string(),
    customerPhone: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    notes: v.optional(v.string()),
    status: v.union(v.literal("new"), v.literal("contacted"), v.literal("converted"), v.literal("cancelled")),
  })
    .index("by_business", ["businessId"]),

  reservations: defineTable({
    businessId: v.id("businesses"),
    inquiryId: v.optional(v.id("inquiries")),
    customerId: v.optional(v.id("customers")),
    vehicleId: v.id("vehicles"),
    startDate: v.string(),
    endDate: v.string(),
    estimatedCost: v.number(),
    currency: v.string(),
    status: v.union(v.literal("confirmed"), v.literal("preRental"), v.literal("cancelled"), v.literal("ready"), v.literal("active")),
    publicToken: v.optional(v.string()),
  }).index("by_business", ["businessId"]),

  timeline: defineTable({
    businessId: v.id("businesses"),
    referenceType: v.string(),
    referenceId: v.string(),
    eventType: v.string(),
    description: v.string(),
    occurredAt: v.string(),
    actor: v.string(),
  }).index("by_business", ["businessId"]),

  inspections: defineTable({
    businessId: v.id("businesses"),
    rentalId: v.id("rentals"),
    vehicleId: v.id("vehicles"),
    inspectionType: v.union(v.literal("PreRental"), v.literal("PostRental")),
    notes: v.optional(v.string()),
    photoUrls: v.array(v.string()),
    status: v.union(v.literal("Pending"), v.literal("Completed"), v.literal("Failed")),
    inspectionDate: v.optional(v.string()),
  }).index("by_business", ["businessId"]),

  rentals: defineTable({
    businessId: v.id("businesses"),
    reservationId: v.id("reservations"),
    vehicleId: v.id("vehicles"),
    customerId: v.optional(v.id("customers")),
    actualStart: v.optional(v.string()),
    actualEnd: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("completed")),
    odometerStart: v.optional(v.number()),
    odometerEnd: v.optional(v.number()),
    publicToken: v.optional(v.string()),
  }).index("by_business", ["businessId"]).index("by_status", ["status"]),

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
