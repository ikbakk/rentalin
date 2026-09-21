import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const updateByExternalId = mutation({
  args: {
    externalId: v.string(),
    name: v.string(),
    address: v.string(),
    phone: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { externalId, ...updates }) => {
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
      .unique();
    if (!business) throw new Error("Business not found");
    await ctx.db.patch(business._id, updates);
    return ctx.db.get(business._id);
  },
});

export const getByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) =>
    ctx.db
      .query("businesses")
      .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
      .unique(),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db
      .query("businesses")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique(),
});
