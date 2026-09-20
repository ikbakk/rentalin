import { query } from "./_generated/server";
import { v } from "convex/values";

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
