import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { assertVehicleAvailable, parseBookingInterval } from "./bookingRules";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { verifyTurnstile } from "./turnstile";

const inquiryArgs = {
    slug: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    vehicleId: v.id("vehicles"),
    startDate: v.string(),
    endDate: v.string(),
    notes: v.optional(v.string()),
};

// Keep the write path internal: there is no public mutation that bypasses Turnstile.
export const createPublic = action({
  args: { ...inquiryArgs, turnstileToken: v.string() },
  handler: async (ctx, { turnstileToken, ...args }): Promise<Id<"inquiries">> => {
    await verifyTurnstile(turnstileToken);
    return ctx.runMutation(internal.inquiries.createVerified, args);
  },
});

export const createVerified = internalMutation({
  args: inquiryArgs,
  handler: async (ctx, args) => {
    const customerName = args.customerName.trim();
    const customerPhone = args.customerPhone.replace(/\D/g, "");
    const interval = parseBookingInterval(args.startDate, args.endDate);
    if (customerName.length < 2 || customerName.length > 100) throw new Error("Enter a valid name");
    if (customerPhone.length < 8 || customerPhone.length > 15) throw new Error("Enter a valid phone number");
    if (args.notes && args.notes.length > 500) throw new Error("Notes are too long");

    const business = await ctx.db
      .query("businesses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!business) throw new Error("Business not found");

    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle || vehicle.businessId !== business._id || vehicle.status !== "available") {
      throw new Error("Vehicle not found");
    }

    await assertVehicleAvailable(ctx, vehicle, interval);
    const windowStart = Math.floor(Date.now() / 3600000) * 3600000;
    const bucket = await ctx.db.query("inquiryLimits").withIndex("by_business_window", q => q.eq("businessId", business._id).eq("windowStart", windowStart)).unique();
    if (bucket && bucket.count >= 60) throw new Error("Too many booking requests. Please contact the rental team.");

    const recentInquiries = await ctx.db
      .query("inquiries")
      .withIndex("by_business_and_phone", (q) => q.eq("businessId", business._id).eq("customerPhone", customerPhone))
      .order("desc")
      .take(3);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (recentInquiries.filter((inquiry) => inquiry._creationTime >= oneHourAgo).length >= 3) {
      throw new Error("Too many booking requests. Please try again later.");
    }

    if (bucket) await ctx.db.patch(bucket._id, { count: bucket.count + 1 });
    else await ctx.db.insert("inquiryLimits", { businessId: business._id, windowStart, count: 1 });
    return ctx.db.insert("inquiries", {
      businessId: business._id,
      vehicleId: args.vehicleId,
      customerName,
      customerPhone,
      startDate: interval.startDate,
      endDate: interval.endDate,
      notes: args.notes,
      status: "new",
    });
  },
});

export const cleanupLimits = internalMutation({ args: {}, handler: async ctx => {
  const stale = await ctx.db.query("inquiryLimits").withIndex("by_window", q => q.lt("windowStart", Date.now() - 48 * 3600000)).take(500);
  for (const bucket of stale) await ctx.db.delete(bucket._id);
} });
