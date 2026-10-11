import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireMembership } from "./tenancy";

export const listByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requireMembership(ctx, businessId);
    return ctx.db
      .query("vehicles")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();
  },
});

export const listPublicByBusinessSlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!business) return [];

    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_business_and_status", (q) =>
        q.eq("businessId", business._id).eq("status", "available"),
      )
      .collect();
    return vehicles.map((vehicle) => ({
      _id: vehicle._id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      seatingCapacity: vehicle.seatingCapacity,
      dailyRate: vehicle.dailyRate,
      currency: vehicle.currency ?? "IDR",
    }));
  },
});
