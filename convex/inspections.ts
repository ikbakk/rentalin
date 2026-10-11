import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireMembership } from "./tenancy";

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requireMembership(ctx, businessId);
    const inspections = await ctx.db.query("inspections").withIndex("by_business", q => q.eq("businessId", businessId)).collect();
    return Promise.all(inspections.map(async (inspection) => ({
      ...inspection,
      photoUrls: await Promise.all(inspection.photoUrls.map(async (photo) => {
        if (/^https?:\/\//.test(photo)) return photo;
        return await ctx.storage.getUrl(photo as Id<"_storage">) ?? "";
      })),
    })));
  },
});

export const create = mutation({
  args: { businessId: v.id("businesses"), rentalId: v.id("rentals"), inspectionType: v.union(v.literal("PreRental"), v.literal("PostRental")) },
  handler: async (ctx, { businessId, rentalId, inspectionType }) => {
    await requireMembership(ctx, businessId);
    const rental = await ctx.db.get(rentalId);
    if (!rental || rental.businessId !== businessId) throw new Error("Rental not found");
    return ctx.db.insert("inspections", { businessId, rentalId, vehicleId: rental.vehicleId, inspectionType, photoUrls: [], status: "Pending" });
  },
});

export const complete = mutation({
  args: { id: v.id("inspections"), photoUrls: v.array(v.string()) },
  handler: async (ctx, { id, photoUrls }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Inspection not found");
    await requireMembership(ctx, item.businessId);
    if (photoUrls.length > 10 || new Set(photoUrls).size !== photoUrls.length) throw new Error("An inspection can include up to 10 unique photos");

    const priorPhotos = new Set(item.photoUrls);
    for (const photo of photoUrls) {
      if (priorPhotos.has(photo) || /^https?:\/\//.test(photo)) continue;
      const storageId = photo as Id<"_storage">;
      const claim = await ctx.db.query("uploadClaims").withIndex("by_storage", q => q.eq("storageId", storageId)).unique();
      if (!claim || claim.businessId !== item.businessId) throw new Error("Photo is not registered to this business");
      if (claim.status === "pending") await ctx.db.patch(claim._id, { status: "attached" });
    }

    return ctx.db.patch(id, { photoUrls, status: "Completed", inspectionDate: new Date().toISOString() });
  },
});

export const fail = mutation({
  args: { id: v.id("inspections"), reason: v.string() },
  handler: async (ctx, { id, reason }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Inspection not found");
    await requireMembership(ctx, item.businessId);
    return ctx.db.patch(id, { notes: reason, status: "Failed", inspectionDate: new Date().toISOString() });
  },
});
