import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireMembership } from "./tenancy";
const vehicleArgs = { licensePlate: v.string(), make: v.string(), model: v.string(), year: v.number(), color: v.string(), seatingCapacity: v.number(), dailyRate: v.number(), currency: v.string() };
export const list = query({ args: { businessId: v.id("businesses") }, handler: async (ctx, { businessId }) => { await requireMembership(ctx, businessId); return ctx.db.query("vehicles").withIndex("by_business", q => q.eq("businessId", businessId)).collect(); } });
export const get = query({ args: { id: v.id("vehicles") }, handler: async (ctx, { id }) => { const item = await ctx.db.get(id); if (item) await requireMembership(ctx, item.businessId); return item; } });
export const create = mutation({ args: { businessId: v.id("businesses"), ...vehicleArgs }, handler: async (ctx, { businessId, licensePlate, ...vehicle }) => { await requireMembership(ctx, businessId); return ctx.db.insert("vehicles", { ...vehicle, businessId, plateNumber: licensePlate, status: "available" }); } });
export const update = mutation({ args: { id: v.id("vehicles"), ...vehicleArgs }, handler: async (ctx, { id, licensePlate, ...vehicle }) => { const item = await ctx.db.get(id); if (!item) throw new Error("Vehicle not found"); await requireMembership(ctx, item.businessId); await ctx.db.patch(id, { ...vehicle, plateNumber: licensePlate }); return ctx.db.get(id); } });
