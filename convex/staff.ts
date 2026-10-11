import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requirePermission } from "./tenancy";

async function hashInvitation(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await requirePermission(ctx, businessId, "manageBusiness");
    const businessMembers = await ctx.db.query("memberships").withIndex("by_business", q => q.eq("businessId", businessId)).collect();
    return Promise.all(businessMembers.map(async (membership) => {
      const user = await ctx.db.get(membership.userId);
      return {
        membershipId: membership._id,
        userId: membership.userId,
        email: user?.email ?? "",
        name: user?.name ?? "",
        role: membership.role,
        isActive: membership.isActive,
      };
    }));
  },
});

export const createInvitation = mutation({
  args: { businessId: v.id("businesses"), email: v.string(), role: v.union(v.literal("admin"), v.literal("staff")) },
  handler: async (ctx, { businessId, email, role }) => {
    const membership = await requirePermission(ctx, businessId, "manageBusiness");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) throw new Error("Enter a valid email address");
    const token = crypto.randomUUID() + crypto.randomUUID();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    await ctx.db.insert("staffInvitations", {
      businessId,
      email: normalizedEmail,
      role,
      tokenHash: await hashInvitation(token),
      expiresAt,
      invitedBy: membership.userId,
    });
    return { token, expiresAt };
  },
});

export const acceptInvitation = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    if (token.length < 32 || token.length > 128) throw new Error("Invalid or expired invitation");
    const user = await ctx.db.get(userId);
    const tokenHash = await hashInvitation(token);
    const invitation = await ctx.db.query("staffInvitations")
      .withIndex("by_token_hash", q => q.eq("tokenHash", tokenHash))
      .unique();
    if (!invitation || invitation.usedAt || invitation.expiresAt <= Date.now()) throw new Error("Invalid or expired invitation");
    if (user?.email?.trim().toLowerCase() !== invitation.email) throw new Error("Invitation email does not match your account");

    const existing = await ctx.db.query("memberships")
      .withIndex("by_user_and_business", q => q.eq("userId", userId).eq("businessId", invitation.businessId))
      .unique();
    if (existing?.isActive) throw new Error("You already belong to this business");
    if (existing) await ctx.db.patch(existing._id, { role: invitation.role, isActive: true });
    else await ctx.db.insert("memberships", { userId, businessId: invitation.businessId, role: invitation.role, isActive: true });

    await ctx.db.patch(invitation._id, { usedAt: Date.now() });
    const preferences = await ctx.db.query("userPreferences").withIndex("by_user", q => q.eq("userId", userId)).unique();
    if (preferences) await ctx.db.patch(preferences._id, { activeBusinessId: invitation.businessId });
    else await ctx.db.insert("userPreferences", { userId, activeBusinessId: invitation.businessId });
    return { businessId: invitation.businessId, role: invitation.role };
  },
});

export const deactivateMembership = mutation({
  args: { membershipId: v.id("memberships") },
  handler: async (ctx, { membershipId }) => {
    const membership = await ctx.db.get(membershipId);
    if (!membership) throw new Error("Membership not found");
    const actor = await requirePermission(ctx, membership.businessId, "manageBusiness");
    if (!membership.isActive) return null;
    if (membership.userId === actor.userId) throw new Error("Ask another owner to deactivate your account from this business");
    if (membership.role === "owner") {
      const owners = (await ctx.db.query("memberships").withIndex("by_business", q => q.eq("businessId", membership.businessId)).collect())
        .filter((item) => item.role === "owner" && item.isActive);
      if (owners.length <= 1) throw new Error("A business must keep at least one active owner");
    }
    await ctx.db.patch(membershipId, { isActive: false });
    return null;
  },
});
