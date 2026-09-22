import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function businessFor(ctx: any, externalId: string) {
  return ctx.db.query("businesses").withIndex("by_external_id", (q: any) => q.eq("externalId", externalId)).unique();
}

export const list = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    const business = await businessFor(ctx, externalId);
    return business ? ctx.db.query("inspections").withIndex("by_business", q => q.eq("businessId", business._id)).collect() : [];
  },
});

export const create = mutation({
  args: { externalId: v.string(), rentalId: v.id("rentals"), inspectionType: v.union(v.literal("PreRental"), v.literal("PostRental")) },
  handler: async (ctx, { externalId, rentalId, inspectionType }) => {
    const business = await businessFor(ctx, externalId);
    const rental = await ctx.db.get(rentalId);
    if (!business || !rental || rental.businessId !== business._id) throw new Error("Rental not found");
    return ctx.db.insert("inspections", { businessId: business._id, rentalId, vehicleId: rental.vehicleId, inspectionType, photoUrls: [], status: "Pending" });
  },
});

export const complete = mutation({ args: { id: v.id("inspections"), photoUrls: v.array(v.string()) }, handler: (ctx, { id, photoUrls }) => ctx.db.patch(id, { photoUrls, status: "Completed", inspectionDate: new Date().toISOString() }) });
export const fail = mutation({ args: { id: v.id("inspections"), reason: v.string() }, handler: (ctx, { id, reason }) => ctx.db.patch(id, { notes: reason, status: "Failed", inspectionDate: new Date().toISOString() }) });
