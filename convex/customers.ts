import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function businessFor(ctx: any, externalId: string) {
  return ctx.db.query("businesses").withIndex("by_external_id", (q: any) => q.eq("externalId", externalId)).unique();
}

export const list = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    const business = await businessFor(ctx, externalId);
    return business ? ctx.db.query("customers").withIndex("by_business", (q) => q.eq("businessId", business._id)).collect() : [];
  },
});

export const get = query({
  args: { id: v.id("customers") },
  handler: (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: { externalId: v.string(), name: v.string(), phoneNumber: v.string(), email: v.string(), notes: v.optional(v.string()) },
  handler: async (ctx, { externalId, ...data }) => {
    const business = await businessFor(ctx, externalId);
    if (!business) throw new Error("Business not found");
    return ctx.db.insert("customers", { ...data, businessId: business._id });
  },
});

export const update = mutation({
  args: { id: v.id("customers"), name: v.string(), phoneNumber: v.string(), email: v.string(), notes: v.optional(v.string()) },
  handler: async (ctx, { id, ...data }) => {
    await ctx.db.patch(id, data);
    return ctx.db.get(id);
  },
});
