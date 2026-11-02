import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireMembership } from "./tenancy";
import { ABANDONED_UPLOAD_MS, FINALIZE_WINDOW_MS, validateImage } from "./r2Rules";

const idArgs = { id: v.id("r2Uploads") };
async function owned(ctx: QueryCtx | MutationCtx, id: Id<"r2Uploads">) {
  const file = await ctx.db.get(id);
  if (!file) throw new Error("File not found");
  const membership = await requireMembership(ctx, file.businessId);
  if (file.uploadedBy !== membership.userId) throw new Error("File not found");
  return file;
}

export const reserve = internalMutation({
  args: { businessId: v.id("businesses"), contentType: v.string(), size: v.number() },
  handler: async (ctx, args) => {
    const membership = await requireMembership(ctx, args.businessId);
    validateImage(args.contentType, args.size);
    // Bound abandoned reservations per user; cleanup also removes never-uploaded objects.
    const pending = await ctx.db.query("r2Uploads").withIndex("by_uploader", q => q.eq("uploadedBy", membership.userId))
      .filter(q => q.and(q.neq(q.field("status"), "attached"), q.gt(q.field("expiresAt"), Date.now()))).take(21);
    if (pending.length >= 20) throw new Error("Too many pending uploads; remove unused photos first");
    const suffix = crypto.randomUUID();
    const id = await ctx.db.insert("r2Uploads", {
      ...args, uploadedBy: membership.userId,
      stagingKey: `staging/${args.businessId}/${membership.userId}/${suffix}`,
      objectKey: `inspections/${args.businessId}/${suffix}`,
      status: "uploading", expiresAt: Date.now() + ABANDONED_UPLOAD_MS,
      uploadDeadline: Date.now() + FINALIZE_WINDOW_MS,
    });
    return (await ctx.db.get(id))!;
  },
});

export const beginFinalize = internalMutation({ args: idArgs, handler: async (ctx, { id }) => {
  const file = await owned(ctx, id);
  if (file.status === "ready" || file.status === "attached") return { ...file, alreadyReady: true };
  if (file.status === "verifying") throw new Error("Photo is already being verified; try again shortly");
  if (file.status !== "uploading" || file.uploadDeadline <= Date.now()) throw new Error("Upload expired; choose the photo again");
  await ctx.db.patch(id, { status: "verifying" });
  return { ...file, status: "verifying" as const, alreadyReady: false };
} });

export const markReady = internalMutation({ args: idArgs, handler: async (ctx, { id }) => {
  const file = await owned(ctx, id);
  if (file.status !== "verifying" || file.expiresAt <= Date.now()) throw new Error("Upload is no longer pending");
  await ctx.db.patch(id, { status: "ready" });
} });

export const cancelVerification = internalMutation({ args: idArgs, handler: async (ctx, { id }) => {
  const file = await ctx.db.get(id);
  if (file?.status === "verifying") await ctx.db.patch(id, { status: "uploading" });
} });

export const forRead = internalQuery({ args: idArgs, handler: async (ctx, { id }) => {
  const file = await ctx.db.get(id);
  if (!file) throw new Error("File not found");
  const member = await requireMembership(ctx, file.businessId);
  if (file.status !== "attached" && (file.status !== "ready" || file.expiresAt <= Date.now() || member.userId !== file.uploadedBy)) throw new Error("File not found");
  return file;
} });

export const claimDelete = internalMutation({ args: idArgs, handler: async (ctx, { id }) => {
  const file = await owned(ctx, id);
  if (file.status === "attached") throw new Error("An attached inspection photo cannot be removed");
  if (file.status === "verifying") throw new Error("Photo is being verified; try again shortly");
  await ctx.db.patch(id, { status: "deleting", expiresAt: Date.now() });
  return file;
} });

export const expired = internalQuery({ args: {}, handler: async ctx => {
  const files = [];
  for (const status of ["uploading", "verifying", "ready", "deleting"] as const) {
    files.push(...await ctx.db.query("r2Uploads").withIndex("by_status_expiry", q => q.eq("status", status).lte("expiresAt", Date.now())).take(50));
  }
  return files.map(file => file._id);
} });

export const claimExpired = internalMutation({ args: idArgs, handler: async (ctx, { id }) => {
  const file = await ctx.db.get(id);
  if (!file || file.status === "attached" || file.expiresAt > Date.now()) return null;
  await ctx.db.patch(id, { status: "deleting" });
  return { ...file, status: "deleting" as const };
} });

export const finishDelete = internalMutation({ args: idArgs, handler: async (ctx, { id }) => {
  const file = await ctx.db.get(id);
  if (file?.status === "deleting") await ctx.db.delete(id);
} });
