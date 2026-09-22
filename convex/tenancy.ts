import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export async function requireMembership(ctx: any, businessId: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const membership = await ctx.db.query("memberships").withIndex("by_user_and_business", (q: any) => q.eq("userId", userId).eq("businessId", businessId)).unique();
  if (!membership?.isActive) throw new Error("Forbidden");
  return membership;
}

export const ensureOnboarded = mutation({ args: {}, handler: async (ctx) => {
  const userId = await getAuthUserId(ctx); if (!userId) throw new Error("Unauthorized");
  const memberships = await ctx.db.query("memberships").withIndex("by_user", q => q.eq("userId", userId)).collect();
  if (memberships.length) return memberships[0].businessId;
  const suffix = String(userId).slice(-6).toLowerCase();
  const businessId = await ctx.db.insert("businesses", { name: "My Rental Business", slug: `rental-${suffix}`, createdBy: userId });
  await ctx.db.insert("memberships", { userId, businessId, role: "owner", isActive: true });
  await ctx.db.insert("userPreferences", { userId, activeBusinessId: businessId });
  return businessId;
}});

export const activeBusiness = query({ args: {}, handler: async (ctx) => {
  const userId = await getAuthUserId(ctx); if (!userId) return null;
  const preference = await ctx.db.query("userPreferences").withIndex("by_user", q => q.eq("userId", userId)).unique();
  if (preference?.activeBusinessId) return ctx.db.get(preference.activeBusinessId);
  const membership = await ctx.db.query("memberships").withIndex("by_user", q => q.eq("userId", userId)).first();
  return membership ? ctx.db.get(membership.businessId) : null;
}});

export const myBusinesses = query({ args: {}, handler: async (ctx) => {
  const userId = await getAuthUserId(ctx); if (!userId) return [];
  const memberships = await ctx.db.query("memberships").withIndex("by_user", q => q.eq("userId", userId)).collect();
  return Promise.all(memberships.filter(m => m.isActive).map(async m => ({ ...(await ctx.db.get(m.businessId))!, role: m.role })));
}});

export const selectBusiness = mutation({ args: { businessId: v.id("businesses") }, handler: async (ctx, { businessId }) => {
  const membership = await requireMembership(ctx, businessId);
  const userId = membership.userId;
  const preference = await ctx.db.query("userPreferences").withIndex("by_user", q => q.eq("userId", userId)).unique();
  if (preference) await ctx.db.patch(preference._id, { activeBusinessId: businessId }); else await ctx.db.insert("userPreferences", { userId, activeBusinessId: businessId });
}});

export const createBusiness = mutation({ args: { name: v.string(), slug: v.string() }, handler: async (ctx, args) => {
  const userId = await getAuthUserId(ctx); if (!userId) throw new Error("Unauthorized");
  if (await ctx.db.query("businesses").withIndex("by_slug", q => q.eq("slug", args.slug)).unique()) throw new Error("Slug already exists");
  const businessId = await ctx.db.insert("businesses", { ...args, createdBy: userId });
  await ctx.db.insert("memberships", { userId, businessId, role: "owner", isActive: true });
  const preference = await ctx.db.query("userPreferences").withIndex("by_user", q => q.eq("userId", userId)).unique();
  if (!preference) await ctx.db.insert("userPreferences", { userId, activeBusinessId: businessId });
  return businessId;
}});
