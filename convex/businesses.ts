import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requirePermission } from "./tenancy";
import { isBusinessTimeZone } from "./businessTime";

export const updateSettings = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    address: v.string(),
    phone: v.string(),
    email: v.string(),
    timeZone: v.string(),
  },
  handler: async (ctx, { businessId, ...updates }) => {
    await requirePermission(ctx, businessId, "manageBusiness");
    if (!isBusinessTimeZone(updates.timeZone)) throw new Error("Choose a supported Indonesian time zone");
    await ctx.db.patch(businessId, updates);
    return ctx.db.get(businessId);
  },
});

export const getByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
      .unique();
    if (!business) return null;
    await requirePermission(ctx, business._id, "read");
    return business;
  },
});
