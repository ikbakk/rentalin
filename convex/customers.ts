import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireMembership } from "./tenancy";
export const list = query({ args: { businessId: v.id("businesses") }, handler: async (ctx, { businessId }) => { await requireMembership(ctx, businessId); return ctx.db.query("customers").withIndex("by_business", q => q.eq("businessId", businessId)).collect(); } });
export const get = query({ args: { id: v.id("customers") }, handler: async (ctx, { id }) => { const item = await ctx.db.get(id); if (item) await requireMembership(ctx, item.businessId); return item; } });
export const create = mutation({ args: { businessId: v.id("businesses"), name: v.string(), phoneNumber: v.string(), email: v.string(), notes: v.optional(v.string()) }, handler: async (ctx, { businessId, ...data }) => { await requireMembership(ctx, businessId); return ctx.db.insert("customers", { ...data, businessId }); } });
export const update = mutation({ args: { id: v.id("customers"), name: v.string(), phoneNumber: v.string(), email: v.string(), notes: v.optional(v.string()) }, handler: async (ctx, { id, ...data }) => { const item = await ctx.db.get(id); if (!item) throw new Error("Customer not found"); await requireMembership(ctx, item.businessId); await ctx.db.patch(id, data); return ctx.db.get(id); } });
