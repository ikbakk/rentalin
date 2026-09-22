import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function businessFor(ctx: any, externalId: string) {
  return ctx.db.query("businesses").withIndex("by_external_id", (q: any) => q.eq("externalId", externalId)).unique();
}

export const listInquiries = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    const business = await businessFor(ctx, externalId);
    return business ? ctx.db.query("inquiries").withIndex("by_business", (q) => q.eq("businessId", business._id)).collect() : [];
  },
});

export const createInquiry = mutation({
  args: {
    externalId: v.string(), customerId: v.optional(v.id("customers")), customerName: v.string(), customerPhone: v.optional(v.string()), vehicleId: v.id("vehicles"), startDate: v.string(), endDate: v.optional(v.string()), notes: v.optional(v.string()),
  },
  handler: async (ctx, { externalId, customerPhone, endDate, ...data }) => {
    const business = await businessFor(ctx, externalId);
    if (!business) throw new Error("Business not found");
    const vehicle = await ctx.db.get(data.vehicleId);
    if (!vehicle || vehicle.businessId !== business._id) throw new Error("Vehicle not found");
    return ctx.db.insert("inquiries", { ...data, businessId: business._id, customerPhone: customerPhone ?? "", endDate: endDate ?? data.startDate, status: "new" });
  },
});

export const setInquiryStatus = mutation({
  args: { id: v.id("inquiries"), status: v.union(v.literal("new"), v.literal("contacted"), v.literal("converted"), v.literal("cancelled")) },
  handler: (ctx, { id, status }) => ctx.db.patch(id, { status }),
});
