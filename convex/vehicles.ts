import { query } from "./_generated/server";
import { v } from "convex/values";

export const listByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) =>
    ctx.db
      .query("vehicles")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect(),
});

export const listPublicByBusinessSlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!business) return [];

    return ctx.db
      .query("vehicles")
      .withIndex("by_business_and_status", (q) =>
        q.eq("businessId", business._id).eq("status", "available"),
      )
      .collect();
  },
});
