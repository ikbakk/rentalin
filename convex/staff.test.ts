/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: "owner@example.test" });
    const invitedUserId = await ctx.db.insert("users", { email: "new.admin@example.test" });
    const otherUserId = await ctx.db.insert("users", { email: "wrong@example.test" });
    const businessId = await ctx.db.insert("businesses", { name: "Rental A", slug: "rental-a" });
    const ownerMembershipId = await ctx.db.insert("memberships", { userId: ownerId, businessId, role: "owner", isActive: true });
    const staffMembershipId = await ctx.db.insert("memberships", { userId: otherUserId, businessId, role: "staff", isActive: true });
    return { ownerId, invitedUserId, otherUserId, businessId, ownerMembershipId, staffMembershipId };
  });
  return {
    t,
    ...ids,
    owner: t.withIdentity({ subject: String(ids.ownerId) }),
    invited: t.withIdentity({ subject: String(ids.invitedUserId) }),
    staff: t.withIdentity({ subject: String(ids.otherUserId) }),
  };
}

test("owner invitation grants only its assigned role, is email-bound, and is single-use", async () => {
  const { t, owner, invited, businessId, invitedUserId } = await setup();
  const invitation = await owner.mutation(api.staff.createInvitation, {
    businessId,
    email: " New.Admin@example.test ",
    role: "admin",
  });
  const stored = await t.run((ctx) => ctx.db.query("staffInvitations").withIndex("by_business", q => q.eq("businessId", businessId)).unique());
  expect(stored?.tokenHash).not.toBe(invitation.token);
  await expect(invited.mutation(api.staff.acceptInvitation, { token: invitation.token })).resolves.toMatchObject({ businessId, role: "admin" });
  await expect(invited.mutation(api.staff.acceptInvitation, { token: invitation.token })).rejects.toThrow("Invalid or expired");
  await expect(t.run((ctx) => ctx.db.query("memberships").withIndex("by_user_and_business", q => q.eq("userId", invitedUserId).eq("businessId", businessId)).unique())).resolves.toMatchObject({ role: "admin", isActive: true });
});

test("staff cannot invite, wrong email cannot accept, and expired invitations fail", async () => {
  const { t, owner, staff, invited, businessId } = await setup();
  await expect(staff.mutation(api.staff.createInvitation, { businessId, email: "someone@example.test", role: "admin" })).rejects.toThrow("Forbidden");
  const invitation = await owner.mutation(api.staff.createInvitation, { businessId, email: "new.admin@example.test", role: "staff" });
  await expect(staff.mutation(api.staff.acceptInvitation, { token: invitation.token })).rejects.toThrow("does not match");

  const invitationId = await t.run(async (ctx) => (await ctx.db.query("staffInvitations").withIndex("by_business", q => q.eq("businessId", businessId)).collect())[0]._id);
  await t.run((ctx) => ctx.db.patch(invitationId, { expiresAt: Date.now() - 1 }));
  await expect(invited.mutation(api.staff.acceptInvitation, { token: invitation.token })).rejects.toThrow("Invalid or expired");
});

test("last active owner cannot be deactivated", async () => {
  const { owner, ownerMembershipId } = await setup();
  await expect(owner.mutation(api.staff.deactivateMembership, { membershipId: ownerMembershipId })).rejects.toThrow("Ask another owner");
});
