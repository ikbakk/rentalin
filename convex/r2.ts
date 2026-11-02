"use node";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { r2Storage } from "./lib/r2Storage";
import { READ_URL_SECONDS, UPLOAD_URL_SECONDS } from "./r2Rules";

const idArgs = { id: v.id("r2Uploads") };
export const createUpload = action({
  args: { businessId: v.id("businesses"), contentType: v.string(), size: v.number() },
  handler: async (ctx, args): Promise<{ id: Id<"r2Uploads">; uploadUrl: string; expiresAt: number }> => {
    const storage = r2Storage();
    const file = await ctx.runMutation(internal.fileRecords.reserve, args);
    const uploadUrl = await storage.uploadUrl(file.stagingKey, file.contentType, file.size);
    return { id: file._id, uploadUrl, expiresAt: Date.now() + UPLOAD_URL_SECONDS * 1000 };
  },
});

export const finalizeUpload = action({ args: idArgs, handler: async (ctx, { id }): Promise<string> => {
  const storage = r2Storage();
  const file = await ctx.runMutation(internal.fileRecords.beginFinalize, { id });
  if (file.alreadyReady) return `r2:${id}`;
  try {
    await storage.promote(file.stagingKey, file.objectKey, file.contentType, file.size);
    await ctx.runMutation(internal.fileRecords.markReady, { id });
  } catch (error) {
    // Keep the record for cron retries even if R2 is temporarily unavailable.
    try { await storage.remove(file.objectKey); } catch { /* cleanup will retry */ }
    await ctx.runMutation(internal.fileRecords.cancelVerification, { id });
    throw error;
  }
  // Staging lifecycle is the backstop if deletion fails or the PUT URL is replayed.
  try { await storage.remove(file.stagingKey); } catch { console.warn("r2_staging_cleanup_deferred"); }
  return `r2:${id}`;
} });

export const readImage = action({ args: idArgs, handler: async (ctx, args): Promise<{ url: string; expiresAt: number }> => {
  const file = await ctx.runQuery(internal.fileRecords.forRead, args);
  const url = await r2Storage().readUrl(file.objectKey);
  return { url, expiresAt: Date.now() + READ_URL_SECONDS * 1000 };
} });

export const removeImage = action({ args: idArgs, handler: async (ctx, args): Promise<void> => {
  const storage = r2Storage();
  const file = await ctx.runMutation(internal.fileRecords.claimDelete, args);
  await storage.remove(file.stagingKey);
  await storage.remove(file.objectKey);
  await ctx.runMutation(internal.fileRecords.finishDelete, args);
} });

export const cleanup = internalAction({ args: {}, handler: async (ctx): Promise<void> => {
  const storage = r2Storage();
  const ids = await ctx.runQuery(internal.fileRecords.expired, {});
  for (const id of ids) {
    const file = await ctx.runMutation(internal.fileRecords.claimExpired, { id });
    if (!file) continue;
    try {
      await storage.remove(file.stagingKey);
      await storage.remove(file.objectKey);
      await ctx.runMutation(internal.fileRecords.finishDelete, { id });
    } catch {
      // No signed URLs, object names, user IDs or credentials in logs.
      console.error("r2_cleanup_failed");
    }
  }
} });
