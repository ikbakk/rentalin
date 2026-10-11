import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireMembership } from "./tenancy";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const generateUploadUrl = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requireMembership(ctx, businessId);
    return ctx.storage.generateUploadUrl();
  },
});

export const registerInspectionImage = mutation({
  args: { businessId: v.id("businesses"), storageId: v.id("_storage") },
  handler: async (ctx, { businessId, storageId }) => {
    const membership = await requireMembership(ctx, businessId);
    const metadata = await ctx.db.system.get("_storage", storageId);
    if (!metadata || !metadata.contentType || !ALLOWED_IMAGE_TYPES.has(metadata.contentType) || metadata.size > MAX_IMAGE_SIZE) {
      throw new Error("Image must be JPEG, PNG, or WebP and no larger than 5 MB");
    }

    const existing = await ctx.db.query("uploadClaims").withIndex("by_storage", q => q.eq("storageId", storageId)).unique();
    if (existing) {
      if (existing.businessId !== businessId || existing.uploadedBy !== membership.userId) throw new Error("File is already claimed");
      return storageId;
    }

    await ctx.db.insert("uploadClaims", {
      businessId,
      storageId,
      uploadedBy: membership.userId,
      contentType: metadata.contentType,
      size: metadata.size,
      status: "pending",
    });
    return storageId;
  },
});
