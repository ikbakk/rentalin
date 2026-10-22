import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireMembership } from "./tenancy";

// Legacy API kept fail-closed for older clients. New uploads use r2.createUpload.
export const generateUploadUrl = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requireMembership(ctx, businessId);
    throw new Error("Please refresh Rentalin to upload photos with R2");
  },
});

export const registerInspectionImage = mutation({
  args: { businessId: v.id("businesses"), storageId: v.id("_storage") },
  handler: async (ctx, { businessId }) => {
    await requireMembership(ctx, businessId);
    throw new Error("New legacy file claims are disabled; please refresh Rentalin");
  },
});

export const removePendingInspectionImage = mutation({
  args: { businessId: v.id("businesses"), storageId: v.id("_storage") },
  handler: async (ctx, { businessId, storageId }) => {
    const membership = await requireMembership(ctx, businessId);
    const claim = await ctx.db.query("uploadClaims").withIndex("by_storage", q => q.eq("storageId", storageId)).unique();
    if (!claim || claim.businessId !== businessId || claim.uploadedBy !== membership.userId) throw new Error("Image not found");
    if (claim.status !== "pending") throw new Error("An attached inspection photo cannot be removed");
    await ctx.storage.delete(storageId);
    await ctx.db.delete(claim._id);
  },
});
