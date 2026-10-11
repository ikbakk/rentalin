import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireMembership, requirePermission } from "./tenancy";
const status = v.union(v.literal("confirmed"), v.literal("preRental"), v.literal("cancelled"), v.literal("ready"), v.literal("active"));
export const list = query({ args: { businessId: v.id("businesses") }, handler: async (ctx, { businessId }) => { await requireMembership(ctx, businessId); return ctx.db.query("reservations").withIndex("by_business", q => q.eq("businessId", businessId)).collect(); } });
export const create = mutation({ args: { businessId: v.id("businesses"), inquiryId: v.optional(v.id("inquiries")), customerId: v.optional(v.id("customers")), vehicleId: v.id("vehicles"), startDate: v.string(), endDate: v.string(), estimatedCost: v.number(), currency: v.string() }, handler: async (ctx, { businessId, ...data }) => {
  await requireMembership(ctx, businessId);
  const vehicle = await ctx.db.get(data.vehicleId);
  if (!vehicle || vehicle.businessId !== businessId) throw new Error("Vehicle not found");
  if (data.customerId) {
    const customer = await ctx.db.get(data.customerId);
    if (!customer || customer.businessId !== businessId) throw new Error("Customer not found");
  }
  if (data.inquiryId) {
    const inquiry = await ctx.db.get(data.inquiryId);
    if (!inquiry || inquiry.businessId !== businessId || inquiry.vehicleId !== data.vehicleId) throw new Error("Inquiry not found");
    if (data.customerId && inquiry.customerId && inquiry.customerId !== data.customerId) throw new Error("Inquiry customer does not match");
  }
  return ctx.db.insert("reservations", { ...data, businessId, status: "confirmed", publicToken: crypto.randomUUID() });
} });
export const setStatus = mutation({ args: { id: v.id("reservations"), status }, handler: async (ctx, { id, status }) => { const item = await ctx.db.get(id); if (!item) throw new Error("Reservation not found"); await requireMembership(ctx, item.businessId); return ctx.db.patch(id, { status }); } });
export const rotateTrackingToken = mutation({ args: { id: v.id("reservations") }, handler: async (ctx, { id }) => {
  const item = await ctx.db.get(id);
  if (!item) throw new Error("Reservation not found");
  await requirePermission(ctx, item.businessId, "manageBusiness");
  const publicToken = crypto.randomUUID();
  await ctx.db.patch(id, { publicToken });
  return publicToken;
} });
