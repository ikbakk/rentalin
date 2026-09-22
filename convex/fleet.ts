import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const vehicleArgs = {
  licensePlate: v.string(),
  make: v.string(),
  model: v.string(),
  year: v.number(),
  color: v.string(),
  seatingCapacity: v.number(),
  dailyRate: v.number(),
  currency: v.string(),
};

export const listByBusinessExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
      .unique();
    if (!business) return [];
    return ctx.db
      .query("vehicles")
      .withIndex("by_business", (q) => q.eq("businessId", business._id))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("vehicles") },
  handler: (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: { externalId: v.string(), ...vehicleArgs },
  handler: async (ctx, { externalId, ...vehicle }) => {
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
      .unique();
    if (!business) throw new Error("Business not found");
    return ctx.db.insert("vehicles", {
      ...vehicle,
      businessId: business._id,
      plateNumber: vehicle.licensePlate,
      dailyRate: vehicle.dailyRate,
      status: "available",
    });
  },
});

export const update = mutation({
  args: { id: v.id("vehicles"), ...vehicleArgs },
  handler: async (ctx, { id, licensePlate, ...vehicle }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Vehicle not found");
    await ctx.db.patch(id, { ...vehicle, plateNumber: licensePlate });
    return ctx.db.get(id);
  },
});
