import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

type AuthCtx = QueryCtx | MutationCtx;
type Permission = "read" | "operate" | "manageFleet" | "managePayments" | "manageBusiness";

const permissionRoles: Record<Permission, readonly ("owner" | "admin" | "staff")[]> = {
  read: ["owner", "admin", "staff"],
  operate: ["owner", "admin", "staff"],
  manageFleet: ["owner", "admin"],
  managePayments: ["owner", "admin"],
  manageBusiness: ["owner"],
};

export async function requireMembership(ctx: AuthCtx, businessId: Id<"businesses">) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");

  const business = await ctx.db.get(businessId);
  if (!business) throw new Error("Business not found");

  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user_and_business", (q) => q.eq("userId", userId).eq("businessId", businessId))
    .unique();
  if (!membership?.isActive) throw new Error("Forbidden");
  return membership;
}

export async function requirePermission(
  ctx: AuthCtx,
  businessId: Id<"businesses">,
  permission: Permission,
) {
  const membership = await requireMembership(ctx, businessId);
  if (!permissionRoles[permission].includes(membership.role)) throw new Error("Forbidden");
  return membership;
}

export const ensureOnboarded = mutation({ args: {}, handler: async (ctx) => {
  const userId = await getAuthUserId(ctx); if (!userId) throw new Error("Unauthorized");
  const memberships = await ctx.db.query("memberships").withIndex("by_user", q => q.eq("userId", userId)).collect();
  const activeMembership = memberships.find((membership) => membership.isActive);
  if (activeMembership) return activeMembership.businessId;
  const suffix = String(userId).slice(-6).toLowerCase();
  const businessId = await ctx.db.insert("businesses", { name: "My Rental Business", slug: `rental-${suffix}`, createdBy: userId });
  await ctx.db.insert("memberships", { userId, businessId, role: "owner", isActive: true });
  await ctx.db.insert("userPreferences", { userId, activeBusinessId: businessId });
  return businessId;
}});

export const activeBusiness = query({ args: {}, handler: async (ctx) => {
  const userId = await getAuthUserId(ctx); if (!userId) return null;
  const memberships = await ctx.db.query("memberships").withIndex("by_user", q => q.eq("userId", userId)).collect();
  const activeMemberships = memberships.filter((membership) => membership.isActive);
  const preference = await ctx.db.query("userPreferences").withIndex("by_user", q => q.eq("userId", userId)).unique();
  const activeMembership = activeMemberships.find((membership) => membership.businessId === preference?.activeBusinessId)
    ?? activeMemberships[0];
  return activeMembership ? ctx.db.get(activeMembership.businessId) : null;
}});

export const myBusinesses = query({ args: {}, handler: async (ctx) => {
  const userId = await getAuthUserId(ctx); if (!userId) return [];
  const memberships = await ctx.db.query("memberships").withIndex("by_user", q => q.eq("userId", userId)).collect();
  const businesses = await Promise.all(memberships.filter(m => m.isActive).map(async m => {
    const business = await ctx.db.get(m.businessId);
    return business ? { ...business, role: m.role } : null;
  }));
  return businesses.filter((business) => business !== null);
}});

export const selectBusiness = mutation({ args: { businessId: v.id("businesses") }, handler: async (ctx, { businessId }) => {
  const membership = await requireMembership(ctx, businessId);
  const userId = membership.userId;
  const preference = await ctx.db.query("userPreferences").withIndex("by_user", q => q.eq("userId", userId)).unique();
  if (preference) await ctx.db.patch(preference._id, { activeBusinessId: businessId }); else await ctx.db.insert("userPreferences", { userId, activeBusinessId: businessId });
}});

export const createBusiness = mutation({ args: { name: v.string(), slug: v.string() }, handler: async (ctx, args) => {
  const userId = await getAuthUserId(ctx); if (!userId) throw new Error("Unauthorized");
  if (!args.name.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.slug)) throw new Error("Invalid business name or slug");
  if (await ctx.db.query("businesses").withIndex("by_slug", q => q.eq("slug", args.slug)).unique()) throw new Error("Slug already exists");
  const businessId = await ctx.db.insert("businesses", { ...args, createdBy: userId });
  await ctx.db.insert("memberships", { userId, businessId, role: "owner", isActive: true });
  const preference = await ctx.db.query("userPreferences").withIndex("by_user", q => q.eq("userId", userId)).unique();
  if (!preference) await ctx.db.insert("userPreferences", { userId, activeBusinessId: businessId });
  return businessId;
}});
