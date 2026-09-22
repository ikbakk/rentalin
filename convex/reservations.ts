import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function businessFor(ctx: any, externalId: string) {
  return ctx.db.query("businesses").withIndex("by_external_id", (q: any) => q.eq("externalId", externalId)).unique();
}

const status = v.union(v.literal("confirmed"), v.literal("preRental"), v.literal("cancelled"), v.literal("ready"), v.literal("active"));

export const list = query({ args: { externalId: v.string() }, handler: async (ctx, { externalId }) => {
  const business = await businessFor(ctx, externalId);
  return business ? ctx.db.query("reservations").withIndex("by_business", q => q.eq("businessId", business._id)).collect() : [];
}});

export const create = mutation({
  args: { externalId: v.string(), inquiryId: v.optional(v.id("inquiries")), customerId: v.optional(v.id("customers")), vehicleId: v.id("vehicles"), startDate: v.string(), endDate: v.string(), estimatedCost: v.number(), currency: v.string() },
  handler: async (ctx, { externalId, ...data }) => {
    const business = await businessFor(ctx, externalId);
    if (!business) throw new Error("Business not found");
    return ctx.db.insert("reservations", { ...data, businessId: business._id, status: "confirmed" });
  },
});

export const setStatus = mutation({ args: { id: v.id("reservations"), status }, handler: (ctx, { id, status }) => ctx.db.patch(id, { status }) });
